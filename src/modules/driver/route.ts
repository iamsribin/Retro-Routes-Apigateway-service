import express,{Application} from 'express'
import upload from '../../middleware/multer'
import driverAuthController from './controllers/authController'

const driverRoute=express.Router()
const AuthController= new driverAuthController()

driverRoute.post("/checkLoginDriver", AuthController.checkLogin);
driverRoute.post("/checkDriver", AuthController.checkDriver);
driverRoute.post("/registerDriver", AuthController.register);

export default driverRoute