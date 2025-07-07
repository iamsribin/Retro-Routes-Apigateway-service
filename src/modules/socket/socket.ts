import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { AuthClient } from "../auth/config/grpc-client/auth.client";
import { Tokens, AuthenticatedSocket } from "../../interfaces/interface";
import bookingRabbitMqClient from "../booking/rabbitmq/client";
import driverRabbitMqClient from "../driver/rabbitmq/client";
import redisClient from "../../config/redis.config";
import { findNearbyDrivers } from "../../utils/findNearByDrivers";
import mongoose from "mongoose";

interface BookingResponse {
  data: {
    userData:{
      user_id: string;
      userName:string;
      profile:string;
    }
    booking: { id: string; ride_id: string; status: string;};
    userPickupCoordinators: { address: string; latitude: number; longitude: number };
    userDropCoordinators: { address: string; latitude: number; longitude: number };
    distance: string;
    price: number;
    duration:number;
    pin:number;
    message?: string;
  };
  status?: string;
}
interface CustomerDetails {
  id: string;
  name: string;
  profileImageUrl?: string;
}
interface Coordinates {
  latitude: number;
  longitude: number;
}
interface BookingInterface {
  data: {
 _id: mongoose.Types.ObjectId;
  ride_id: string;

  user: {
    user_id: string;
    userName: string;
    userNumber: string;
    userProfile: string;
  };

  driver: {
    driver_id: string;
    driverName: string;
    driverNumber: string;
    driverProfile: string;
  };

  pickupCoordinates: Coordinates;
  dropoffCoordinates: Coordinates;

  pickupLocation: string;
  dropoffLocation: string;

  driverCoordinates: Coordinates;

  distance: string;
  duration: string;
  vehicleModel: string;
  price: number;
  date: Date;
  status: 'Pending' | 'Accepted' | 'Confirmed' | 'Completed' | 'Cancelled';
  pin: number;
  paymentMode: string;
  feedback?: string;
  rating?: number;
  };
  message: string;
}

interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address: string;
}

interface RideDetails {
  rideId: string;
  estimatedDistance: string;
  estimatedDuration: string;
  fareAmount: number;
  vehicleType: string;
  securityPin: number;
}

interface BookingDetails {
  bookingId: string;
  userId: string;
  pickupLocation: LocationCoordinates;
  dropoffLocation: LocationCoordinates;
  rideDetails: RideDetails;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
}

interface DriverRideRequest {
  requestId: string;
  customer: CustomerDetails;
  pickup: LocationCoordinates;
  dropoff: LocationCoordinates;
  ride: RideDetails;
  booking: BookingDetails;
  requestTimeout: number;
  requestTimestamp: string;
}

const userSocketMap: { [key: string]: string } = {};

export const setupSocketIO = (server: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  console.log(`Socket.IO initialized with CORS origin: ${process.env.CORS_ORIGIN}`);

  io.use(authenticateSocket);

  io.on("connection", (socket: AuthenticatedSocket) => {
    handleSocketConnection(socket, io);
  });

  return io;
};

const refreshTokenWithAuthClient = (refreshToken: string): Promise<Tokens> => {
  return new Promise((resolve, reject) => {
    AuthClient.RefreshToken({ token: refreshToken }, (err: any, result: Tokens) => {
      if (err) reject(new Error("Invalid refresh token"));
      resolve(result);
    });
  });
};

const authenticateSocket = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  const { token, refreshToken } = socket.handshake.query as { token: string; refreshToken: string };

  if (!token) {
    console.error("Authentication error: Missing token");
    return next(new Error("Authentication error: Token missing"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      clientId: string;
      role: "User" | "Driver" | "Admin";
    };
    socket.decoded = decoded;
    console.log(`Authenticated ${decoded.role}: ${decoded.clientId}`);
    return next();
  } catch (err) {
    if (!refreshToken) {
      console.error("Authentication error: Invalid token, no refresh token");
      return next(new Error("Authentication error: Invalid token"));
    }

    try {
      const result = await refreshTokenWithAuthClient(refreshToken);
      socket.emit("tokens-updated", {
        token: result.accessToken,
        refreshToken: result.refreshToken,
      });

      const decoded = jwt.verify(result.accessToken, process.env.JWT_SECRET as string) as {
        clientId: string;
        role: "User" | "Driver" | "Admin";
      };
      socket.decoded = decoded;
      console.log(`Token refreshed for ${decoded.role}: ${decoded.clientId}`);
      return next();
    } catch (error) {
      console.error("Authentication error: Token refresh failed", error);
      return next(new Error("Authentication error: Token refresh failed"));
    }
  }
};

const handleSocketConnection = (socket: AuthenticatedSocket, io: SocketIOServer) => {
  if (!socket.decoded) {
    console.error("Missing decoded token, disconnecting");
    socket.disconnect();
    return;
  }

  const { clientId: userId, role } = socket.decoded;
  console.log(`${role} connected: ${userId}`);

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`Updated userSocketMap: ${JSON.stringify(userSocketMap)}`);
  }

  socket.join(`${role.toLowerCase()}:${userId}`);

  socket.on("register", (data: { userId: string; role: string }) => {
    if (data.userId && data.userId !== "undefined") {
      userSocketMap[data.userId] = socket.id;
      console.log(`Re-registered ${data.role} ${data.userId} in userSocketMap: ${JSON.stringify(userSocketMap)}`);
    }
  });

  setupChatEvents(socket, io, role, userId);
  setupDriverEvents(socket, io, role, userId);
  setupRideRequestEvents(socket, io, role, userId);
  if (role === "Admin") {
    setupAdminEvents(socket, io, userId);
  }
  setupDisconnectEvents(socket, io, role, userId);
};

const setupAdminEvents = (socket: AuthenticatedSocket, io: SocketIOServer, userId: string) => {
  socket.on("block-user", ({ userId: targetUserId }: { userId: string }) => {
    console.log(`Received block-user event for targetUserId: ${targetUserId} from admin: ${userId}`);
    const targetSocketId = userSocketMap[targetUserId];

    if (targetSocketId) {
      console.log(`Emitting user-blocked event to socket: ${targetSocketId} for user: ${targetUserId}`);
      io.to(targetSocketId).emit("user-blocked");
    } else {
      console.error(`No socket found for user: ${targetUserId} in userSocketMap`);
      socket.emit("error", {
        message: `No socket found for user ${targetUserId}`,
        code: "USER_NOT_FOUND",
      });
    }
  });
};

const setupChatEvents = (socket: AuthenticatedSocket, io: SocketIOServer, role: string, userId: string) => {
 
socket.on("sendMessage", async (data: {
  rideId: string;
  sender: 'driver' | 'user';
  message: string;
  timestamp: string;
  driverId?: string;
  userId?: string;
  type?: 'text' | 'image';
  fileUrl?: string;
}) => {
  console.log("New chat message received:", data);
  
  try {
    const recipientId = data.sender === 'driver' ? data.userId : data.driverId;
    if (!recipientId) {
      console.error("Missing recipient ID");
      return;
    }

    const recipientSocketId = userSocketMap[recipientId];
    if (!recipientSocketId) {
      console.error(`No socket found for recipient: ${recipientId}`);
      return;
    }

    io.to(recipientSocketId).emit("receiveMessage", {
      sender: data.sender,
      message: data.message,
      timestamp: data.timestamp,
      type: data.type || 'text', // Default to 'text' if not provided
      fileUrl: data.fileUrl || undefined,
    });

    console.log(`Message forwarded from ${data.sender} to ${recipientId}`);
  } catch (error) {
    console.error("Error processing chat message:", error);
  }
});

};

const setupDriverEvents = (socket: AuthenticatedSocket, io: SocketIOServer, role: string, userId: string) => {
  socket.on("driverLocation", async ({ latitude, longitude }: Coordinates) => {
    if (role !== "Driver") {
      socket.emit("error", { message: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }
    console.log("Driver location update:", { latitude, longitude });
    try {
      await updateDriverLocation(userId, { latitude, longitude });
    } catch (error) {
      console.error("Error updating driver location:", error);
      socket.emit("error", { message: "Failed to update location", code: "LOCATION_UPDATE_FAILED" });
    }
  });

  socket.on("driverOffline", async () => {
    if (role !== "Driver") {
      socket.emit("error", { message: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }
    console.log(`Driver ${userId} is going offline`);
    try {
      await removeDriverFromCache(userId);
    } catch (error) {
      socket.emit("error", { message: "Failed to remove driver from cache", code: "DRIVER_OFFLINE_FAILED" });
    }
  });

socket.on("rideStarted", async({ bookingId, userId, driverLocation })=>{
      if (role !== "Driver") {
      socket.emit("error", { message: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }
    const targetSocketId = userSocketMap[userId];

    console.log(`rideStarted==`,{ bookingId, userId, driverLocation });
    if (targetSocketId) {
      io.to(targetSocketId).emit("driverStartRide",{...driverLocation});
    } else {
      console.error(`No socket found for user: ${userId} in userSocketMap`);
      socket.emit("error", {
        message: `No socket found for user ${userId}`,
        code: "USER_NOT_FOUND",
      });
    }
})

};

const updateDriverLocation = async (driverId: string, coordinates: Coordinates) => {
  const driverDetailsKey = `onlineDriver:details:${driverId}`;
  const isAlreadyOnline = await redisClient.exists(driverDetailsKey);

  if (!isAlreadyOnline) {
    const driverDetails = await driverRabbitMqClient.produce(
      { id: driverId },
      "get-online-driver"
    ) as any;

    console.log("get-online-driver:",driverDetails.data);
    
    await redisClient.set(driverDetailsKey, JSON.stringify(driverDetails.data));
  }

  await redisClient.geoAdd("driver:locations", {
    longitude: coordinates.longitude,
    latitude: coordinates.latitude,
    member: driverId,
  });
  
};

const setupRideRequestEvents = (socket: AuthenticatedSocket, io: SocketIOServer, role: string, userId: string) => {
  socket.on("requestRide", async (rideData: {
    pickupLocation: { address: string; latitude: number; longitude: number };
    dropOffLocation: { address: string; latitude: number; longitude: number };
    vehicleModel: string;
    duration: string;
    userName:string;
    isScheduled:boolean;
    scheduledDateTime:number;
    estimatedPrice: number;
    estimatedDuration: number;
    distanceInfo:{
      distance: number;
      distanceInKm: number;
    }
    mobile:string;
    profile:string;
  }) => {

    console.log("requestRide==",rideData);
    
    if (role !== "User") {
      socket.emit("error", { message: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      await processRideRequest(socket, io, userId, rideData);
    } catch (error) {
      console.error(`Error processing ride request for user ${userId}:`, error);
      socket.emit("rideStatus", {
        status: "Failed",
        message: "Failed to create ride",
        code: "RIDE_REQUEST_FAILED",
      });
    }
  });
};

const processRideRequest = async (
  socket: AuthenticatedSocket,
  io: SocketIOServer,
  userId: string,
  rideData: {
    pickupLocation: { address: string; latitude: number; longitude: number };
    dropOffLocation: { address: string; latitude: number; longitude: number };
    vehicleModel: string;
    userName:string;
    isScheduled:boolean;
    scheduledDateTime:number;
    estimatedPrice: number;
    estimatedDuration: number;
    distanceInfo:{
      distance: number;
      distanceInKm: number;
    }
    mobile:string;
    profile: string;
  },
) => {
  const drivers = await findNearbyDrivers(
    rideData.pickupLocation.latitude,
    rideData.pickupLocation.longitude,
    rideData.vehicleModel
  );

  if (!drivers.length) {
    io.to(`user:${userId}`).emit("rideStatus", {
      ride_id: "unknown",
      status: "Failed",
      message: "No drivers available",
      code: "NO_DRIVERS_AVAILABLE",
    });
    return;
  }
  
  const ride = await bookingRabbitMqClient.produce(
    {
      userId,
      userName:rideData.userName,
      userMobile: rideData.mobile,
      pickupLocation: rideData.pickupLocation,
      dropoffLocation: rideData.dropOffLocation,
      vehicleModel: rideData.vehicleModel,
      duration:rideData.estimatedDuration,
      price: rideData.estimatedPrice,
      distanceInfo:rideData.distanceInfo,
      userProfile: rideData.profile
    },
    "create-booking"
  ) as BookingResponse;

  if (ride.status === "Failed" || !ride.data.booking?.ride_id) {
    io.to(`user:${userId}`).emit("rideStatus", {
      ride_id: ride.data.booking?.ride_id || "unknown",
      status: "Failed",
      message: ride.data.message || "Failed to create booking",
      code: "BOOKING_CREATION_FAILED",
    });
    return;
  }

  const stopSignal = { stop: false };
  await handleDriverRideRequests(socket, io, userId, ride, rideData, drivers, stopSignal);
};

const handleDriverRideRequests = async (
  socket: AuthenticatedSocket,
  io: SocketIOServer,
  userId: string,
  ride: BookingResponse,
  rideData: {
    pickupLocation: { address: string; latitude: number; longitude: number };
    dropOffLocation: { address: string; latitude: number; longitude: number };
    vehicleModel: string;
    mobile: string;
  },
  drivers: Array<{ driverId: string; distance: number; rating: number; cancelCount: number }>,
  stopSignal: { stop: boolean }
) => {
  console.log('Processing ride request for user:', userId);
  console.log('Ride details:', {
    rideId: ride.data.booking.ride_id,
    distance: ride.data.distance,
    price: ride.data.price,
    vehicleType: rideData.vehicleModel
  });

  for (const driver of drivers) {
    if (stopSignal.stop) {
      console.log(`Ride request processing stopped for ride ${ride.data.booking.ride_id}`);
      break;
    }

    const driverRideRequest: DriverRideRequest = createRideRequestData(userId, ride, rideData);
    console.log(`Sending ride request to driver:`,driverRideRequest);
    console.log("=================99",userId, ride, rideData);
    
    
    const accepted = await sendRideRequest(io, driver.driverId, driverRideRequest, stopSignal);

    if (accepted) {
      console.log(`Ride ${driverRideRequest.ride.rideId} accepted by driver ${driver.driverId}`);
      stopSignal.stop = true;
      return;
    } else {
      console.log(`Ride ${driverRideRequest.ride.rideId} declined by driver ${driver.driverId}`);
      await incrementDriverCancelCount(driver.driverId);
    }
  }

  if (!stopSignal.stop) {
    console.log(`No driver accepted ride ${ride.data.booking.ride_id}`);
    await bookingRabbitMqClient.produce(
      { id: ride.data.booking.id, action: "Cancelled" },
      "update-booking-status"
    );
    io.to(`user:${userId}`).emit("rideStatus", {
      ride_id: ride.data.booking.ride_id,
      status: "Failed",
      message: "No driver available at the moment",
      code: "NO_DRIVER_AVAILABLE",
    });
  }
};

const createRideRequestData = (
  userId: string,
  ride: BookingResponse,
  rideData: {
    pickupLocation: { address: string; latitude: number; longitude: number };
    dropOffLocation: { address: string; latitude: number; longitude: number };
    vehicleModel: string;
    mobile: string;
  }
): DriverRideRequest => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  return {
    requestId,
    customer: {
      id: userId,
      name: ride.data.userData.userName || 'Customer',
      profileImageUrl: ride.data.userData.profile || undefined
    },
    pickup: {
      latitude: ride.data.userPickupCoordinators.latitude,
      longitude: ride.data.userPickupCoordinators.longitude,
      address: ride.data.userPickupCoordinators.address
    },
    dropoff: {
      latitude: ride.data.userDropCoordinators.latitude,
      longitude: ride.data.userDropCoordinators.longitude,
      address: ride.data.userDropCoordinators.address
    },
    ride: {
      rideId: ride.data.booking.ride_id,
      estimatedDistance: ride.data.distance,
      estimatedDuration: ride.data.duration?.toString() || 'N/A',
      fareAmount: ride.data.price,
      vehicleType: rideData.vehicleModel,
      securityPin: ride.data.pin
    },
    booking: {
      bookingId: ride.data.booking.id,
      userId,
      pickupLocation: {
        latitude: ride.data.userPickupCoordinators.latitude,
        longitude: ride.data.userPickupCoordinators.longitude,
        address: ride.data.userPickupCoordinators.address
      },
      dropoffLocation: {
        latitude: ride.data.userDropCoordinators.latitude,
        longitude: ride.data.userDropCoordinators.longitude,
        address: ride.data.userDropCoordinators.address
      },
      rideDetails: {
        rideId: ride.data.booking.ride_id,
        estimatedDistance: ride.data.distance,
        estimatedDuration: ride.data.duration?.toString() || 'N/A',
        fareAmount: ride.data.price,
        vehicleType: rideData.vehicleModel,
        securityPin: ride.data.pin
      },
      status: 'pending',
      createdAt: timestamp
    },
    requestTimeout: 30000,
    requestTimestamp: timestamp
  };
};


const sendRideRequest = (
  io: SocketIOServer,
  driverId: string,
  rideRequest: DriverRideRequest,
  stopSignal: { stop: boolean }
): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeoutDuration = rideRequest.requestTimeout;

    console.log(`Dispatching ride request to driver ${driverId}:`,rideRequest);

    // Emit the structured ride request
    io.to(`driver:${driverId}`).emit("rideRequest", rideRequest);

    const driverSocket = Array.from(io.sockets.sockets.values()).find(
      (s: AuthenticatedSocket) => s.decoded?.clientId === driverId && s.decoded?.role === "Driver"
    );

    if (!driverSocket) {
      console.error(`Driver socket not found for driver ${driverId}`);
      return resolve(false);
    }
     
    const responseHandler = async (response: { 
      requestId: string; 
      rideId: string; 
      accepted: boolean;
      bookingId: string;
      timestamp: string;
    }) => {
      console.log(`Received response from driver ${driverId}:`, response);

      if (response.rideId !== rideRequest.ride.rideId) {
        console.log(`Response ride ID mismatch. Expected: ${rideRequest.ride.rideId}, Got: ${response.rideId}`);
        return;
      }

      clearTimeout(timeout);
      driverSocket.off(`rideResponse:${rideRequest.ride.rideId}`, responseHandler);

      if (response.accepted) {
        await handleRideAcceptance(io, driverId,response.bookingId, response.rideId, rideRequest.customer.id);
        console.log(`Ride ${response.rideId} successfully accepted by driver ${driverId}`);
      } else {
        console.log(`Ride ${response.rideId} declined by driver ${driverId}`);
        await incrementDriverCancelCount(driverId);
      }

      resolve(response.accepted);
    };

    driverSocket.on(`rideResponse:${rideRequest.ride.rideId}`, responseHandler);

    const timeout = setTimeout(async () => {
      console.log(`Ride request timeout for driver ${driverId}, ride ${rideRequest.ride.rideId}`);
      driverSocket.off(`rideResponse:${rideRequest.ride.rideId}`, responseHandler);
      if (!stopSignal.stop) {
        await incrementDriverCancelCount(driverId);
      }
      resolve(false);
    }, timeoutDuration);
  });
};

const handleRideAcceptance = async (
  io: SocketIOServer,
  driverId: string,
  bookingId:string,
  rideId: string,
  userId: string
) => {
  try {

    const position = await redisClient.geoPos("driver:locations", driverId);
    const driverCoordinates = position
      ? {
          latitude: position[0]?.latitude,
          longitude: position[0]?.longitude,
        }
      : null;

    const driverDetailsKey = `onlineDriver:details:${driverId}`;
    const driverDetailsRaw = await redisClient.get(driverDetailsKey);
    const driverDetails = driverDetailsRaw ? JSON.parse(driverDetailsRaw) : null;

    const data = {
      ride_id: rideId,
      bookingId,
      action: "Accepted",
      driverCoordinates,
      driverDetails
    };

    const bookingResponse = await bookingRabbitMqClient.produce(data, "accepted-booking") as BookingInterface;
    console.log(`Booking status updated to Accepted for ride ${rideId}`, bookingResponse);

    // Emit to user
    const targetSocketId = userSocketMap[userId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("rideStatus", {
        ride_id: bookingResponse.data.ride_id,
        status: "Accepted",
        message: "Your ride has been accepted by a driver!",
        driverId,
        driverCoordinates,
        booking: bookingResponse.data,
        driverDetails: driverDetails || {
          id: driverId,
          name: "Unknown Driver",
          rating: 0,
        },
      });

    } else {
      console.error(`No socket found for user ${userId} in userSocketMap`);
      io.to(`driver:${driverId}`).emit("error", {
        message: `No socket found for user ${userId}`,
        code: "USER_NOT_FOUND",
      });
    }
  } catch (error) {
    console.error(`Error updating booking status for ride ${rideId}:`, error);
    io.to(`driver:${driverId}`).emit("error", {
      message: "Failed to update booking status",
      code: "BOOKING_STATUS_UPDATE_FAILED",
    });
    io.to(`user:${userId}`).emit("rideStatus", {
      ride_id: rideId,
      status: "Failed",
      message: "Failed to process ride acceptance",
      code: "RIDE_ACCEPTANCE_FAILED",
    });
  }
};

const removeDriverFromCache = async (driverId: string) => {
  try {
    await redisClient.del(`onlineDriver:details:${driverId}`);
    await redisClient.zRem("driver:locations", driverId);
    console.log(`Driver ${driverId} removed from Redis cache`);
  } catch (error) {
    console.error(`Error removing driver ${driverId} from Redis cache:`, error);
    throw error;
  }
};

const incrementDriverCancelCount = async (driverId: string) => {
  try {
    await driverRabbitMqClient.produce({ id: driverId }, "update-driver-cancel-count");
    console.log(`Cancellation count incremented for driver ${driverId}`);
  } catch (error) {
    console.error(`Error incrementing cancellation count for driver ${driverId}:`, error);
  }
};

const setupDisconnectEvents = (socket: AuthenticatedSocket, io: SocketIOServer, role: string, userId: string) => {
  socket.on("disconnect", async () => {
    console.log(`${role} disconnected: ${userId}`);

    if (userId && userId !== "undefined") {
      delete userSocketMap[userId];
      console.log(`Updated userSocketMap after disconnect: ${JSON.stringify(userSocketMap)}`);
    }

    if (role === "Driver") {
      try {
        await removeDriverFromCache(userId);
      } catch (error) {
        console.error(`Error handling driver disconnect for ${userId}:`, error);
      }
    }
  });
}