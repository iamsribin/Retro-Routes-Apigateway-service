import "dotenv/config";

export default {
  rabbitMQ: {
    url: String(process.env.RABBITMQ_URL),
  },
  queues: {
    driverQueue: "drivers_queue",
    rideQueue: "ride_booking_queue9",
  },
};
