import "dotenv/config";

export default {
  rabbitMQ: {
    url: String(process.env.RABBITMQ_URL),
  },
  queues: {
    driverQueue: "driver_queue",
    rideQueue: "booking_queue",
  },
};
