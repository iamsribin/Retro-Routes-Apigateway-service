import "dotenv/config";

export default {
  rabbitMQ: {
    url: String(process.env.RABBITMQ_URL),
  },
  queues: {
    dirverQueue: "drivers_queue",
    rideQueue: "ride_queue",
  },
};
