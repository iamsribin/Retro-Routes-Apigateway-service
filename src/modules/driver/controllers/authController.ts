import { Request, Response, NextFunction } from "express";
import driverRabbitMqClient from "../rabbitmq/client";
import { StatusCode } from "../../../interfaces/enum";
import uploadToS3 from "../../../services/s3";
import { AuthResponse, Message } from "../../../interfaces/interface";

export default class driverAuthController {
  checkLogin = async (req: Request, res: Response) => {
    try {
      console.log(req.body, "driver login");
      const { mobile } = req.body;
      const operation = "login-check";
      console.log("=======");
      
      const response: Message = await driverRabbitMqClient.produce({ mobile }, operation) as Message;
      console.log(response);
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  }

  checkGoogleLoginDriver = async (req: Request, res: Response) => {
    try {
      console.log(req.body, "driver login");
      const { email } = req.body;
      const operation = "google-login";
      const response: AuthResponse = await driverRabbitMqClient.produce({ email }, operation) as AuthResponse;
      console.log("google-login==",response);
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  }

  register = async (req: Request, res: Response) => {
    try {
      const operation = "driver-register";
      const { name, email, mobile, password, reffered_code } = req.body;
      console.log();

      const userData = {
        name,
        email,
        mobile,
        password,
        referral_code: reffered_code,
      };
      
      const response: Message = await driverRabbitMqClient.produce(userData, operation) as Message;
      console.log(response);
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  }

  checkDriver = async (req: Request, res: Response) => {
    try {
      const operation = "driver-check";
      const response: Message = await driverRabbitMqClient.produce(req.body, operation) as Message;
      console.log("driver-check==",response);
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  }

  location = async (req: Request, res: Response) => {
    try {
      const operation = "driver-location";
      const response: Message = await driverRabbitMqClient.produce({ ...req.body, ...req.query }, operation) as Message;
      console.log(response);
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  }

  identificationUpdate = async (req: Request, res: Response) => {
    try {
      const files: any = req.files;
      let aadharFrontImage = "sample";
      let aadharBackImage = "sample";
      let licenseFrontImage = "sample";
      let licenseBackImage = "sample";
      if (files) {
        [aadharFrontImage, aadharBackImage, licenseFrontImage, licenseBackImage] = await Promise.all([
          uploadToS3(files["aadharFrontImage"][0]),
          uploadToS3(files["aadharBackImage"][0]),
          uploadToS3(files["licenseFrontImage"][0]),
          uploadToS3(files["licenseBackImage"][0]),
        ]);
        console.log("aadharBackImage", aadharBackImage);
        console.log("aadharFrontImage", aadharFrontImage);
        console.log("licenseFrontImage", licenseFrontImage);
        console.log("licenseBackImage", licenseBackImage);
      } 
      console.log(req.body, req.query);
      
      const operation = "identification-update";
      const response: Message = await driverRabbitMqClient.produce(
        { ...req.body, ...req.query, aadharFrontImage, aadharBackImage, licenseFrontImage, licenseBackImage },
        operation
      ) as Message;
      console.log(response);
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  }

  updateDriverImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files: Express.Multer.File | undefined = req.file;
      let url = "sample";
      if (files) {
        url = await uploadToS3(files);
      }
      const operation = "driver-image-update";
      
      const response: Message = await driverRabbitMqClient.produce({ ...req.query,driverImageUrl: url }, operation) as Message;
      console.log(response);
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  }

  vehicleUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files: any = req.files;
      let rcFrondImageUrl = "";
      let rcBackImageUrl = "";
      let carFrondImageUrl = "";
      let carBackImageUrl = "";
      // if (files) {
      //   [rcFrondImageUrl, rcBackImageUrl, carFrondImageUrl, carBackImageUrl] = await Promise.all([
      //     uploadToS3(files["rcFrontImage"][0]),
      //     uploadToS3(files["rcBackImage"][0]),
      //     uploadToS3(files["carFrontImage"][0]),
      //     uploadToS3(files["carSideImage"][0]),
      //   ]);
      //   console.log(rcFrondImageUrl, rcBackImageUrl, carFrondImageUrl, carBackImageUrl);
      // }

  rcFrondImageUrl= 'https://retro-routes-store.s3.eu-north-1.amazonaws.com/1750057447143';
  rcBackImageUrl= 'https://retro-routes-store.s3.eu-north-1.amazonaws.com/1750057447145';
  carFrondImageUrl= 'https://retro-routes-store.s3.eu-north-1.amazonaws.com/1750057447150';
  carBackImageUrl ='https://retro-routes-store.s3.eu-north-1.amazonaws.com/1750057447151';


      const operation = "vehicle-image&RC-update";
      const response: Message = await driverRabbitMqClient.produce(
        { ...req.body, ...req.query, rcFrondImageUrl, rcBackImageUrl, carFrondImageUrl, carBackImageUrl },
        operation
      ) as Message;
      console.log(response);
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  }

  vehicleInsurancePolutionUpdate = async (req: Request, res: Response) => {
    try {
      const files: any = req.files;
      let pollutionImageUrl = "";
      let insuranceImageUrl = "";
      if (files) {
        [pollutionImageUrl, insuranceImageUrl] = await Promise.all([
          uploadToS3(files["pollutionImage"][0]),
          uploadToS3(files["insuranceImage"][0]),
        ]);
      }
      console.log("insurance", pollutionImageUrl, insuranceImageUrl);
      const operation = "vehicle-insurance&pollution-update";
      console.log(pollutionImageUrl, insuranceImageUrl);
      const response: Message = await driverRabbitMqClient.produce(
        { ...req.query, ...req.body, pollutionImageUrl, insuranceImageUrl },
        operation
      ) as Message;
      console.log(response);
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  }

  getResubmissionData = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const operation = "get-resubmission-documents";
      const response = await driverRabbitMqClient.produce({ id }, operation);
      console.log("findResubmissonData", response);
      console.log(response);
      res.status(StatusCode.Accepted).json(response);
    } catch (error) {
      console.log(error);
      res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  }

  postResubmissionData = async (req: Request, res: Response) => {
    try {
      const { driverId } = req.query;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const body = req.body;
      const uploadPromises: Promise<string>[] = [];
      const fileFields = [
        "aadharFrontImage",
        "aadharBackImage",
        "licenseFrontImage",
        "licenseBackImage",
        "rcFrontImage",
        "rcBackImage",
        "carFrontImage",
        "carBackImage",
        "insuranceImage",
        "pollutionImage",
        "driverImage",
      ];
      const fileUrls: { [key: string]: string } = {};
      fileFields.forEach((field) => {
        console.log("fiels==❤️❤️❤️", files[field]?.[0]);
        if (files[field]?.[0]) {
          uploadPromises.push(
            uploadToS3(files[field][0]).then((url) => {
              fileUrls[field] = url;
              return url;
            })
          );
        }
      });
      await Promise.all(uploadPromises);
      const payload = {
        driverId,
        ...body,
        ...fileUrls,
      };
      console.log("Sending to driver service:", payload);
      const operation = "post-resubmission-documents";
      const response = await driverRabbitMqClient.produce({
      ...payload
      }, operation);
      console.log("Response from driver service:", response);
      console.log(response);
      res.status(StatusCode.Accepted).json(response);
    } catch (error) {
      console.error("Error in postResubmissionData:", error);
      res.status(StatusCode.InternalServerError).json({ message: "Internal Server Error" });
    }
  }
}