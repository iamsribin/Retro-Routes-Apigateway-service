import { Request, Response } from "express";
import { UserService } from "./config/user.client";
import { StatusCode } from "../../interfaces/enum";
import { Message, AuthResponse } from "../../interfaces/interface";
import uploadToS3 from "../../services/s3";

class UserController {
  /**
   * Registers a new user with optional image upload and OTP verification
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const userImage = req.file?.path || "";
      const token = req.cookies.otp;

      const userData = { ...req.body, userImage, token };

      await UserService.Register(
        userData,
        (err: Error | null, result: Message) => {
          if (err) {
            const errorMessage = err.message.includes("UNKNOWN:")
              ? err.message.split("UNKNOWN: ")[1]
              : err.message;

            res.status(StatusCode.BadRequest).json({ message: errorMessage });
            return;
          }
          res.status(StatusCode.Created).json(result);
        }
      );
    } catch (error) {
      res.status(StatusCode.InternalServerError).json({
        message: "Failed to register user",
      });
    }
  }

  /**
   * Checks if user exists and initiates OTP flow if not registered
   */
  async checkUser(req: Request, res: Response): Promise<void> {
    try {
      console.log("=--=-");
      
      await UserService.CheckUser(
        req.body,
        (err: Error | null, result: { token: string; message: string }) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err.message });
            return;
          }

          res.cookie("otp", result.token, {
            httpOnly: true,
            expires: new Date(Date.now() + 180000),
            sameSite: "none",
            secure: true,
          });
          res.status(StatusCode.Created).json(result);
        }
      );
    } catch (error) {
      res.status(StatusCode.InternalServerError).json({
        message: "Failed to check user",
      });
    }
  }

  /**
   * Authenticates user login credentials
   */
  async checkLoginUser(req: Request, res: Response): Promise<void> {
    try {
      console.log("checkLoginUser", req.body);
      
      await UserService.CheckLoginUser(
        req.body,
        (err: Error | null, result: AuthResponse) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err.message });
            return;
          }
          console.log("result==", result);
          res.status(StatusCode.Created).json(result);
        }
      );
    } catch (error) {
      res.status(StatusCode.InternalServerError).json({
        message: "Failed to authenticate user",
      });
    }
  }

  /**
   * Resends OTP for user verification
   */
  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      await UserService.ResendOtp(
        req.body,
        (err: Error | null, result: { token: string; message: string }) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err.message });
            return;
          }

          res.cookie("otp", result.token, {
            httpOnly: true,
            expires: new Date(Date.now() + 180000),
            sameSite: "none",
            secure: true,
          });
          res.status(StatusCode.Created).json(result);
        }
      );
    } catch (error) {
      res.status(StatusCode.InternalServerError).json({
        message: "Failed to resend OTP",
      });
    }
  }

  /**
   * Handles Google login authentication
   */
  async checkGoogleLoginUser(req: Request, res: Response): Promise<void> {
    try {
      await UserService.CheckGoogleLoginUser(
        req.body,
        (err: Error | null, result: AuthResponse) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err.message });
            return;
          }
          res.status(StatusCode.Created).json(result);
        }
      );
    } catch (error) {
      res.status(StatusCode.InternalServerError).json({
        message: "Failed to authenticate Google login",
      });
    }
  }

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

export const userController = new UserController();
