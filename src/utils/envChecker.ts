import { envChecker } from "@codeflare/common"; 

export const isEnvDefined = () => {
    envChecker(process.env.GATEWAY_PORT as string, "GATEWAY_PORT");
    envChecker(process.env.CORS_ORIGIN as string, "CORS_ORIGIN");
    envChecker(process.env.NODE_ENV as string, "NODE_ENV");
    envChecker(process.env.JWT_SECRET as string, "JWT_SECRET");    
    envChecker(process.env.AUTH_GRPC_PORT as string, "AUTH_GRPC_PORT");
    envChecker(process.env.DEV_DOMAIN as string, "DEV_DOMAIN");
    envChecker(process.env.PRO_DOMAIN_USER as string, "PRO_DOMAIN_USER");
    envChecker(process.env.USER_GRPC_PORT as string, "USER_GRPC_PORT");
    envChecker(process.env.AWS_S3_BUCKET as string, "AWS_S3_BUCKET");
    envChecker(process.env.AWS_SECRET_ACCESS_KEY as string, "AWS_SECRET_ACCESS_KEY");
    envChecker(process.env.AWS_ACCESS_KEY_ID as string, "AWS_ACCESS_KEY_ID");
    envChecker(process.env.AWS_S3_REGION as string, "AWS_S3_REGION");    
    envChecker(process.env.REDIS_URL as string, "REDIS_URL");
    envChecker(process.env.CLOUDFRONT_URL as string, "CLOUDFRONT_URL");
    envChecker(process.env.RABBITMQ_URL as string, "RABBITMQ_URL");
};