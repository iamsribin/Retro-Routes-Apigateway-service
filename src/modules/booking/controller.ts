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
}
   