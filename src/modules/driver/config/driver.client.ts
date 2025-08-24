import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import "dotenv/config";

const packageDef = protoLoader.loadSync(
  path.resolve(__dirname, "./driver.proto")
);
const grpcObject = grpc.loadPackageDefinition(packageDef) as unknown as any;

const Domain =
  process.env.NODE_ENV === "dev"
    ? process.env.DEV_DOMAIN
    : process.env.PRO_DOMAIN_USER;  

const DriverService = new grpcObject.driver_package.Driver(
  `${Domain}:${process.env.DRIVER_GRPC_PORT}`,
  grpc.credentials.createInsecure(),
  console.log(`driver server started ${process.env.DRIVER_GRPC_PORT}`)
);

export { DriverService };
