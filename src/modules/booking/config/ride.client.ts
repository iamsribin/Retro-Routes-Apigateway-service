import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import "dotenv/config";

const packageDef = protoLoader.loadSync(
  path.resolve(__dirname, "./ride.proto")
);
const grpcObject = grpc.loadPackageDefinition(packageDef) as unknown as any;

const Domain =
  process.env.NODE_ENV === "dev"
    ? process.env.DEV_DOMAIN
    : process.env.PRO_DOMAIN_USER;

const RideService = new grpcObject.ride_package.Ride(
  `${Domain}:${process.env.RIDE_GRPC_PORT}`,
  grpc.credentials.createInsecure(),
  console.log(`ride server started ${process.env.RIDE_GRPC_PORT}`)
);

export { RideService };
