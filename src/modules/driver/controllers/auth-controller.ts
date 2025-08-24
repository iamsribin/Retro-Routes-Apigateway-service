import { Request, Response, NextFunction } from "express";
import uploadToS3, { uploadToS3Public } from "../../../services/s3";
import { DriverService } from "../../driver/config/driver.client";
import { commonRes } from "../../../types/common/common-response";
import {
  CheckLoginUserRes,
  CheckRegisterDriverRes,
  getResubmissionDocumentsRes,
  StatusCode,
} from "retro-roues-common";

class DriverAuthController {

  checkLogin = async (req: Request, res: Response) => {
    try {

      const { mobile } = req.body;
      await DriverService.CheckLoginDriver(
        { mobile },
        (err: Error | null, response: CheckLoginUserRes) => {
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

  checkGoogleLoginDriver = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      await DriverService.CheckGoogleLoginDriver(
        { email },
        (err: Error | null, response: CheckLoginUserRes) => {
          if (err || response.status !== StatusCode.OK) {
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

  checkRegisterDriver = async (req: Request, res: Response): Promise<void> => {
    try {
      const { mobile } = req.body;

      await DriverService.checkRegisterDriver(
        { mobile },
        (err: Error | null, response: CheckRegisterDriverRes) => {
          console.log("response",response);
          
          if (
            err ||
            (response.status !== StatusCode.OK &&
              response.status !== StatusCode.Accepted)
          ) {
            return res.status(+response?.status || 500).json({
              message: response?.message || "Something went wrong",
              data: response,
            });
          }

          if (response.isFullyRegistered) {
            res.status(StatusCode.OK).json({
              status: StatusCode.OK,
              message: "Driver already registered. Please login.",
              isFullyRegistered: true,
            });
            return;
          }

          if (response.nextStep && response.driverId) {
            res.status(StatusCode.Accepted).json({
              status: StatusCode.Accepted,
              message: `Driver Already registered! Please submit your ${response.nextStep}`,
              nextStep: response.nextStep,
              driverId: response.driverId,
            });
            return;
          }
          res.status(StatusCode.OK).json({status: StatusCode.OK});
        }

      );
    } catch (e) {
      console.error(e);
      res.status(StatusCode.InternalServerError).json({
        status: StatusCode.InternalServerError,
        message: "Internal Server Error",
      });
    }
  };

  getResubmissionData = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await DriverService.getResubmissionDocuments(
        { id },
        (err: Error | null, response: getResubmissionDocumentsRes) => {
          if (err || response.status !== StatusCode.OK) {
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

      await DriverService.postResubmissionDocuments(
        payload,
        (err: Error | null, response: commonRes) => {
          if (err || response.status !== StatusCode.OK) {
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

  register = async (req: Request, res: Response) => {
    try {
      const { name, email, mobile, password, reffered_code } = req.body;

      const userData = {
        name,
        email,
        mobile,
        password,
        referralCode: reffered_code,
      };

      await DriverService.Register(
        userData,
        (err: Error | null, response: commonRes) => {
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

  identificationUpdate = async (req: Request, res: Response) => {
    try {
      const files: any = req.files;
      let aadharFrontImage = "sample";
      let aadharBackImage = "sample";
      let licenseFrontImage = "sample";
      let licenseBackImage = "sample";

      if (files) {
        [
          aadharFrontImage,
          aadharBackImage,
          licenseFrontImage,
          licenseBackImage,
        ] = await Promise.all([
          uploadToS3(files["aadharFrontImage"][0]),
          uploadToS3(files["aadharBackImage"][0]),
          uploadToS3(files["licenseFrontImage"][0]),
          uploadToS3(files["licenseBackImage"][0]),
        ]);
      }

      const data = {
        ...req.body,
        ...req.query,
        aadharFrontImage,
        aadharBackImage,
        licenseFrontImage,
        licenseBackImage,
      };
 
      await DriverService.identificationUpdate(
        data,
        (err: Error | null, response: commonRes) => {
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

  updateDriverImage = async (req: Request, res: Response) => {
    try {
      const files: Express.Multer.File | undefined = req.file;
      let url = "sample";

      if (files) {
        url = await uploadToS3Public(files);
      }

      const request = {
        ...req.query,
        driverImageUrl: url,
      };
      
      await DriverService.updateDriverImage(
        request,
        (err: Error | null, response: commonRes) => {
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

  vehicleUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files: any = req.files;
      let rcFrondImageUrl = "";
      let rcBackImageUrl = "";
      let carFrondImageUrl = "";
      let carBackImageUrl = "";

      if (files) {
        [rcFrondImageUrl, rcBackImageUrl, carFrondImageUrl, carBackImageUrl] =
          await Promise.all([
            uploadToS3(files["rcFrontImage"][0]),
            uploadToS3(files["rcBackImage"][0]),
            uploadToS3(files["carFrontImage"][0]),
            uploadToS3(files["carSideImage"][0]),
          ]);
      }

      const request = {
        ...req.body,
        ...req.query,
        rcFrondImageUrl,
        rcBackImageUrl,
        carFrondImageUrl,
        carBackImageUrl,
      };

      await DriverService.vehicleUpdate(
        request,
        (err: Error | null, response: commonRes) => {
          
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

  vehicleInsurancePollutionUpdate = async (req: Request, res: Response) => {
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

      const request = {
        ...req.query,
        ...req.body,
        pollutionImageUrl,
        insuranceImageUrl,
      };

      await DriverService.vehicleInsurancePollutionUpdate(
        request,
        (err: Error | null, response: commonRes) => {
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

  location = async (req: Request, res: Response) => {
    try {
      const request = { ...req.body, ...req.query };

      await DriverService.locationUpdate(
        request,
        (err: Error | null, response: commonRes) => {
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
}

export const authController = new DriverAuthController();
