import { Request, Response } from "express";
import adminRabbitMqClient from "../../driver/rabbitmq/client";
import { StatusCode } from "../../../interfaces/enum";
import { Res_AdminGetDriverDetailsById, Res_adminUpdateDriverStatus, Res_getDriversListByAccountStatus } from "../interface";

export default class DriverController {
  pendingDrivers = async (req: Request, res: Response) => {
    try {
      const operation = "get-admin-drivers-by-status";
      const account_status = "Pending";

      const response = (await adminRabbitMqClient.produce(
        account_status,
        operation
      )) as Res_getDriversListByAccountStatus;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response.data);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response.data,
        });
      }
    } catch (e: unknown) {
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };

  getVerifiedDrivers = async (req: Request, res: Response) => {
    try {
      const operation = "get-admin-drivers-by-status";
      const account_status = "Good";

      const response = (await adminRabbitMqClient.produce(
        account_status,
        operation
      )) as Res_getDriversListByAccountStatus;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response.data);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response.data,
        });
      }
    } catch (e: unknown) {
      console.log("error mess", e);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };

  getBlockedDrivers = async (req: Request, res: Response) => {
    try {
      const operation = "get-admin-drivers-by-status";
      const account_status = "Blocked";

      const response = (await adminRabbitMqClient.produce(
        account_status,
        operation
      )) as Res_getDriversListByAccountStatus;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response.data);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response.data,
        });
      }

    } catch (e: unknown) {
      console.log(e);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };

  getDriverDetails = async (req: Request, res: Response) => {
    try {
      const operation = "get-admin-driver-details";

      const response: Res_AdminGetDriverDetailsById = (await adminRabbitMqClient.produce(
        req.params.id,
        operation
      )) as Res_AdminGetDriverDetailsById ;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response.data);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response.data,
          navigate:"/admin/drivers"
        });
      }

    } catch (e: unknown) {
      console.log(e);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }

  };

  updateDriverAccountStatus = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const { note, status, fields } = req.body;

      const operation = "admin-update-driver-account-status";

      const request = { id, reason: note, status, fields };

      const response = await adminRabbitMqClient.produce(request, operation) as Res_adminUpdateDriverStatus;

     if (response.status === StatusCode.OK) {
        res.status(response.status).json(response.data);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response.data,
          navigate:"/admin/drivers"
        });
      }

    } catch (e: unknown) {
      console.log(e);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };
}
