import compression from "compression";
import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import logger from "morgan";
import cookieParser from "cookie-parser";
import http from "http";
import { limiter } from "./utils/rateLimiter";
import "dotenv/config";

import { protectedUserRoute, publicUserRoute } from "./modules/user/route";
import  { protectedDriverRoute, publicDriverRoute } from "./modules/driver/route";
import authRoute from "./modules/auth/route"
import adminRoute from "./modules/admin/route"
import { isValidated } from "./modules/auth/controller";
import { setupSocketIO } from "./modules/socket/socket";
import {isEnvDefined} from "./utils/envChecker";

class App {        
  public app: Application;
  public server: http.Server<
    typeof http.IncomingMessage,
    typeof http.ServerResponse
  >;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.applyMiddleware();
    this.routes();
    setupSocketIO(this.server);
    isEnvDefined();
  }

  private applyMiddleware(): void {
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
      })
    );
    
    this.app.use(compression());
    this.app.use(helmet());
    this.app.use(logger("dev"));
    this.app.use(cookieParser());
    this.app.use(limiter);
  }

  private routes(): void {
    // Public routes 
    this.app.use("/api/user", publicUserRoute);
    this.app.use("/api/driver", publicDriverRoute);
    this.app.use("/api/auth", authRoute);
    // Protected routes 
    this.app.use('/api/auth',authRoute);
    this.app.use("/api/user", isValidated("User"), protectedUserRoute);
    this.app.use("/api/driver", isValidated("Driver"), protectedDriverRoute);
    this.app.use("/api/admin", isValidated("Admin"), adminRoute);
  }

  public startServer(port: number): void {
    this.server.listen(port, () => {
      console.log(`API-Gateway started on ${port}`);
    });
  }
}

export default App;
