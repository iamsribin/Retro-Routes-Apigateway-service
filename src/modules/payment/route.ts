import express from 'express';
import PaymentController from './controller';

const paymentController = new PaymentController();
const publicPaymentRoute = express.Router();
const protectedPaymentRoute = express.Router();

// Public routes (e.g., for Stripe webhooks)
publicPaymentRoute.post('/webhook', paymentController.handleStripeWebhook);

// Protected routes (require user authentication)
protectedPaymentRoute.post('/create-checkout-session', paymentController.createCheckoutSession);
protectedPaymentRoute.post('/wallet-payment', paymentController.processWalletPayment);
protectedPaymentRoute.post('/cash-payment', paymentController.processCashPayment);
protectedPaymentRoute.get('/transaction/:id', paymentController.getTransaction);

export { publicPaymentRoute, protectedPaymentRoute };