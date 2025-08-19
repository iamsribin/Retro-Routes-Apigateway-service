import compression from "compression";
import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import http from "http";
import { limiter } from "./utils/rate-limiter";
import "dotenv/config";

import { protectedUserRoute, publicUserRoute } from "./modules/user/route";
import  { protectedDriverRoute, publicDriverRoute } from "./modules/driver/route";
import authRoute from "./modules/auth/route"
import adminRoute from "./modules/admin/route"
import { isValidated } from "./modules/auth/controller";
// import { setupSocketIO } from "./modules/socket/socket";
import {isEnvDefined} from "./utils/env-checker";
import { logger, morganMiddleware } from "./middleware/centralized-logging";
import { protectedPaymentRoute } from "./modules/payment/route";

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
    // setupSocketIO(this.server);
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
    // this.app.use(morganMiddleware);
    this.app.use(cookieParser());
    this.app.use(limiter);
  }

  private routes(): void {
    // Public routes 
    this.app.use("/api/user", publicUserRoute);
    this.app.use("/api/driver", publicDriverRoute);
    this.app.use("/api/auth", authRoute);
    // Protected routes 
    this.app.use('/api/user/payments', protectedPaymentRoute); 
    this.app.use("/api/user", isValidated("User"), protectedUserRoute);
    this.app.use("/api/driver", isValidated("Driver"), protectedDriverRoute);
    this.app.use("/api/admin", isValidated("Admin"), adminRoute);
  }

  public startServer(port: number): void {
    this.server.listen(port, () => {
      // console.log(`API-Gateway started on ${port}`);
       logger.info(`api gateway is running on port ${port}`);
    });
  }
}

export default App;
