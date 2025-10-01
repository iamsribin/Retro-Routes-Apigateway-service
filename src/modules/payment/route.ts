import express from 'express';
import PaymentController from './controller';

const paymentController = new PaymentController();
const publicPaymentRoute = express.Router();
const protectedPaymentRoute = express.Router();

publicPaymentRoute.post('/webhook', paymentController.handleStripeWebhook);

// Protected routes (require user authentication)
protectedPaymentRoute.post('/create-checkout-session', paymentController.createCheckoutSession);
protectedPaymentRoute.post('/wallet-payment', paymentController.processWalletPayment);
protectedPaymentRoute.post('/cash-payment', paymentController.conformCashPayment);
protectedPaymentRoute.get('/transaction/:id', paymentController.getTransaction);

export { publicPaymentRoute, protectedPaymentRoute };