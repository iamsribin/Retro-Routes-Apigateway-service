// // Enhanced API Gateway client.ts (minimal changes for backward compatibility)
// import { Channel, connect, Connection } from "amqplib";
// import rabbitmqConfig from "../../../config/rabbitmq.config";
// import Producer from "./producer";
// import { EventEmitter } from 'events';
// import Consumer from "./consumer";

// class RabbitMqClient {
//     private constructor() {}

//     private static instance: RabbitMqClient;
//     private isInitialized = false;
//     private producer: Producer | undefined;
//     private consumer: Consumer | undefined;
//     private connection: Connection | undefined;
//     private produceChannel: Channel | undefined;
//     private consumerChannel: Channel | undefined;
//     private eventEmitter: EventEmitter | undefined;
    
//     // Health monitoring
//     private connectionHealth = {
//         isConnected: false,
//         lastConnectionTime: null as Date | null,
//         connectionAttempts: 0,
//         lastError: null as Error | null
//     };

//     public static getInstance() {
//         if (!this.instance) {
//             this.instance = new RabbitMqClient();
//         }
//         return this.instance;
//     }

//     async initialize() {
//         if (this.isInitialized) {
//             return;
//         }
//         try {
//             this.connectionHealth.connectionAttempts++;
//             this.connection = await connect(rabbitmqConfig.rabbitMQ.url);
            
//             // Connection event handlers
//             this.connection.on('error', (err) => {
//                 console.error('RabbitMQ connection error:', err);
//                 this.connectionHealth.isConnected = false;
//                 this.connectionHealth.lastError = err;
//             });

//             this.connection.on('close', () => {
//                 console.log('RabbitMQ connection closed');
//                 this.connectionHealth.isConnected = false;
//                 this.isInitialized = false;
//             });

//             this.connection.on('blocked', (reason) => {
//                 console.warn('RabbitMQ connection blocked:', reason);
//             });

//             this.connection.on('unblocked', () => {
//                 console.log('RabbitMQ connection unblocked');
//             });

//             const [produceChannel, consumerChannel] = await Promise.all([
//                 this.connection.createChannel(),
//                 this.connection.createChannel()
//             ]);

//             this.produceChannel = produceChannel;
//             this.consumerChannel = consumerChannel;

//             // Channel error handlers
//             this.produceChannel.on('error', (err) => {
//                 console.error('Producer channel error:', err);
//                 this.connectionHealth.lastError = err;
//             });

//             this.consumerChannel.on('error', (err) => {
//                 console.error('Consumer channel error:', err);
//                 this.connectionHealth.lastError = err;
//             });

//             // Setup reply queue with better durability options
//             const { queue: replyQueueName } = await this.consumerChannel.assertQueue("", {
//                 exclusive: true,
//                 autoDelete: true,
//                 arguments: {
//                     'x-message-ttl': 300000, // 5 minutes TTL for reply messages
//                 }
//             });
            
//             console.log("replyQueueName==", replyQueueName);

//             this.eventEmitter = new EventEmitter();
            
//             // Increase max listeners to handle high concurrency
//             this.eventEmitter.setMaxListeners(1000);

//             this.producer = new Producer(
//                 this.produceChannel,
//                 replyQueueName,
//                 this.eventEmitter
//             );

//             this.consumer = new Consumer(
//                 this.consumerChannel,
//                 replyQueueName,
//                 this.eventEmitter
//             );

//             this.consumer?.consumeMessage();
            
//             this.connectionHealth.isConnected = true;
//             this.connectionHealth.lastConnectionTime = new Date();
//             this.connectionHealth.lastError = null;
//             this.isInitialized = true;
            
//             console.log('API Gateway RabbitMQ client initialized successfully');
//         } catch (error) {
//             console.error("RabbitMQ initialization error:", error);
//             this.connectionHealth.lastError = error as Error;
//             this.connectionHealth.isConnected = false;
//             throw error;
//         }
//     }

//     async produce(data: any, operation: string) {
//         if (!this.isInitialized) {
//             await this.initialize();
//         }

//         // Add request timeout and retry logic
//         const maxRetries = 3;
//         let lastError: Error | null = null;

//         for (let attempt = 1; attempt <= maxRetries; attempt++) {
//             try {
//                 // Add timeout promise
//                 const timeoutPromise = new Promise((_, reject) => {
//                     setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
//                 });

//                 const producePromise = this.producer?.produceMessage(data, operation);
                
//                 if (!producePromise) {
//                     throw new Error('Producer not initialized');
//                 }

//                 // Race between actual request and timeout
//                 const result = await Promise.race([producePromise, timeoutPromise]);
                
//                 console.log(`Request completed successfully on attempt ${attempt}`);
//                 return result;

//             } catch (error: any) {
//                 lastError = error as Error;
//                 console.error(`Request attempt ${attempt} failed:`, error);

//                 if (attempt === maxRetries) {
//                     console.error('Max retries exceeded, throwing error');
//                     throw lastError;
//                 }

//                 // Exponential backoff
//                 const backoffDelay = Math.pow(2, attempt) * 1000;
//                 console.log(`Retrying in ${backoffDelay}ms...`);
//                 await new Promise(resolve => setTimeout(resolve, backoffDelay));

//                 // Try to reinitialize connection if it seems to be the issue
//                 if (error.message.includes('connection') || error.message.includes('channel')) {
//                     console.log('Attempting to reinitialize connection...');
//                     this.isInitialized = false;
//                     await this.initialize();
//                 }
//             }
//         }

//         throw lastError;
//     }

//     // Health check method for monitoring
//     getHealthStatus() {
//         return {
//             ...this.connectionHealth,
//             isInitialized: this.isInitialized,
//             hasProducer: !!this.producer,
//             hasConsumer: !!this.consumer,
//             eventEmitterListeners: this.eventEmitter?.listenerCount('*') || 0
//         };
//     }

//     // Graceful shutdown
//     async close() {
//         try {
//             if (this.produceChannel) await this.produceChannel.close();
//             if (this.consumerChannel) await this.consumerChannel.close();
//             if (this.connection) await this.connection.close();
            
//             this.isInitialized = false;
//             this.connectionHealth.isConnected = false;
            
//             console.log('API Gateway RabbitMQ client closed gracefully');
//         } catch (error) {
//             console.error('Error closing RabbitMQ client:', error);
//         }
//     }

//     // Method to clear old event listeners (prevent memory leaks)
//     clearOldListeners() {
//         if (this.eventEmitter) {
//             const listenerCounts = this.eventEmitter.eventNames().length;
//             if (listenerCounts > 100) {
//                 console.warn(`High number of event listeners detected: ${listenerCounts}`);
//                 // Remove listeners for events older than 5 minutes
//                 const now = Date.now();
//                 this.eventEmitter.eventNames().forEach(eventName => {
//                     if (typeof eventName === 'string' && eventName.length === 36) { // UUID format
//                         // This is a simplistic approach - in production you'd want better tracking
//                         // You could maintain a Map of correlationId -> timestamp
//                     }
//                 });
//             }
//         }
//     }
// }

// const rabbitMqClient = RabbitMqClient.getInstance();

// // Graceful shutdown handling
// process.on('SIGINT', async () => {
//     console.log('Received SIGINT, closing API Gateway RabbitMQ client...');
//     await rabbitMqClient.close();
//     process.exit(0);
// });

// process.on('SIGTERM', async () => {
//     console.log('Received SIGTERM, closing API Gateway RabbitMQ client...');
//     await rabbitMqClient.close();
//     process.exit(0);
// });

// // Periodic cleanup of old listeners
// setInterval(() => {
//     rabbitMqClient.clearOldListeners();
// }, 300000); // Every 5 minutes

// export default rabbitMqClient;