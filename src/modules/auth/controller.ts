import { NextFunction, Request, Response } from "express";
import AsyncHandler from "express-async-handler";
import { AuthClient } from "./config/grpc-client/auth.client";
import { StatusCode } from "../../interfaces/enum";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

interface UserCredentials {
  userId: string;
  role: string;
  message: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  message: string;
}

export const isValidated = (requiredRole: string) =>
  AsyncHandler((req: Request, res: Response, next: NextFunction): void => {
    const token =
      req.cookies?.token || req.headers.authorization?.trim().split(" ")[1];

    if (!token) {
      res.status(StatusCode.Unauthorized).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    AuthClient.IsAuthenticated(
      { token, requiredRole },
      (err: any, result: UserCredentials) => {
        if (err) {
          console.error("gRPC error:", err);
          res.status(StatusCode.Unauthorized).json({
            success: false,
            message: "Authentication error",
          });
          return;
        }

        if (result.message) {
          res.status(
            result.message.includes("Access denied")
              ? StatusCode.Forbidden
              : StatusCode.Unauthorized
          ).json({ success: false, message: result.message });
          return;
        }

        req.user = { id: result.userId, role: result.role };
        next();
      }
    );
  });


  export const refreshToken = AsyncHandler(
    async (req: Request, res: Response) => {
      const token =
        req.cookies?.refreshToken ||
        (req.headers.authorization && req.headers.authorization.trim().split(" ")[1]) ||
        req.body.token;
  
      if (!token) {
        res.status(StatusCode.Unauthorized).json({
          success: false,
          message: "Token is missing",
        });
        return;
      }
  
      await new Promise<void>((resolve) => {
        AuthClient.RefreshToken({ token }, (err: any, result: TokenResponse) => {
          if (err) {
            console.error("gRPC refresh error:", err);
            res.status(StatusCode.NotAcceptable).json({
              success: false,
              message: "Invalid refresh token",
            });
            return resolve(); 
          }
  
          if (result.message) {
            res.status(StatusCode.Unauthorized).json({
              success: false,
              message: result.message,
            });
            return resolve(); 
          }
  
          res.status(StatusCode.Created).json({
            success: true,
            token: result.accessToken,
            refreshToken: result.refreshToken,
            message: "New token generated successfully",
          });
          resolve();
        });
      });
    }
  );
  