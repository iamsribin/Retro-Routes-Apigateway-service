import { Request, Response } from "express";
import { StatusCode } from "../../types/common/enum";
import { RideService } from "./config/ride.client";
import { IResponse } from "../driver/interface";
import { PricingInterface } from "../../interfaces/pricing.interface";
// import bookingRabbitMqClient from "../booking/rabbitmq/client";

export interface ControllerResponse {
  message: string;
  data?: any;
  status?: string;
}

class BookingController {
  async fetchVehicles(req: Request, res: Response) {
    try {
      await RideService.fetchVehicles(
        {},
        (err: Error | null, response: IResponse<PricingInterface[]>) => {
          if (err || Number(response.status) !== StatusCode.OK) {
            return res.status(+response?.status || 500).json({
              message: response?.message || "Something went wrong",
              data: response,
              navigate: response?.navigate || "",
            });
          }

          res.status(+response.status).json(response.data);
        }
      );
    } catch (error) {
      console.log(error);
      res.status(StatusCode.InternalServerError).json({
        status: "Failed",
        message: "Failed to register user",
      });
    }
  }

  async bookCab(req: Request, res: Response) {
    try {
      const data = req.body;
      const id = req.user?.id;
      data.userId = id;
      RideService.bookCab(data, (err: Error | null, response: any) => {
        if (err || Number(response.status) !== StatusCode.Created) {
          return res.status(+response?.status || 500).json({
            message: response?.message || "Something went wrong",
            data: response,
            navigate: response?.navigate || "",
          });
        }
        res.status(+response.status).json(response);
      });
    } catch (error) {
      console.log("errorr", error);
      res.status(StatusCode.InternalServerError).json({
        status: "Failed",
        message: "Failed to register user",
      });
    }
  }

  async fetchDriverBookingList(req: Request, res: Response) {
    try {
      const id = req.user?.id;

      RideService.fetchDriverBookingList(
        { id },
        (err: Error | null, response: any) => {
          if (err || Number(response.status) !== StatusCode.OK) {
            return res.status(+response?.status || 500).json({
              message: response?.message || "Something went wrong",
              data: response,
              navigate: response?.navigate || "",
            });
          }
          res.status(+response.status).json(response.data || []);
        }
      );
    } catch (error) {
      console.log("fetchDriverBookingList error", error);

      res.status(StatusCode.InternalServerError).json({
        status: "Failed",
        data: "Failed to register user",
      });
    }
  }

  async fetchDriverBookingDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // const id = req.user?.id;
      console.log("reach get-driver-booking-details", id);

      RideService.fetchDriverBookingDetails(
        { id },
        (err: Error | null, response: any) => {
          console.log("response", response);

          if (err || Number(response.status) !== StatusCode.OK) {
            return res.status(+response?.status || 500).json({
              message: response?.message || "Something went wrong",
              data: response,
              navigate: response?.navigate || "",
            });
          }
          res.status(+response.status).json(response.data);
        }
      );
    } catch (error) {
      res.status(StatusCode.InternalServerError).json({
        status: "Failed",
        data: "Failed to register user",
      });
    }
  }

  async checkSecurityPin(req: Request, res: Response) {
    try {
      const { securityPin, bookingId } = req.body;
      const payload = {
        securityPin,
        bookingId,
      };
      console.log("checkSecurityPin", payload);

      RideService.checkSecurityPin(
        payload,
        (err: Error | null, response: any) => {
          console.log("response", response);

          if (err || Number(response.status) !== StatusCode.Accepted) {
            return res.status(+response?.status || 500).json({
              message: response?.message || "Something went wrong",
              data: response,
              navigate: response?.navigate || "",
            });
          }
          res.status(+response.status).json(response.data);
        }
      );
    } catch (error) {
      res.status(StatusCode.InternalServerError).json({
        status: "Failed",
        data: "Failed to register user",
      });
    }
  }

  async cancelRide(userId: string, ride_id: string) {
    const data = {
      userId,
      ride_id,
    };
    // const response = await bookingRabbitMqClient.produce(data, "cancel_ride");

    // return response;
  }
}

export const bookingController = new BookingController();
