import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthClient } from '../auth/config/grpc-client/auth.client';
import { Tokens, AuthenticatedSocket } from '../../interfaces/interface';
import bookingRabbitMqClient from '../booking/rabbitmq/client';
import redisClient from '../../config/redis.config';
import 'dotenv/config';

export const setupSocketIO = (server: HttpServer): void => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    },
  });

  // JWT Authentication Middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    console.log("hooi");
    
    const token = socket.handshake.query.token as string;
    const refreshToken = socket.handshake.query.refreshToken as string;

    if (!token) {
        console.log("token faild");
        
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { clientId: string; role: string };
      socket.decoded = decoded;
      next();
    } catch (err) {
      if (!refreshToken) {
        return next(new Error('Authentication error: Invalid token'));
      }

      try {
        const result = await new Promise<Tokens>((resolve, reject) => {
          AuthClient.RefreshToken({ token: refreshToken }, (err: any, result: Tokens) => {
            if (err) reject(new Error('Invalid refresh token'));
            resolve(result);
          });
        });
console.log("result",result);

        socket.emit('tokens-updated', {
          token: result.accessToken,
          refreshToken: result.refreshToken,
        });

        const decoded = jwt.verify(result.accessToken, process.env.JWT_SECRET as string) as { clientId: string; role: string };
        socket.decoded = decoded;
        next();
      } catch (error) {
        return next(new Error('Authentication error: Token refresh failed'));
      }
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.decoded) {
        console.log('Decoded token missing');
        return;
      }
      const { clientId: userId, role } = socket.decoded;
    
    console.log(`${role} connected: ${userId}`);

    // Join user/driver-specific room
    socket.join(role === 'Driver' ? `driver:${userId}` : `user:${userId}`);

    // Driver location update
    socket.on('driverLocation', async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      if (role !== 'Driver') return socket.emit('error', 'Unauthorized');

      try {
        await redisClient.geoAdd('driver:locations', { longitude, latitude, member: userId });
        await bookingRabbitMqClient.produce(
          { driverId: userId, latitude, longitude },
          'driver-location'
        );
      } catch (error) {
        console.error('Error updating driver location:', error);
        socket.emit('error', 'Failed to update location');
      }
    });


    socket.on('disconnect', () => {
      console.log(`${role} disconnected: ${userId}`);
    });
  });
};