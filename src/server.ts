import App from "./app";
import 'dotenv/config';

const port=Number(process.env.GATEWAY_PORT)

const app=new App()

app.startServer(port)