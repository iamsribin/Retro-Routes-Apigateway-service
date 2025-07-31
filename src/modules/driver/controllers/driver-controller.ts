import { Request, Response } from "express";
import driverRabbitMqClient from "../rabbitmq/client";
import { StatusCode } from "../../../interfaces/enum";
import uploadToS3 from "../../../services/s3";
import { IResponse, DriverProfileDTO } from "../interface";

class DriverController {
  fetchDriverProfile = async (req: Request, res: Response) => {
    try {
      const operation = "get-driver-profile";
      const id = req.user?.id;

      const response = (await driverRabbitMqClient.produce(
        id,
        operation
      )) as IResponse<DriverProfileDTO>;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response.data);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response,
          navigate: -1,
        });
      }
    } catch (e: unknown) {
      console.log(e);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };

  updateDriverProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const file: Express.Multer.File | undefined = req.file;
      const id = req.user?.id;
      let imageUrl: string | null = null;

      if (file) imageUrl = await uploadToS3(file);

      const { name } = req.body;

      const data = {
        driverId: id,
        ...(name && { name }),
        ...(imageUrl && { imageUrl }),
      };

      const operation = "update-driver-profile";

      const response: IResponse<null> = (await driverRabbitMqClient.produce(
        data,
        operation
      )) as IResponse<null>;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response);
      } else {
        res.status(+response.status).json({
          status: response.status,
          message: response.message,
          data: response,
          navigate: -1,
        });
      }
    } catch (e: unknown) {
      console.log(e);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };

  fetchDriverDocuments = async (req: Request, res: Response) => {
    try {
      const operation = "get-driver-documents";
      const id = req.user?.id;

      const response = (await driverRabbitMqClient.produce(
        id,
        operation
      )) as IResponse<DriverProfileDTO>;

      if (response.status === StatusCode.Accepted) {
        res.status(response.status).json(response);
      } else {
        res.status(+response.status).json({
          status: response.status,
          message: response.message,
          data: response,
          navigate: -1,
        });
      }
    } catch (e: unknown) {
      console.log(e);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };

  updateDriverDocuments = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const driverId = req.user?.id;
      let section = req.body.section;

      const fields = req.body;

      const files = req.files as Express.Multer.File[];

      const fileUrls: Record<string, string> = {};
      for (const file of files) {
        const s3Url = await uploadToS3(file);
        fileUrls[file.fieldname] = s3Url;
      }

      if (!["vehicleDetails", "license", "aadhar"].includes(section)) {
        section = "vehicleDetails";
      }

      const payload = {
        driverId,
        section,
        updates: {
          ...fields,
          ...fileUrls,
        },
      };

      const operation = "update-driver-documents";

      const response: IResponse<null> = (await driverRabbitMqClient.produce(
        payload,
        operation
      )) as IResponse<null>;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response);
      } else {
        res.status(+response.status).json({
          status: response.status,
          message: response.message,
          data: response,
          navigator: response.navigate || "",
        });
      }
    } catch (e: unknown) {
      console.log(e);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };

  uploadChatFile = async (req: Request, res: Response) => {
    try {
      const files: any = req.files;
      let Url = "";
      if (files) {
        [Url] = await Promise.all([uploadToS3(files["file"][0])]);
      }
      res
        .status(StatusCode.Accepted)
        .json({ message: "success", fileUrl: Url });
    } catch (error) {
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };
  
  getOnlineDriverDetails = async (id: string) => {
    try {
      const operation = "get-online-driver";
      const driverDetails = await driverRabbitMqClient.produce(id, operation);

      console.log("get-online-driver:", driverDetails);
      return driverDetails;
    } catch (error) {}
  };
  
  updateDriverCancelCount = async (id: string) => {
    try {
      const operation = "update-driver-cancel-count";
      const data = await driverRabbitMqClient.produce(id, operation);
      return data;
    } catch (error) {}
  };
}

export const driverController = new DriverController();
