import { Request, Response, NextFunction } from "express";
import driverRabbitMqClient from "../rabbitmq/client";
import { StatusCode } from '../../../interfaces/enum';
import uploadToS3 from '../../../services/s3';
import { AuthResponse, Message } from "../../../interfaces/interface";

export default class DriverAuthController {

  checkLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      console.log(req.body, "driver login");
      const { mobile } = req.body;
      const operation = "login-check";
      const response: Message = await driverRabbitMqClient.produce(
        { mobile },
        operation 
      ) as Message;
      return res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      return res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };
      
  checkGoogleLoginDriver = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      console.log(req.body, "driver login");
      const { email } = req.body;
      const operation = "google-login";
      const response: AuthResponse = await driverRabbitMqClient.produce({ email }, operation) as AuthResponse;
      console.log("====", response);
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      return res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  };

  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "driver-register";
      const response: Message = await driverRabbitMqClient.produce(req.body, operation) as Message;
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      return res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  };

  checkDriver = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "driver-check";
      const response: Message = await driverRabbitMqClient.produce(req.body, operation) as Message;
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      return res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  };

  location = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "driver-location";
      const response: Message = await driverRabbitMqClient.produce({ ...req.body, ...req.query }, operation) as Message;
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      return res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  };

  identificationUpdate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const files: any = req.files;
      let aadharImageUrl = "";
      let licenseImageUrl = "";
      if (files) {
        [aadharImageUrl, licenseImageUrl] = await Promise.all([
          uploadToS3(files["aadharImage"][0]),
          uploadToS3(files["licenseImage"][0])
        ]);
        console.log(licenseImageUrl);
        console.log(aadharImageUrl);
      }
      const operation = "identification-update";
      const response: Message = await driverRabbitMqClient.produce({ ...req.body, ...req.query, aadharImageUrl, licenseImageUrl }, operation) as Message;
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      return res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  };

  updateDriverImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const files: Express.Multer.File | undefined = req.file;
      let url = "";
      if (files) {
        url = await uploadToS3(files);
        console.log(url);
      }
      const operation = "driver-image-update";
      const response: Message = await driverRabbitMqClient.produce({ ...req.query, url }, operation) as Message;
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      return res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  };

  vehicleUpdate = async (
    req: Request,
    res: Response
  ) => {
    try {
      const files: any = req.files;
      let rcImageUrl = "";
      let carImageUrl = "";
      if (files) {
        [rcImageUrl, carImageUrl] = await Promise.all([
          uploadToS3(files["rcImage"][0]),
          uploadToS3(files["carImage"][0])
        ]);
        console.log(carImageUrl, rcImageUrl);
      }
      const operation = "vehicle-image-update";
      const response: Message = await driverRabbitMqClient.produce({ ...req.body, ...req.query, rcImageUrl, carImageUrl }, operation) as Message;
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      return res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  };

  fetchDriverDetails = async (
    req: Request,
    res: Response
  ) => {
    try {
      const operation = "get-driver-profile";
      const id = req.user?.id;
      const response = await driverRabbitMqClient.produce(id, operation);

      res.status(StatusCode.Accepted).json(response);
    } catch (error) {
      console.log(error);
      res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
  };

updateDriverDetails = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { field } = req.body;
      // Parse the stringified data field
      const data = JSON.parse(req.body.data || "{}");
      const files: any = req.files;
      console.log("files==", files);
      console.log("parsed data==", data);

      let updateData = { ...data};
      console.log("before updateData===", updateData);

      // Handle file uploads based on the field
      switch (field) {
        case "aadhar":
          if (files) {
            const [frontUrl, backUrl] = await Promise.all([
              files["aadharFrontImage"]?.[0]
                ? uploadToS3(files["aadharFrontImage"][0])
                : Promise.resolve(data.aadharFrontImageUrl || ""),
              files["aadharBackImage"]?.[0]
                ? uploadToS3(files["aadharBackImage"][0])
                : Promise.resolve(data.aadharBackImageUrl || ""),
            ]);
            updateData.aadharFrontImageUrl = frontUrl || data.aadharFrontImageUrl || "";
            updateData.aadharBackImageUrl = backUrl || data.aadharBackImageUrl || "";
          }
          break;
        case "license":
          if (files) {
            const [frontUrl, backUrl] = await Promise.all([
              files["licenseFrontImage"]?.[0]
                ? uploadToS3(files["licenseFrontImage"][0])
                : Promise.resolve(data.licenseFrontImageUrl || ""),
              files["licenseBackImage"]?.[0]
                ? uploadToS3(files["licenseBackImage"][0])
                : Promise.resolve(data.licenseBackImageUrl || ""),
            ]);
            updateData.licenseFrontImageUrl = frontUrl || data.licenseFrontImageUrl || "";
            updateData.licenseBackImageUrl = backUrl || data.licenseBackImageUrl || "";
          }
          break;
        case "rc":
          if (files) {
            const [frontUrl, backUrl] = await Promise.all([
              files["rcFrontImage"]?.[0]
                ? uploadToS3(files["rcFrontImage"][0])
                : Promise.resolve(data.rcFrondImageUrl || ""),
              files["rcBackImage"]?.[0]
                ? uploadToS3(files["rcBackImage"][0])
                : Promise.resolve(data.rcBackImageUrl || ""),
            ]);
            updateData.rcFrondImageUrl = frontUrl || data.rcFrondImageUrl || "";
            updateData.rcBackImageUrl = backUrl || data.rcBackImageUrl || "";
          }
          break;
        case "carImage":
          if (files) {
            const [frontUrl, backUrl] = await Promise.all([
              files["carFrontImage"]?.[0]
                ? uploadToS3(files["carFrontImage"][0])
                : Promise.resolve(data.carFrondImageUrl || ""),
              files["carBackImage"]?.[0]
                ? uploadToS3(files["carBackImage"][0])
                : Promise.resolve(data.carBackImageUrl || ""),
            ]);
            updateData.carFrondImageUrl = frontUrl || data.carFrondImageUrl || "";
            updateData.carBackImageUrl = backUrl || data.carBackImageUrl || "";
          }
          break;
        case "insurance":
          if (files && files["insuranceImage"]?.[0]) {
            updateData.insuranceImageUrl = (await uploadToS3(files["insuranceImage"][0])) || data.insuranceImageUrl || "";
          }
          break;
        case "pollution":
          if (files && files["pollutionImage"]?.[0]) {
            updateData.pollutionImageUrl = (await uploadToS3(files["pollutionImage"][0])) || data.pollutionImageUrl || "";
          }
          break;
        case "driverImage":
          if (files && files["driverImage"]?.[0]) {
            updateData.driverImageUrl = (await uploadToS3(files["driverImage"][0])) || data.driverImageUrl || "";
          }
          break;
      }

      console.log("after updateData===", updateData);

      const operation = "update-driver-profile";
      const response: Message = await driverRabbitMqClient.produce(
        { driverId:id, field, data: updateData },
        operation
      ) as Message;
      res.status(StatusCode.OK).json(response);
    } catch (e: any) {
      console.error("Error in updateDriverDetails:", e);
      res.status(StatusCode.InternalServerError).json({ message: "Internal Server Error" });
    }
  };

  uploadChatFile = async(req: Request, res: Response)=>{
try {
        const files: any = req.files;
      let Url = "";
      if (files) {
        [Url] = await Promise.all([
          uploadToS3(files["file"][0]),
        ]);
      }
      console.log("insurance", Url);

      res.status(StatusCode.Accepted).json({message:"success",fileUrl:Url})
} catch (error) {
  res.status(StatusCode.InternalServerError).json({message:"Internal Server Error",})
}
  }
}