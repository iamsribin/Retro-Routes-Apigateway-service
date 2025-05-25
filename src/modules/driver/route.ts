import express from "express";
import upload from "../../middleware/multer";
import driverAuthController from "./controllers/authController";
import DriverController from "./controllers/driverController";


const publicDriverRoute = express.Router();
const protectedDriverRoute = express.Router();
const AuthController = new driverAuthController();
const driverController = new DriverController()

// Public routes 
publicDriverRoute.post("/checkLoginDriver", AuthController.checkLogin);
publicDriverRoute.post("/checkDriver", AuthController.checkDriver);
publicDriverRoute.post("/registerDriver", AuthController.register);
publicDriverRoute.post("/checkGoogleLoginDriver", AuthController.checkGoogleLoginDriver);

// Protected routes 
publicDriverRoute.post("/location", AuthController.location);

publicDriverRoute.post(
  "/identification",
  upload.fields([
    { name: "aadharFrontImage", maxCount: 1 },
    { name: "aadharBackImage", maxCount: 1 },
    { name: "licenseFrontImage", maxCount: 1 },
    { name: "licenseBackImage", maxCount: 1 },
  ]),
  AuthController.identificationUpdate
);

publicDriverRoute.post(
  "/uploadDriverImage",
  upload.single("driverImage"),
  AuthController.updateDriverImage
);

publicDriverRoute.post(
  "/vehicleDetails",
  upload.fields([
    { name: "rcFrontImage", maxCount: 1 },
    { name: "rcBackImage", maxCount: 1 },
    { name: "carFrontImage", maxCount: 1 },
    { name: "carSideImage", maxCount: 1 },
  ]),
  AuthController.vehicleUpdate
);

publicDriverRoute.post(
  "/insuranceDetails",
  upload.fields([
    { name: "pollutionImage", maxCount: 1 },
    { name: "insuranceImage", maxCount: 1 },
  ]),
  AuthController.vehicleInsurancePolutionUpdate
);

publicDriverRoute.get("/resubmission/:id", AuthController.getResubmissionData);

publicDriverRoute.post(
  "/resubmission",
  upload.fields([
    { name: "aadharFrontImage", maxCount: 1 },
    { name: "aadharBackImage", maxCount: 1 },
    { name: "licenseFrontImage", maxCount: 1 },
    { name: "licenseBackImage", maxCount: 1 },
    { name: "rcFrontImage", maxCount: 1 },
    { name: "rcBackImage", maxCount: 1 },
    { name: "carFrontImage", maxCount: 1 },
    { name: "carBackImage", maxCount: 1 },
    { name: "insuranceImage", maxCount: 1 },
    { name: "pollutionImage", maxCount: 1 },
    { name: "driverImage", maxCount: 1 },
  ]),
  AuthController.postResubmissionData
);

publicDriverRoute.get("/getDriverDetails/:id",driverController.fetchDriverDetails)

export { publicDriverRoute, protectedDriverRoute };