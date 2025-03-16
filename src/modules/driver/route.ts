import express,{Application} from 'express'
import upload from '../../middleware/multer'
import driverAuthController from './controllers/authController'

const driverRoute=express.Router()
const AuthController= new driverAuthController()

driverRoute.post("/checkLoginDriver", AuthController.checkLogin);
driverRoute.post("/checkDriver", AuthController.checkDriver);
export default driverRoute