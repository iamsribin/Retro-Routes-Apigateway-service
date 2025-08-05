import { Request, Response, NextFunction } from "express";
import AsyncHandler from "express-async-handler";
import { TokenService } from "../../services/token-service";
import { StatusCode } from "../../types/common/enum";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

// Middleware: isValidated
export const isValidated = (requiredRole: string) =>
  AsyncHandler((req: Request, res: Response, next: NextFunction): void => {
    try {
      const token =
        req.cookies?.token || req.headers.authorization?.split(" ")[1];

      if (!token) {
        res.status(StatusCode.Unauthorized).json({
          success: false,
          message: "No token provided",
        });
        return;
      }

      const decoded = TokenService.verifyAccessToken(token);

      if (decoded.role !== requiredRole) {
        res.status(StatusCode.Forbidden).json({
          success: false,
          message: `Access denied: ${requiredRole} role required`,
        });
        return;
      }

      req.user = { id: decoded.clientId, role: decoded.role };
      next();
    } catch (err) {
      res.status(StatusCode.Unauthorized).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  });

// Controller: refreshToken
export const refreshToken = AsyncHandler(async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies?.refreshToken ||
      req.headers.authorization?.split(" ")[1] ||
      req.body.token;

    if (!token) {
      res.status(StatusCode.Unauthorized).json({
        success: false,
        message: "Refresh token missing",
      });
      return;
    }

    const decoded = TokenService.verifyRefreshToken(token);

    const { accessToken, refreshToken } = TokenService.generateTokens(
      decoded.clientId,
      decoded.role
    );

    res.status(StatusCode.Created).json({
      success: true,
      token: accessToken,
      refreshToken,
      message: "Token refreshed successfully",
    });
  } catch (err) {
    res.status(StatusCode.NotAcceptable).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
});
