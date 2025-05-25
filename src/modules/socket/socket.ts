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

// Interfaces
interface BookingResponse {
  data: {
    nearbyDrivers: Array<{
      driverId: string;
      distance: number;
      rating: number;
      cancelCount: number;
    }>;
    booking: { id: string; ride_id: string; status: string; message?: string };
    userPickupCoordinators: { address: string; latitude: number; longitude: number };
    userDropCoordinators: { address: string; latitude: number; longitude: number };
    distance: string;
    price: number;
    message?: string;
  };
  status?: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface BookingInterface {
  data: {
    _id: mongoose.Types.ObjectId;
    ride_id: string;
    driver_id?: string;
    user_id: string;
    pickupCoordinates: Coordinates;
    dropoffCoordinates: Coordinates;
    pickupLocation: string;
    dropoffLocation: string;
    driverCoordinates?: Coordinates;
    distance: string;
    duration: string;
    vehicleModel: string;
    price: number;
    date: Date;
    status: string;
    pin: number;
    paymentMode: string;
    feedback?: string;
    rating?: number;
  };
  message: string;
}

interface Booking {
  ride_id: string;
  user_id: string;
  pickupCoordinates: Coordinates;
  dropoffCoordinates: Coordinates;
  pickupLocation: string;
  dropoffLocation: string;
  distance: string;
  vehicleModel: string;
  price: number;
  status: string;
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

// Global socket mapping
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

  // Authentication middleware
  io.use(authenticateSocket);

  // Handle socket connections
  io.on("connection", (socket: AuthenticatedSocket) => {
    handleSocketConnection(socket, io);
  });

  return io;
};

// Refresh token using AuthClient
const refreshTokenWithAuthClient = (refreshToken: string): Promise<Tokens> => {
  return new Promise((resolve, reject) => {
    AuthClient.RefreshToken({ token: refreshToken }, (err: any, result: Tokens) => {
      if (err) reject(new Error("Invalid refresh token"));
      resolve(result);
    });
  });
};

// Authenticate socket connection
const authenticateSocket = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  const { token, refreshToken } = socket.handshake.query as { token: string; refreshToken: string };
  
  if (!token) {
    console.error("Authentication error: Missing token");
    return next(new Error("Authentication error: Token missing"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      clientId: string;
      role: string;
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
        role: string;
      };
      socket.decoded = decoded;
      console.log(`Token refreshed for ${decoded.role}: ${decoded.clientId}`);
      return next();
    } catch (error) {
      console.error("Authentication error: Token refresh failed", error);
      return next(new Error("Authentication error: Token refresh failed"));
    }
};
}
// Handle socket connection and events
const handleSocketConnection = (socket: AuthenticatedSocket, io: SocketIOServer) => {
  if (!socket.decoded) {
    console.error("Missing decoded token, disconnecting");
    socket.disconnect();
    return;
  }

  const { clientId: userId, role } = socket.decoded;
  console.log(`${role} connected: ${userId}`);

  // Register user in socket map
  if (userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    console.log("Updated userSocketMap:", userSocketMap);
  }

  // Join appropriate room
  socket.join(role === "Driver" ? `driver:${userId}` : `user:${userId}`);

  // Set up event listeners
  setupChatEvents(socket, io, role, userId);
  setupDriverEvents(socket, io, role, userId);
  setupRideRequestEvents(socket, io, role, userId);
  setupUserBlockEvents(socket, io, userId);
  setupDisconnectEvents(socket, io, role, userId);
};

// Chat-related event handlers
const setupChatEvents = (socket: AuthenticatedSocket, io: SocketIOServer, role: string, userId: string) => {
  socket.on("join chat", (room: string) => {
    if (!room) {
      console.error("Invalid chat room ID");
      socket.emit("error", { message: "Invalid chat room ID", code: "INVALID_CHAT_ROOM" });
      return;
    }
    socket.join(room);
    console.log(`${role} ${userId} joined chat room: ${room}`);
  });

  socket.on("new message", async (message: any) => {
    console.log("New message received:", message);
    const chatId = message.chatId?._id || message.chatId;
    
    if (!chatId) {
      console.error("Missing chat ID");
      socket.emit("error", { message: "Chat ID is missing", code: "MISSING_CHAT_ID" });
      return;
    }

    try {
      io.to(chatId).emit("message received", message);
      console.log(`Message sent to chat room ${chatId}:`, message);
    } catch (error) {
      console.error("Error processing message:", error);
      socket.emit("error", { message: "Failed to process message", code: "MESSAGE_PROCESSING_FAILED" });
    }
  });
};

// Driver-related event handlers
const setupDriverEvents = (socket: AuthenticatedSocket, io: SocketIOServer, role: string, userId: string) => {
  socket.on("driverLocation", async ({ latitude, longitude }: Coordinates) => {
    if (role !== "Driver") {
      socket.emit("error", { message: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    console.log("Driver location update:", { latitude, longitude });

    try {
      await updateDriverLocation(userId, { latitude, longitude });
      socket.emit("location-updated", { status: "success", latitude, longitude });
    } catch (error) {
      console.error("Error updating driver location:", error);
      socket.emit("error", { message: "Failed to update location", code: "LOCATION_UPDATE_FAILED" });
    }
  });
};

// Update driver location in Redis
const updateDriverLocation = async (driverId: string, coordinates: Coordinates) => {
  const driverDetailsKey = `onlineDriver:details:${driverId}`;
  const isAlreadyOnline = await redisClient.exists(driverDetailsKey);

  if (!isAlreadyOnline) {
    const driverDetails = await driverRabbitMqClient.produce(
      { id: driverId },
      "get-online-driver"
    ) as any;
    await redisClient.set(driverDetailsKey, JSON.stringify(driverDetails.data));
  }

  await redisClient.geoAdd("driver:locations", {
    longitude: coordinates.longitude,
    latitude: coordinates.latitude,
    member: driverId,
  });
};

// Ride request event handlers
const setupRideRequestEvents = (socket: AuthenticatedSocket, io: SocketIOServer, role: string, userId: string) => {
  socket.on("requestRide", async (rideData: {
    pickupLocation: { address: string; latitude: number; longitude: number };
    dropoffLocation: { address: string; latitude: number; longitude: number };
    vehicleModel: string;
  }) => {
    if (role !== "User") {
      socket.emit("error", { message: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    try {
      await processRideRequest(socket, io, userId, rideData);
    } catch (error) {
      console.error("Error processing ride request:", error);
      socket.emit("error", { message: "Failed to create ride", code: "RIDE_REQUEST_FAILED" });
    }
  });
};

// Process ride request
const processRideRequest = async (
  socket: AuthenticatedSocket,
  io: SocketIOServer,
  userId: string,
  rideData: {
    pickupLocation: { address: string; latitude: number; longitude: number };
    dropoffLocation: { address: string; latitude: number; longitude: number };
    vehicleModel: string;
  }
) => {
  const drivers = await findNearbyDrivers(
    rideData.pickupLocation.latitude,
    rideData.pickupLocation.longitude,
    rideData.vehicleModel
  );

  if (!drivers.length) {
    io.to(`user:${userId}`).emit("rideStatus", {
      status: "Failed",
      message: "No drivers available",
      code: "NO_DRIVERS_AVAILABLE",
    });
    return;
  }

  const ride = await bookingRabbitMqClient.produce(
    {
      userId,
      pickupLocation: rideData.pickupLocation,
      dropoffLocation: rideData.dropoffLocation,
      vehicleModel: rideData.vehicleModel,
    },
    "create-booking"
  ) as BookingResponse;

  if (ride.status === "Failed") {
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

// Handle ride requests to drivers
const handleDriverRideRequests = async (
  socket: AuthenticatedSocket,
  io: SocketIOServer,
  userId: string,
  ride: BookingResponse,
  rideData: {
    pickupLocation: { address: string; latitude: number; longitude: number };
    dropoffLocation: { address: string; latitude: number; longitude: number };
    vehicleModel: string;
  },
  drivers: Array<{ driverId: string; distance: number; rating: number; cancelCount: number }>,
  stopSignal: { stop: boolean }
) => {
  for (const driver of drivers) {
    if (stopSignal.stop) {
      console.log(`Stopped sending ride requests for ride ${ride.data.booking.ride_id}`);
      break;
    }

    const rideRequestData: RideRequestData = createRideRequestData(userId, ride, rideData);
    const accepted = await sendRideRequest(io, driver.driverId, rideRequestData, stopSignal);

    if (accepted) {
      stopSignal.stop = true;
      await handleAcceptedRide(socket, io, userId, driver, ride, rideRequestData);
      return;
    } else {
      await incrementDriverCancelCount(driver.driverId);
    }
  }

  if (!stopSignal.stop) {
    await bookingRabbitMqClient.produce(
      { id: ride.data.booking.id, action: "Cancelled" },
      "update-booking-status"
    );
    socket.emit("rideStatus", {
      ride_id: ride.data.booking.ride_id,
      status: "Failed",
      message: "No driver accepted",
      code: "NO_DRIVER_ACCEPTED",
    });
  }
};

// Create ride request data
const createRideRequestData = (
  userId: string,
  ride: BookingResponse,
  rideData: {
    pickupLocation: { address: string; latitude: number; longitude: number };
    dropoffLocation: { address: string; latitude: number; longitude: number };
    vehicleModel: string;
  }
): RideRequestData => ({
  ride_id: ride.data.booking.ride_id,
  userId,
  pickup: ride.data.userPickupCoordinators.address,
  dropoff: ride.data.userDropCoordinators.address,
  distance: ride.data.distance,
  price: ride.data.price,
  customer: {
    name: "Customer",
    location: [
      ride.data.userPickupCoordinators.longitude,
      ride.data.userPickupCoordinators.latitude,
    ],
    rating: 4.8,
  },
  vehicleModel: rideData.vehicleModel,
  bookingId: ride.data.booking.ride_id,
  timeout: 30000,
  booking: {
    ride_id: ride.data.booking.ride_id,
    user_id: userId,
    pickupCoordinates: {
      latitude: ride.data.userPickupCoordinators.latitude,
      longitude: ride.data.userPickupCoordinators.longitude,
    },
    dropoffCoordinates: {
      latitude: ride.data.userDropCoordinators.latitude,
      longitude: ride.data.userDropCoordinators.longitude,
    },
    pickupLocation: ride.data.userPickupCoordinators.address,
    dropoffLocation: ride.data.userDropCoordinators.address,
    distance: ride.data.distance,
    vehicleModel: rideData.vehicleModel,
    price: ride.data.price,
    status: ride.data.booking.status,
    _id: ride.data.booking.id,
    date: new Date().toISOString(),
  },
});

// Send ride request to driver
const sendRideRequest = (
  io: SocketIOServer,
  driverId: string,
  rideData: RideRequestData,
  stopSignal: { stop: boolean }
): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeoutDuration = 30000;
    const enrichedRideData = { ...rideData, timeout: timeoutDuration, bookingId: rideData.ride_id };
    
    console.log(`Sending ride request to driver ${driverId}:`, enrichedRideData);
    io.to(`driver:${driverId}`).emit("rideRequest", enrichedRideData);

    const driverSocket = Array.from(io.sockets.sockets.values()).find(
      (s: AuthenticatedSocket) => s.decoded?.clientId === driverId && s.decoded?.role === "Driver"
    );

    if (!driverSocket) {
      console.error(`Driver socket not found for driver ${driverId}`);
      return resolve(false);
    }

    const responseHandler = async (response: { ride_id: string; accepted: boolean }) => {
      console.log(`Received rideResponse:${rideData.ride_id} from driver ${driverId}:`, response);
      
      if (response.ride_id !== rideData.ride_id) return;

      clearTimeout(timeout);
      driverSocket.off(`rideResponse:${rideData.ride_id}`, responseHandler);

      if (response.accepted) {
        await handleRideAcceptance(io, driverId, response.ride_id);
      }

      resolve(response.accepted);
    };

    driverSocket.on(`rideResponse:${rideData.ride_id}`, responseHandler);

    const timeout = setTimeout(async () => {
      driverSocket.off(`rideResponse:${rideData.ride_id}`, responseHandler);
      if (!stopSignal.stop) {
        await incrementDriverCancelCount(driverId);
      }
      resolve(false);
    }, timeoutDuration);
  });
};

// Handle ride acceptance
const handleRideAcceptance = async (io: SocketIOServer, driverId: string, rideId: string) => {
  try {
    const position = await redisClient.geoPos("driver:locations", driverId);
    const driverCoordinates = position ? {
      latitude: position[0]?.latitude,
      longitude: position[0]?.longitude,
    } : null;

    const data = {
      ride_id: rideId,
      action: "Accepted",
      driver_id: driverId,
      driverCoordinates,
    };

    const bookingResponse = await bookingRabbitMqClient.produce(data, "accepted-booking") as BookingInterface;
    console.log(`Booking status updated to Accepted for ride`, bookingResponse);

    const targetSocketId = userSocketMap[bookingResponse?.data.user_id];
    if (targetSocketId) {
      io.to(targetSocketId).emit("accepted-ride", bookingResponse);
      console.log(`Accepted-ride event emitted to ${bookingResponse.data.user_id}`);
    } else {
      console.error(`No socket found for user ${bookingResponse.data.user_id}`);
      io.to(`driver:${driverId}`).emit("error", {
        message: `No socket found for user ${bookingResponse.data.user_id}`,
        code: "USER_NOT_FOUND",
      });
    }
  } catch (error) {
    console.error("Error updating booking status:", error);
    io.to(`driver:${driverId}`).emit("error", {
      message: "Failed to update booking status",
      code: "BOOKING_STATUS_UPDATE_FAILED",
    });
  }
};

// Handle accepted ride
const handleAcceptedRide = async (
  socket: AuthenticatedSocket,
  io: SocketIOServer,
  userId: string,
  driver: { driverId: string; distance: number; rating: number; cancelCount: number },
  ride: BookingResponse,
  rideRequestData: RideRequestData
) => {
  const driverLocation = await redisClient.geoPos("driver:locations", driver.driverId);
  const driverDetailsKey = `onlineDriver:details:${driver.driverId}`;
  const driverDetailsRaw = await redisClient.get(driverDetailsKey);
  const driverDetails = driverDetailsRaw ? JSON.parse(driverDetailsRaw) : null;

  const driverCoordinates = driverLocation ? {
    longitude: driverLocation[0],
    latitude: driverLocation[1],
  } : null;

  io.to(`user:${userId}`).emit("rideStatus", {
    ride_id: ride.data.booking.ride_id,
    status: "Accepted",
    message: "Your ride has been accepted by a driver!",
    driverId: driver.driverId,
    driverLocation: driverCoordinates,
    driverDetails: driverDetails || {
      id: driver.driverId,
      name: "Unknown Driver",
      rating: driver.rating,
    },
    booking: rideRequestData.booking,
  });
};

// Increment driver cancellation count
const incrementDriverCancelCount = async (driverId: string) => {
  try {
    await driverRabbitMqClient.produce({ id: driverId }, "update-driver-cancel-count");
    console.log(`Cancellation count incremented for driver ${driverId}`);
  } catch (error) {
    console.error(`Error incrementing cancellation count for driver ${driverId}:`, error);
  }
};

// User block event handlers
const setupUserBlockEvents = (socket: AuthenticatedSocket, io: SocketIOServer, userId: string) => {
  socket.on("block-user", ({ userId: targetUserId }: { userId: string }) => {
    console.log(`Blocking user: ${targetUserId}`);
    const targetSocketId = userSocketMap[targetUserId];
    
    if (targetSocketId) {
      io.to(targetSocketId).emit("user-blocked");
      console.log(`User-blocked event emitted to ${targetUserId}`);
    } else {
      console.error(`No socket found for user ${targetUserId}`);
      socket.emit("error", {
        message: `No socket found for user ${targetUserId}`,
        code: "USER_NOT_FOUND",
      });
    }
  });
};

// Disconnect event handlers
const setupDisconnectEvents = (socket: AuthenticatedSocket, io: SocketIOServer, role: string, userId: string) => {
  socket.on("disconnect", async () => {
    console.log(`${role} disconnected: ${userId}`);
    
    if (userId !== "undefined") {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
      console.log("Updated userSocketMap after disconnect:", userSocketMap);
    }

    if (role === "Driver") {
      try {
        await redisClient.del(`onlineDriver:details:${userId}`);
        await redisClient.zRem("driver:locations", userId);
      } catch (error) {
        console.error("Error handling driver disconnect:", error);
      }
    }
  });
};