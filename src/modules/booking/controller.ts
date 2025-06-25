import { Request, Response } from "express";
import { StatusCode } from "../../interfaces/enum";
import bookingRabbitMqClient from "../booking/rabbitmq/client";

export interface ControllerResponse {
  message: string;
  data?: any;
  status?: string;
}

export default class BookingController {
  async fetchVehicles(req: Request, res: Response) {
    try {
      const operation = "get-vehicles";
      console.log("entgere", operation);
      const data = (await bookingRabbitMqClient.produce(
        {},
        operation
      )) as ControllerResponse;
      console.log("get-vehicles-list==", data);
      if (data.message !== "Success") {
        res.status(StatusCode.NotFound).json({
          status: "Failed",
          message: data?.data,
        });
      } else {
        res.status(StatusCode.Accepted).json({
          status: "Success",
          message: data?.data,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(StatusCode.InternalServerError).json({
        status: "Failed",
        message: "Failed to register user",
      });
    }
  }

  async fetchDriverBookingList(req: Request, res: Response) {
    try {
      const operation = "get-driver-booking-list";
      // const {id} = req.params
      const id = req.user?.id;
      console.log("reach get-driver-booking-list", id);

      const data = (await bookingRabbitMqClient.produce(id, operation)) as any;
      console.log("booking-list data", data);

      if (data.status === "Failed") {
        res.status(StatusCode.InternalServerError).json({
          status: "Failed",
          data: data?.data,
        });
      } else {
        res.status(StatusCode.Accepted).json({
          status: "Success",
          data: data?.data,
        });
      }
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
      const operation = "get-driver-booking-details";
      const { id } = req.params;
      // const id = req.user?.id;
      console.log("reach get-driver-booking-details", id);

      const data = (await bookingRabbitMqClient.produce(id, operation)) as any;
      console.log("data====", data);

      if (data.status === "Failed") {
        res.status(StatusCode.InternalServerError).json({
          status: "Failed",
          data: data?.data,
        });
      } else {
        res.status(StatusCode.Accepted).json({
          status: "Success",
          data: data?.data,
        });
      }
    } catch (error) {
      res.status(StatusCode.InternalServerError).json({
        status: "Failed",
        data: "Failed to register user",
      });
    }
  }

  async cancelRide(userId: string, ride_id: string) {
    const data ={
      userId,
      ride_id,
    }    
        const response = await bookingRabbitMqClient.produce(data, "cancel_ride");

        return response;
    
  }
}
