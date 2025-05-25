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

          const response: DriverInterface = await adminRabbitMqClient.produce(account_status, operation) as DriverInterface;
          console.log("response==", response);
          
          let data: any = response;
          
          if (response && Object.keys(response).length === 0) {
            data = [];
          }
          
          res.status(StatusCode.Created).json(data);
          
        } catch (e:any) {
          console.log(e);
           res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
        }
      }

      getVerifiedDrivers = async(req: Request, res: Response)=>{
        try {
          const operation = "get-admin-active-drivers";
          const account_status = "Good"

          const response: DriverInterface | [] = await adminRabbitMqClient.produce(account_status, operation)as DriverInterface
          let data: any = response;
          
          if (response && Object.keys(response).length === 0) {
            data = [];
          }
          
          res.status(StatusCode.Created).json(data);    
        } catch (e:any) {
          console.log(e);
           res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
        }
      }

      getBlockedDrivers = async(req: Request, res: Response)=>{
        try {
          const operation = "get-admin-blocked-drivers";
          const account_status = "Block";
          
          const response: DriverInterface = await adminRabbitMqClient.produce(account_status, operation)as DriverInterface
          let data: any = response;
          
          if (response && Object.keys(response).length === 0) {
            data = [];
          }
          
          res.status(StatusCode.Created).json(data);        } catch (e:any) {
          console.log(e);
           res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
        }
      }

      getDriverDetails = async(req: Request, res: Response) => {
        try {
          console.log(req.params.id);
          const operation = "get-admin-driver-details"
          const response:DriverInterface = await adminRabbitMqClient.produce(req.params,operation)as DriverInterface;
          console.log(response);
          
          res.status(StatusCode.OK).json(response);
          console.log(response);
        } catch (error) {
          console.log(error);
        }
      };

      updateDriverAccountStatus = async (req: Request, res: Response)=>{
        try {
          const id = req.params.id;          
          const {note,status,fields} = req.body;

          const operation = "admin-update-driver-account-status";
        
          const request = {id,reason:note,status,fields};
          
          const response = await adminRabbitMqClient.produce(request,operation);

          console.log("updateDriverAccountStatus response==",response);
          res.status(StatusCode.Accepted).json(response)
          
        } catch (error) {
          console.log(error);
        }
      }
}