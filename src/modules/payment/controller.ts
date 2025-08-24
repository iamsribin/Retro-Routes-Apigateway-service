import { Request, Response } from 'express';
import { StatusCode } from '../../types/common/enum';
import { PaymentService } from './config/grpc-client/payment.client';

export default class PaymentController {
  async createCheckoutSession(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId, userId, driverId, amount } = req.body;

      // Validate input
      if (!bookingId || !userId || !driverId || !amount) {
        res.status(StatusCode.BadRequest).json({ message: 'Missing required fields' });
        return;
      }

      // Call payment service via gRPC
      await PaymentService.CreateCheckoutSession(
        { bookingId, userId, driverId, amount },
        (err: Error | null, result: { sessionId: string; message: string }) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err.message });
            return;
          }
          res.status(StatusCode.Created).json(result);
        }
      );
    } catch (error) {
      res.status(StatusCode.InternalServerError).json({ message: 'Failed to create checkout session' });
    }
  }

  async processWalletPayment(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId, userId, driverId, amount } = req.body;

      // Validate input
      if (!bookingId || !userId || !driverId || !amount) {
        res.status(StatusCode.BadRequest).json({ message: 'Missing required fields' });
        return;
      }

      // Call payment service via gRPC
      await PaymentService.ProcessWalletPayment(
        { bookingId, userId, driverId, amount },
        (err: Error | null, result: { transactionId: string; message: string }) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err.message });
            return;
          }
          res.status(StatusCode.Created).json(result);
        }
      );
    } catch (error) {
      res.status(StatusCode.InternalServerError).json({ message: 'Failed to process wallet payment' });
    }
  }

  async processCashPayment(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId, userId, driverId, amount,idempotencyKey=123 } = req.body;
     console.log("bookingId, userId, driverId, amount",bookingId, userId, driverId, amount);

      // Validate input
      if (!bookingId || !userId || !driverId || !amount) {
        res.status(StatusCode.BadRequest).json({ message: 'Missing required fields' });
        return;
      }

      // Call payment service via gRPC
      await PaymentService.ProcessCashPayment(
        { bookingId, userId, driverId, amount,idempotencyKey },
        (err: Error | null, result: { transactionId: string; message: string }) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err.message });
            return;
          }
          res.status(StatusCode.Created).json(result);
        }
      );
    } catch (error) {
      res.status(StatusCode.InternalServerError).json({ message: 'Failed to process cash payment' });
    }
  }

  async getTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Call payment service via gRPC
      await PaymentService.GetTransaction(
        { transactionId: id },
        (err: Error | null, result: any) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err.message });
            return;
          }
          res.status(StatusCode.OK).json(result);
        }
      );
    } catch (error) {
      res.status(StatusCode.InternalServerError).json({ message: 'Failed to fetch transaction' });
    }
  }

  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    // Note: Webhook handling will be implemented in the payment service
    // This endpoint just forwards the webhook to the payment service
    try {
      const payload = req.body;

      await PaymentService.HandleWebhook(
        { payload: JSON.stringify(payload) },
        (err: Error | null, result: { message: string }) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err.message });
            return;
          }
          res.status(StatusCode.OK).json(result);
        }
      );
    } catch (error) {
      res.status(StatusCode.InternalServerError).json({ message: 'Failed to process webhook' });
    }
  }
}