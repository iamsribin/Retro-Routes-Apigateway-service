import compression from "compression";
import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import logger from "morgan";
import cookieParser from "cookie-parser";
import http from "http";
import { limiter } from "./utils/rateLimitter";
import "dotenv/config";

import userRoute from "./modules/user/route";

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

  private routes():void{
  this.app.use("/api/user",userRoute)
  }

  public startServer(port: number):void {
    this.server.listen(port, () => {
      console.log(`API-Gateway started on ${port}`);
    });
  }
}

export default App;
