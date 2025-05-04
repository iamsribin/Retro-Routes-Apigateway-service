import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthClient } from '../auth/config/grpc-client/auth.client';
import { Tokens, AuthenticatedSocket } from '../../interfaces/interface';
import bookingRabbitMqClient from '../booking/rabbitmq/client';
import driverRabbitMqClient from '../driver/rabbitmq/client';
import redisClient from '../../config/redis.config';
import { Message } from 'amqplib';

interface BookingResponse {
  nearbyDrivers: { driverId: string; distance: number; rating: number; cancelCount: number }[];
  booking: { id: string; ride_id: string; status: string; message?: string };
  userPickupCoordinators: { address: string; latitude: number; longitude: number };
  userDropCoordinators: { address: string; latitude: number; longitude: number };
  distance: string;
  price: number;
  message?: string;
  status?: string;
}

interface Booking {
  ride_id: string;
  user_id: string;
  pickupCoordinates: { latitude: number; longitude: number };
  dropoffCoordinates: { latitude: number; longitude: number };
  pickupLocation: string;
  dropoffLocation: string;
  distance: string;
  vehicleModel: string;
  price: number;
  status: string;
  // pin: number;
  _id: string;
  date: string;
}

interface RideRequestData {
  ride_id: string;
  userId: string;
  pickup: string;
  dropoff: string;
  distance: string;
  price: number;
  customer: { name: string; location: [number, number]; rating?: number };
  vehicleModel: string;
  bookingId?: string;
  timeout?: number;
  booking: Booking;
}

export const setupSocketIO = (server: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  console.log(`Socket.IO server initialized with CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);

  // Middleware for authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.query.token as string;
    const refreshToken = socket.handshake.query.refreshToken as string;

    if (!token) {
      console.error('Authentication error: Token missing');
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        clientId: string;
        role: string;
      };
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

        const decoded = jwt.verify(result.accessToken, process.env.JWT_SECRET as string) as {
          clientId: string;
          role: string;
        };
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

    // Driver location update 
    socket.on('driverLocation', async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      if (role !== 'Driver') {
        socket.emit('error', { message: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
      }

      console.log('Received driver location update:', latitude, longitude);

      try {
        const driverDetailsKey = `onlineDriver:details:${userId}`;
        const isAlreadyOnline = await redisClient.exists(driverDetailsKey);

        if (!isAlreadyOnline) {
          const operation = 'get-online-driver';
          const response = (await driverRabbitMqClient.produce({ id: userId }, operation)) as Message;
          console.log('Fetched driver details from RabbitMQ:', response);
          await redisClient.set(driverDetailsKey, JSON.stringify(response));
        }

        await redisClient.geoAdd('driver:locations', { longitude, latitude, member: userId });

        socket.emit('location-updated', { status: 'success', latitude, longitude });
      } catch (error) {
        console.error('Error updating driver location:', error);
        socket.emit('error', { message: 'Failed to update location', code: 'LOCATION_UPDATE_FAILED' });
      }
    });

    const sendRideRequest = (driverId: string, rideData: RideRequestData, stopSignal: { stop: boolean }): Promise<boolean> => {
      return new Promise((resolve) => {
        const timeoutDuration = 30000;
        let timeout: NodeJS.Timeout;

        const enrichedRideData = {
          ...rideData,
          timeout: timeoutDuration,
          bookingId: rideData.ride_id,
        };

        console.log(`Sending ride request to driver ${driverId}:`, enrichedRideData);

        socket.to(`driver:${driverId}`).emit('rideRequest', enrichedRideData);

        const responseHandler = (response: { ride_id: string; accepted: boolean }) => {
          console.log("responseHandler:::", response);

          if (response.ride_id === rideData.ride_id) {
            clearTimeout(timeout);
            socket.off(`rideResponse:${rideData.ride_id}`, responseHandler);
            resolve(response.accepted);
          }
        };

        socket.on(`rideResponse:${rideData.ride_id}`, responseHandler);

        timeout = setTimeout(async () => {
          socket.off(`rideResponse:${rideData.ride_id}`, responseHandler);
          if (!stopSignal.stop) {
            try {
              const operation = 'update-driver-cancel-count';
              await driverRabbitMqClient.produce({ id: driverId }, operation);
              console.log(`Cancellation count incremented for driver ${driverId} due to timeout`);
            } catch (error) {
              console.error(`Error incrementing cancellation count for driver ${driverId}:`, error);
            }
          }
          resolve(false);
        }, timeoutDuration);
      });
    };

    socket.on('requestRide',
      async (rideData: {
        pickupLocation: { address: string; latitude: number; longitude: number };
        dropoffLocation: { address: string; latitude: number; longitude: number };
        vehicleModel: string;
      }) => {
        if (role !== 'User') {
          socket.emit('error', { message: 'Unauthorized', code: 'UNAUTHORIZED' });
          return;
        }

        try {
          const ride = (await bookingRabbitMqClient.produce(
            {
              userId,
              pickupLocation: rideData.pickupLocation,
              dropoffLocation: rideData.dropoffLocation,
              vehicleModel: rideData.vehicleModel,
            },
            'create-booking'
          )) as BookingResponse;

          if (ride.status === 'Failed') {
            socket.emit('rideStatus', {
              ride_id: ride.booking?.ride_id || 'unknown',
              status: 'Failed',
              message: ride.message || 'Failed to create booking',
              code: 'BOOKING_CREATION_FAILED',
            });
            return;
          }

          if (!ride.nearbyDrivers?.length) {
            const data = { id: ride.booking.id, action: 'Cancelled' };
            await bookingRabbitMqClient.produce(data, 'update-booking-status');
            socket.emit('rideStatus', {
              ride_id: ride.booking.ride_id,
              status: 'Failed',
              message: 'No drivers available',
              code: 'NO_DRIVERS_AVAILABLE',
            });
            return;
          }

          const stopSignal = { stop: false };

          for (const driver of ride.nearbyDrivers) {
            if (stopSignal.stop) {
              console.log(`Stopped sending ride requests for ride ${ride.booking.ride_id}`);
              break;
            }

            const rideRequestData: RideRequestData = {
              ride_id: ride.booking.ride_id,
              userId,
              pickup: ride.userPickupCoordinators.address,
              dropoff: ride.userDropCoordinators.address,
              distance: ride.distance,
              price: ride.price,
              customer: {
                name: 'Customer',
                location: [
                  ride.userPickupCoordinators.longitude,
                  ride.userPickupCoordinators.latitude,
                ],
                rating: 4.8,
              },
              vehicleModel: rideData.vehicleModel,
              bookingId: ride.booking.ride_id,
              timeout: 30000,
              booking: {
                ride_id: ride.booking.ride_id,
                user_id: userId,
                pickupCoordinates: {
                  latitude: ride.userPickupCoordinators.latitude,
                  longitude: ride.userPickupCoordinators.longitude,
                },
                dropoffCoordinates: {
                  latitude: ride.userDropCoordinators.latitude,
                  longitude: ride.userDropCoordinators.longitude,
                },
                pickupLocation: ride.userPickupCoordinators.address,
                dropoffLocation: ride.userDropCoordinators.address,
                distance: ride.distance,
                vehicleModel: rideData.vehicleModel,
                price: ride.price,
                status: ride.booking.status,
                _id: ride.booking.id,
                date: new Date().toISOString(),
              },
            };

            const accepted = await sendRideRequest(driver.driverId, rideRequestData, stopSignal);

            if (accepted) {
              stopSignal.stop = true; 

              const data = { id: ride.booking.id, action: 'Accepted' };
              await bookingRabbitMqClient.produce(data, 'update-booking-status');

              // Fetch driver location and details from Redis
              const driverLocation = await redisClient.geoPos('driver:locations', driver.driverId);
              const driverDetailsKey = `onlineDriver:details:${driver.driverId}`;
              const driverDetailsRaw = await redisClient.get(driverDetailsKey);
              const driverDetails = driverDetailsRaw ? JSON.parse(driverDetailsRaw) : null;

              const driverCoordinates = driverLocation
                ? { longitude: driverLocation[0], latitude: driverLocation[1] }
                : null;

              socket.emit('rideStatus', {
                ride_id: ride.booking.ride_id,
                status: 'Accepted',
                driverId: driver.driverId,
                driverLocation: driverCoordinates,
                driverDetails: driverDetails || { id: driver.driverId, name: 'Unknown Driver', rating: driver.rating },
                booking: rideRequestData.booking,
              });

              return;
            } else {
              try {
                const operation = 'update-driver-cancel-count';
                await driverRabbitMqClient.produce({ id: driver.driverId }, operation);
                console.log(`Cancellation count incremented for driver ${driver.driverId}`);
              } catch (error) {
                console.error(`Error incrementing cancellation count for driver ${driver.driverId}:`, error);
              }
            }   
          }

          if (!stopSignal.stop) {
            const data = { id: ride.booking.id, action: 'Cancelled' };
            await bookingRabbitMqClient.produce(data, 'update-booking-status');
            socket.emit('rideStatus', {
              ride_id: ride.booking.ride_id,
              status: 'Failed',
              message: 'No driver accepted',
              code: 'NO_DRIVER_ACCEPTED',
            });
          }
        } catch (error) {
          console.error('Error processing ride request:', error);
          socket.emit('error', {
            message: 'Failed to create ride',
            code: 'RIDE_REQUEST_FAILED',
          });
        }
      }
    );

    socket.on('rideResponse', async (response: { ride_id: string; accepted: boolean }) => {
      if (role !== 'Driver') {
        socket.emit('error', { message: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
      }
      console.log(`Ride response from driver ${userId}:`, response);

      if (response.accepted) {
        try {
          const data = { id: response.ride_id, action: 'Accepted' };
          await bookingRabbitMqClient.produce(data, 'update-booking-status');
          console.log(`Booking status updated to Accepted for ride ${response.ride_id}`);
        } catch (error) {
          console.error('Error updating booking status:', error);
          socket.emit('error', {
            message: 'Failed to update booking status',
            code: 'BOOKING_STATUS_UPDATE_FAILED',
          });
        }
      }

      // Broadcast to the specific ride response event
      io.emit(`rideResponse:${response.ride_id}`, response);
    });

    socket.on('disconnect', async () => {
      console.log(`${role} disconnected: ${userId}`);
      if (role === 'Driver') {
        try {
          await redisClient.del(`onlineDriver:details:${userId}`);
          await redisClient.zRem('driver:locations', userId);
        } catch (error) {
          console.error('Error handling driver disconnect:', error);
        }
      }
    });
  });

  return io;
};



// jwt.sign(id,sign,);

// data=await jwt.verify(sign);