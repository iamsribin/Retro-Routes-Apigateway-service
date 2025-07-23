import { Request, Response, NextFunction } from "express";
import driverRabbitMqClient from "../rabbitmq/client";
import { StatusCode } from "../../../interfaces/enum";
import uploadToS3 from "../../../services/s3";
import { IResponse, DriverProfileDTO } from "../interface";

export default class DriverController {
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

  // updateDriverProfile = async (req: Request, res: Response) => {
  //     try {
  //       const { id } = req.params;
  //       const { field } = req.body;
  //       const data = JSON.parse(req.body.data || "{}");
  //       const files: any = req.files;
  //       console.log("files==", files);
  //       console.log("parsed data==", data);

  //       let updateData = { ...data};
  //       console.log("before updateData===", updateData);

  //       // Handle file uploads based on the field
  //       switch (field) {
  //         case "aadhar":
  //           if (files) {
  //             const [frontUrl, backUrl] = await Promise.all([
  //               files["aadharFrontImage"]?.[0]
  //                 ? uploadToS3(files["aadharFrontImage"][0])
  //                 : Promise.resolve(data.aadharFrontImageUrl || ""),
  //               files["aadharBackImage"]?.[0]
  //                 ? uploadToS3(files["aadharBackImage"][0])
  //                 : Promise.resolve(data.aadharBackImageUrl || ""),
  //             ]);
  //             updateData.aadharFrontImageUrl = frontUrl || data.aadharFrontImageUrl || "";
  //             updateData.aadharBackImageUrl = backUrl || data.aadharBackImageUrl || "";
  //           }
  //           break;
  //         case "license":
  //           if (files) {
  //             const [frontUrl, backUrl] = await Promise.all([
  //               files["licenseFrontImage"]?.[0]
  //                 ? uploadToS3(files["licenseFrontImage"][0])
  //                 : Promise.resolve(data.licenseFrontImageUrl || ""),
  //               files["licenseBackImage"]?.[0]
  //                 ? uploadToS3(files["licenseBackImage"][0])
  //                 : Promise.resolve(data.licenseBackImageUrl || ""),
  //             ]);
  //             updateData.licenseFrontImageUrl = frontUrl || data.licenseFrontImageUrl || "";
  //             updateData.licenseBackImageUrl = backUrl || data.licenseBackImageUrl || "";
  //           }
  //           break;
  //         case "rc":
  //           if (files) {
  //             const [frontUrl, backUrl] = await Promise.all([
  //               files["rcFrontImage"]?.[0]
  //                 ? uploadToS3(files["rcFrontImage"][0])
  //                 : Promise.resolve(data.rcFrondImageUrl || ""),
  //               files["rcBackImage"]?.[0]
  //                 ? uploadToS3(files["rcBackImage"][0])
  //                 : Promise.resolve(data.rcBackImageUrl || ""),
  //             ]);
  //             updateData.rcFrondImageUrl = frontUrl || data.rcFrondImageUrl || "";
  //             updateData.rcBackImageUrl = backUrl || data.rcBackImageUrl || "";
  //           }
  //           break;
  //         case "carImage":
  //           if (files) {
  //             const [frontUrl, backUrl] = await Promise.all([
  //               files["carFrontImage"]?.[0]
  //                 ? uploadToS3(files["carFrontImage"][0])
  //                 : Promise.resolve(data.carFrondImageUrl || ""),
  //               files["carBackImage"]?.[0]
  //                 ? uploadToS3(files["carBackImage"][0])
  //                 : Promise.resolve(data.carBackImageUrl || ""),
  //             ]);
  //             updateData.carFrondImageUrl = frontUrl || data.carFrondImageUrl || "";
  //             updateData.carBackImageUrl = backUrl || data.carBackImageUrl || "";
  //           }
  //           break;
  //         case "insurance":
  //           if (files && files["insuranceImage"]?.[0]) {
  //             updateData.insuranceImageUrl = (await uploadToS3(files["insuranceImage"][0])) || data.insuranceImageUrl || "";
  //           }
  //           break;
  //         case "pollution":
  //           if (files && files["pollutionImage"]?.[0]) {
  //             updateData.pollutionImageUrl = (await uploadToS3(files["pollutionImage"][0])) || data.pollutionImageUrl || "";
  //           }
  //           break;
  //         case "driverImage":
  //           if (files && files["driverImage"]?.[0]) {
  //             updateData.driverImageUrl = (await uploadToS3(files["driverImage"][0])) || data.driverImageUrl || "";
  //           }
  //           break;
  //       }

  //       console.log("after updateData===", updateData);

  //       const operation = "update-driver-profile";
  //       const response: Message = await driverRabbitMqClient.produce(
  //         { driverId:id, field, data: updateData },
  //         operation
  //       ) as Message;
  //       res.status(StatusCode.OK).json(response);
  //     } catch (e: any) {
  //       console.error("Error in updateDriverDetails:", e);
  //       res.status(StatusCode.InternalServerError).json({ message: "Internal Server Error" });
  //     }
  //   };

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
          status:response.status,
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

  uploadChatFile = async (req: Request, res: Response) => {
    try {
      const files: any = req.files;
      let Url = "";
      if (files) {
        [Url] = await Promise.all([uploadToS3(files["file"][0])]);
      }
      console.log("insurance", Url);

      res
        .status(StatusCode.Accepted)
        .json({ message: "success", fileUrl: Url });
    } catch (error) {
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };
}
