import express,{Application} from 'express'
import upload from '../../middleware/multer'
import driverAuthController from './controllers/authController'

const driverRoute=express.Router()
const AuthController= new driverAuthController()

driverRoute.post("/checkLoginDriver", AuthController.checkLogin);
driverRoute.post("/checkDriver", AuthController.checkDriver);
driverRoute.post("/registerDriver", AuthController.register);
driverRoute.post("/location", AuthController.location);
driverRoute.post("/identification",upload.fields([{ name: "aadharFrontImage", maxCount: 1 },{ name: "aadharBackImage", maxCount: 1 },{ name: "licenseFrontImage", maxCount: 1 },{ name: "licenseBackImage", maxCount: 1 }]),AuthController.identificationUpdate);
driverRoute.post("/uploadDriverImage",upload.single("driverImage"),AuthController.updateDriverImage);
driverRoute.post("/vehicleDetails",upload.fields([{ name: "rcFrontImage", maxCount: 1 },{ name: "rcBackImage", maxCount: 1 },{ name: "carFrontImage", maxCount: 1 },{ name: "carSideImage", maxCount: 1 },]),AuthController.vehicleUpdate);
driverRoute.post("/insuranceDetails",upload.fields([{ name: "pollutionImage", maxCount: 1 },{ name: "insuranceImage", maxCount: 1 }]),AuthController.vehicleInsurancePolutionUpdate);
export default driverRoute