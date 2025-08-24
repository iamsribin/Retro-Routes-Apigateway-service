
import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import 'dotenv/config';

const packageDef = protoLoader.loadSync(path.resolve(__dirname, '../proto/payment.proto'), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const grpcObject = (grpc.loadPackageDefinition(packageDef) as unknown) as any;

const Domain = process.env.NODE_ENV === 'dev' ? process.env.DEV_DOMAIN : process.env.PRO_DOMAIN_PAYMENT;
const PaymentService = new grpcObject.payment_package.Payment(
  `${Domain}:${process.env.PAYMENT_GRPC_PORT}`,
  grpc.credentials.createInsecure(),
      console.log(`payment server started ${process.env.PAYMENT_GRPC_PORT}`)
);

export { PaymentService };
