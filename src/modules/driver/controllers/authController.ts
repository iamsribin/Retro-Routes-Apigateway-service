import { Request, Response, NextFunction } from "express";
import driverRabbitMqClient from "../rabbitmq/client";
import { StatusCode } from "../../../interfaces/enum";
import uploadToS3 from "../../../services/s3";
import { AuthResponse, Message } from "../../../interfaces/interface";
export default class driverAuthController{

  checkLogin=async(req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {   
        console.log(req.body,"driver login");
        const {mobile}=req.body
        const operation = "login-check";
        const response: Message = await driverRabbitMqClient.produce({mobile}, operation) as Message
        res.status(StatusCode.Created).json(response);
      } catch (e: any) {
        console.log(e);
         res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
      }
    }
  checkGoogleLoginDriver=async(req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        console.log(req.body,"driver login");
        const {email}=req.body
        const operation = "google-login";
        const response: AuthResponse = await driverRabbitMqClient.produce({email}, operation) as AuthResponse
        console.log(response);
        res.status(StatusCode.Created).json(response);
      } catch (e: any) {
        console.log(e);
         res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });

      }
    }

    register=async(req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const operation = "driver-register";
        const response: Message = await driverRabbitMqClient.produce(req.body, operation) as Message
        res.status(StatusCode.Created).json(response);
      } catch (e: any) {
        console.log(e);
         res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
      }
    }
    checkDriver=async(req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const operation = "driver-check";
        const response: Message = await driverRabbitMqClient.produce(req.body, operation) as Message
        res.status(StatusCode.Created).json(response);
      } catch (e: any) {
        console.log(e);
         res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
      }
    }

    location=async(req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const operation = "driver-location";
        const response: Message = await driverRabbitMqClient.produce({...req.body,...req.query}, operation) as Message
        res.status(StatusCode.Created).json(response);
      } catch (e: any) {
        console.log(e);
        return res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
      }
    }

    identificationUpdate=async(req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
          const files:any=req.files
          let aadharImageUrl=""
          let licenseImageUrl=""
          if(files){
            [aadharImageUrl, licenseImageUrl] = await Promise.all([
              uploadToS3(files["aadharImage"][0]),
              uploadToS3(files["licenseImage"][0])
          ]);
              console.log(licenseImageUrl);
              console.log(aadharImageUrl);
              
          }
        const operation = "identification-update";
        const response: Message = await driverRabbitMqClient.produce({...req.body,...req.query,aadharImageUrl,licenseImageUrl}, operation) as Message
        res.status(StatusCode.Created).json(response);
      } catch (e: any) {
        console.log(e);
        return res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
      }
    }

    updateDriverImage=async(req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const files:Express.Multer.File | undefined =req.file
        let url=""
        if(files){
          url=await uploadToS3(files)
          console.log(url);
        }
        const operation = "driver-image-update";
        const response: Message = await driverRabbitMqClient.produce({...req.query,url}, operation) as Message
        res.status(StatusCode.Created).json(response);
      } catch (e: any) {
        console.log(e);
        return res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
      }
    }

    vehicleUpdate=async(req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
          const files:any=req.files
          let rcImageUrl=""
          let carImageUrl=""
          if(files){
          [rcImageUrl, carImageUrl] = await Promise.all([
              uploadToS3(files["rcImage"][0]),
              uploadToS3(files["carImage"][0])
          ]);
              console.log(carImageUrl,rcImageUrl);
              
          }
        const operation = "vehicle-image-update";
        const response: Message = await driverRabbitMqClient.produce({...req.body,...req.query,rcImageUrl,carImageUrl}, operation) as Message
        res.status(StatusCode.Created).json(response);
      } catch (e: any) {
        console.log(e);
        return res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
      }
    }


}