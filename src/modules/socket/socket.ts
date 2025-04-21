import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthClient } from '../auth/config/grpc-client/auth.client';
import { Tokens, AuthenticatedSocket } from '../../interfaces/interface';
import bookingRabbitMqClient from '../booking/rabbitmq/client';
import driverRabbitMqClient from '../driver/rabbitmq/client';
import redisClient from '../../config/redis.config';
import 'dotenv/config';
import { Message } from 'amqplib';

export const setupSocketIO = (server: HttpServer): void => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Update to match your frontend origin
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  console.log('Socket.IO server initialized with CORS origin:', process.env.CORS_ORIGIN || 'http://localhost:5173');

  // JWT Authentication Middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    console.log("=========");
    
    const token = socket.handshake.query.token as string;
    const refreshToken = socket.handshake.query.refreshToken as string;

    if (!token) {
      console.error('Authentication error: Token missing');
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { clientId: string; role: string };
      socket.decoded = decoded;
      console.log(`Authenticated socket for ${decoded.role}: ${decoded.clientId}`);
      next();
    } catch (err) {
      if (!refreshToken) {
        console.error('Authentication error: Invalid token, no refresh token provided');
        return next(new Error('Authentication error: Invalid token'));
      }

      try {
        const result = await new Promise<Tokens>((resolve, reject) => {
          AuthClient.RefreshToken({ token: refreshToken }, (err: any, result: Tokens) => {
            if (err) reject(new Error('Invalid refresh token'));
            resolve(result);
          });
        });

        socket.emit('tokens-updated', {
          token: result.accessToken,
          refreshToken: result.refreshToken,
        });

        const decoded = jwt.verify(result.accessToken, process.env.JWT_SECRET as string) as { clientId: string; role: string };
        socket.decoded = decoded;
        console.log(`Token refreshed for ${decoded.role}: ${decoded.clientId}`);
        next();
      } catch (error) {
        console.error('Authentication error: Token refresh failed', error);
        return next(new Error('Authentication error: Token refresh failed'));
      }
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.decoded) {
      console.error('Decoded token missing, disconnecting socket');
      socket.disconnect();
      return;
    }

    const { clientId: userId, role } = socket.decoded;
    console.log(`${role} connected: ${userId}`);

    socket.join(role === 'Driver' ? `driver:${userId}` : `user:${userId}`);

    socket.on('driverLocation', async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      if (role !== 'Driver') {
        socket.emit('error', 'Unauthorized');
        return;
      }
    
      console.log("Received driver location update:", latitude, longitude);
    
      try {
        const driverDetailsKey = `onlineDriver:details:${userId}`;
    
        const isAlreadyOnline = await redisClient.exists(driverDetailsKey);
    
        if (!isAlreadyOnline) {
          const operation = "get-online-driver";
          const response: Message = await driverRabbitMqClient.produce({ id:userId }, operation) as Message;
    
          console.log("Fetched driver details from RabbitMQ:", response);
    
          await redisClient.set(driverDetailsKey, JSON.stringify(response));
        }
    
        await redisClient.geoAdd('driver:locations', {
          longitude,
          latitude,
          member: userId,
        });
    
        socket.emit('location-updated', {
          status: 'success',
          latitude,
          longitude,
        });
      } catch (error) {
        console.error('Error updating driver location:', error);
        socket.emit('error', 'Failed to update location');
      }
    });
    
    

    socket.on('disconnect', async () => {
      console.log(`${role} disconnected: ${userId}`);
      if (role === 'Driver') {
        try {
          await redisClient.del(`onlineDriver:details:${userId}`);
          await redisClient.zRem('driver:locations', userId);
          await bookingRabbitMqClient.produce(
            { driverId: userId, status: 'offline' },
            'driver-status'
          );
        } catch (error) {
          console.error('Error handling driver disconnect:', error);
        }
      }
    });
  });
};