import { Request, Response, NextFunction } from "express";
import driverRabbitMqClient from "../rabbitmq/client";
import { StatusCode } from "../../../interfaces/enum";
import uploadToS3 from "../../../services/s3";
import {
  Res_checkLogin,
  Res_checkRegisterDriver,
  Res_common,
  Res_getResubmissionDocuments,
} from "../interface";

class DriverAuthController {

  checkLogin = async (req: Request, res: Response) => {
    try {
      const { mobile } = req.body;
      const operation = "login-check";

      const response: Res_checkLogin = (await driverRabbitMqClient.produce(
        mobile,
        operation
      )) as Res_checkLogin;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response,
          navigate: response.navigate || "",
        });
      }
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
      const operation = "google-login";

      const response: Res_checkLogin = (await driverRabbitMqClient.produce(
        email,
        operation
      )) as Res_checkLogin;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response,
          navigate: response.navigate || "",
        });
      }
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
      const operation = "check-register-driver";

      const response: Res_checkRegisterDriver =
        (await driverRabbitMqClient.produce(
          mobile,
          operation
        )) as Res_checkRegisterDriver;

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

      res.status(StatusCode.OK).json({
        status: StatusCode.OK,
        message: "New driver, proceed with OTP verification.",
      });
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
      const operation = "get-resubmission-documents";

      const response = (await driverRabbitMqClient.produce(
        id,
        operation
      )) as Res_getResubmissionDocuments;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response,
          navigate: response.navigate || "",
        });
      }
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

      const operation = "post-resubmission-documents";

      const response = (await driverRabbitMqClient.produce(
        payload,
        operation
      )) as Res_common;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response,
          navigate: response.navigate || "",
        });
      }
    } catch (e: unknown) {
      console.log(e);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };

  register = async (req: Request, res: Response) => {
    try {
      const operation = "driver-register";
      const { name, email, mobile, password, reffered_code } = req.body;

      const userData = {
        name,
        email,
        mobile,
        password,
        referralCode: reffered_code,
      };

      const response: Res_common = (await driverRabbitMqClient.produce(
        userData,
        operation
      )) as Res_common;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response,
          navigate: response.navigate || "",
        });
      }
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

      const operation = "identification-update";
      const response: Res_common = (await driverRabbitMqClient.produce(
        data,
        operation
      )) as Res_common;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response,
          navigate: response.navigate || "",
        });
      }
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
        url = await uploadToS3(files);
      }
      
      const operation = "driver-image-update";
      const request = {
        ...req.query,
        driverImageUrl: url,
      };

      const response: Res_common = (await driverRabbitMqClient.produce(
        request,
        operation
      )) as Res_common;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response,
          navigate: response.navigate || "",
        });
      }
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

      const data = {
        ...req.body,
        ...req.query,
        rcFrondImageUrl,
        rcBackImageUrl,
        carFrondImageUrl,
        carBackImageUrl,
      };

      const operation = "vehicle-image&RC-update";

      const response: Res_common = (await driverRabbitMqClient.produce(
        data,
        operation
      )) as Res_common;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response,
          navigate: response.navigate || "",
        });
      }
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

      const operation = "vehicle-insurance&pollution-update";
      const data = {
        ...req.query,
        ...req.body,
        pollutionImageUrl,
        insuranceImageUrl,
      };

      const response: Res_common = (await driverRabbitMqClient.produce(
        data,
        operation
      )) as Res_common;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response,
          navigate: response.navigate || "",
        });
      }
    } catch (e: unknown) {
      console.log(e);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };

  location = async (req: Request, res: Response) => {
    try {

      const operation = "driver-location";
      const data = { ...req.body, ...req.query };

      const response = (await driverRabbitMqClient.produce(
        data,
        operation
      )) as Res_common;

      if (response.status === StatusCode.OK) {
        res.status(response.status).json(response);
      } else {
        res.status(+response.status).json({
          message: response.message,
          data: response,
          navigate: response.navigate || "",
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

export const authController = new DriverAuthController();
