import express,{Application} from 'express'
import upload from '../../middleware/multer'
import driverAuthController from './controllers/authController'

const driverRoute=express.Router()
const AuthController= new driverAuthController()

driverRoute.post("/checkLoginDriver", AuthController.checkLogin);
driverRoute.post("/checkDriver", AuthController.checkDriver);
driverRoute.post("/registerDriver", AuthController.register);
driverRoute.post("/location", AuthController.location);
driverRoute.post("/identification",upload.fields([{ name: "aadharImage", maxCount: 1 },{ name: "licenseImage", maxCount: 1 },]),AuthController.identificationUpdate);
driverRoute.post("/vehicleDetails",upload.fields([{ name: "carImage", maxCount: 1 },{ name: "rcImage", maxCount: 1 },]),AuthController.vehicleUpdate);
export default driverRoute