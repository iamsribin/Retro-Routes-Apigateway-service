import { Request, Response } from "express"
import { DriverInterface } from "../../../interfaces/mongo";
import adminRabbitMqClient from "../../driver/rabbitmq/client"
import { StatusCode } from "../../../interfaces/enum";


export default class DriverController{
    pendingDrivers=async(req: Request,
        res: Response,
      ) => {
        try {
          const operation = "get-admin-pending-drivers";
          const account_status = "Pending";

          const response: DriverInterface = await adminRabbitMqClient.produce(account_status, operation)as DriverInterface
          res.status(StatusCode.Created).json(response);
        } catch (e:any) {
          console.log(e);
           res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });

        }
      }

      getVerifiedDrivers = async(req: Request, res: Response)=>{
        try {
          const operation = "get-admin-active-drivers";
          const account_status = "Active"

          const response: DriverInterface = await adminRabbitMqClient.produce(account_status, operation)as DriverInterface
          res.status(StatusCode.Created).json(response);
        } catch (e:any) {
          console.log(e);
           res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
        }
      }

      getBlockedDrivers = async(req: Request, res: Response)=>{
        try {
          const operation = "get-admin-blocked-drivers";
          const account_status = "Blocked";
          
          const response: DriverInterface = await adminRabbitMqClient.produce(account_status, operation)as DriverInterface
          res.status(StatusCode.Created).json(response);
        } catch (e:any) {
          console.log(e);
           res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
        }
      }
}