import { Request, Response } from "express";
import { StatusCode } from "../../../types/common/enum";
import uploadToS3, { uploadToS3Public } from "../../../services/s3";
import { IResponse, DriverProfileDTO } from "../interface";
import { DriverService } from "../../driver/config/driver.client";
import {
  DriverDocumentDTO,
  OnlineDriverDTO,
} from "../../../types/grpc/driver-grpc-response";
import { recursivelySignImageUrls } from "../../../utils/recursive-image-URL-signing";

class DriverController {
  fetchDriverProfile = async (req: Request, res: Response) => {
    try {
      const id = req.user?.id;

      await DriverService.fetchDriverProfile(
        { id },
        (err: Error | null, response: IResponse<DriverProfileDTO>) => {
          if (err || Number(response.status) !== StatusCode.OK) {
            return res.status(+response?.status || 500).json({
              message: response?.message || "Something went wrong",
              data: response,
              navigate: response?.navigate || "",
            });
          }

          res.status(+response.status).json(response.data);
        }
      );
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

      if (file) imageUrl = await uploadToS3Public(file);

      const { name } = req.body;

      const data = {
        driverId: id,
        ...(name && { name }),
        ...(imageUrl && { imageUrl }),
      };

      await DriverService.updateDriverProfile(
        data,
        (err: Error | null, response: IResponse<null>) => {
          if (err || Number(response.status) !== StatusCode.OK) {
            return res.status(+response?.status || 500).json({
              message: response?.message || "Something went wrong",
              data: response,
              navigate: response?.navigate || "",
            });
          }

          res.status(+response.status).json(response);
        }
      );
    } catch (e: unknown) {
      console.log(e);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };

  fetchDriverDocuments = async (req: Request, res: Response) => {
    try {
      const id = req.user?.id;
      await DriverService.fetchDriverDocuments(
        { id },
        async (err: Error | null, response: IResponse<DriverDocumentDTO>) => {
          console.log(response);

          if (err || Number(response.status) !== StatusCode.Accepted) {
            return res.status(+response?.status || 500).json({
              message: response?.message || "Something went wrong",
              data: response,
              navigate: response?.navigate || "",
            });
          }
          await recursivelySignImageUrls(response.data);
          console.log("Signed response.data", response.data);
          res.status(+response.status).json(response.data);
        }
      );
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
      const update = {
        ...fields,
        ...fileUrls,
      };
      const payload = {
        driverId,
        section,
        updates: JSON.stringify(update),
      };

      await DriverService.updateDriverDocuments(
        payload,
        (err: Error | null, response: IResponse<DriverDocumentDTO>) => {
          console.log("respo", response);

          if (err || Number(response.status) !== StatusCode.OK) {
            return res.status(+response?.status || 500).json({
              message: response?.message || "Something went wrong",
              data: response,
              navigate: response?.navigate || "",
            });
          }

          res.status(+response.status).json(response);
        }
      );
    } catch (e: unknown) {
      console.log(e);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };

  handleOnlineChange = async (req: Request, res: Response) => {
    try {
      const { ...data } = req.body;
      console.log("datadata", data);

      await DriverService.handleOnlineChange(
        data,
        (err: Error | null, response: IResponse<null>) => {
          if (err || Number(response.status) !== StatusCode.OK) {
            return res.status(+response?.status || 500).json({
              message: response?.message || "Something went wrong",
              data: response,
              navigate: response?.navigate || "",
            });
          }

          res.status(+response.status).json(response);
        }
      );

      // res.status(StatusCode.OK).json("response");
    } catch (error) {
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

      await DriverService.getOnlineDriverDetails(
        { id },
        (err: Error | null, response: IResponse<OnlineDriverDTO>) => {
          if (err || Number(response.status) !== StatusCode.OK) {
            return response;
          }

          return response;
        }
      );
    } catch (error) {}
  };

  updateDriverCancelCount = async (id: string) => {
    try {
      await DriverService.updateDriverCancelCount(
        { id },
        (err: Error | null, response: IResponse<null>) => {
          if (err || Number(response.status) !== StatusCode.OK) {
            return response;
          }

          return response;
        }
      );
    } catch (error) {}
  };
}

export const driverController = new DriverController();
