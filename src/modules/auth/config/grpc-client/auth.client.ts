import path from "path"
import 'dotenv/config';
import * as grpc from "@grpc/grpc-js"
import * as protoLoader from "@grpc/proto-loader" 




const packageDef = protoLoader.loadSync(path.resolve(__dirname, '../proto/auth.proto'))
const grpcObject = (grpc.loadPackageDefinition(packageDef) as unknown) as any

const Domain=process.env.NODE_ENV==='dev'?process.env.DEV_DOMAIN:process.env.PRO_DOMAIN_AUTH
console.log(Domain,"=-=-=");

const AuthClient = new grpcObject.authpackage.Auth(
    `${Domain}:${process.env.AUTH_GRPC_PORT}`, grpc.credentials.createInsecure(),
    console.log("auth server started")
    
)

export{AuthClient}