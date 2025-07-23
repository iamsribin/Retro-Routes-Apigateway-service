import express from "express";
import upload from "../../middleware/multer";
import { authController } from "./controllers/authController";
import DriverController from "./controllers/driverController";
import BookingController from "../booking/controller";

const bookingController = new BookingController();

const publicDriverRoute = express.Router();
const protectedDriverRoute = express.Router();
const driverController = new DriverController();

// Public routes
publicDriverRoute.post("/checkLoginDriver", authController.checkLogin);
publicDriverRoute.post(
  "/checkRegisterDriver",
  authController.checkRegisterDriver
);
publicDriverRoute.post("/registerDriver", authController.register);
publicDriverRoute.post(
  "/checkGoogleLoginDriver",
  authController.checkGoogleLoginDriver
);
publicDriverRoute.get("/vehicleModels", bookingController.fetchVehicles);

// Protected routes
publicDriverRoute.post("/location", authController.location);

publicDriverRoute.post(
  "/identification",
  upload.fields([
    { name: "aadharFrontImage", maxCount: 1 },
    { name: "aadharBackImage", maxCount: 1 },
    { name: "licenseFrontImage", maxCount: 1 },
    { name: "licenseBackImage", maxCount: 1 },
  ]),
  authController.identificationUpdate
);

publicDriverRoute.post(
  "/uploadDriverImage",
  upload.single("driverImage"),
  authController.updateDriverImage
);

publicDriverRoute.post(
  "/vehicleDetails",
  upload.fields([
    { name: "rcFrontImage", maxCount: 1 },
    { name: "rcBackImage", maxCount: 1 },
    { name: "carFrontImage", maxCount: 1 },
    { name: "carSideImage", maxCount: 1 },
  ]),
  authController.vehicleUpdate
);

publicDriverRoute.post(
  "/insuranceDetails",
  upload.fields([
    { name: "pollutionImage", maxCount: 1 },
    { name: "insuranceImage", maxCount: 1 },
  ]),
  authController.vehicleInsurancePollutionUpdate
);

publicDriverRoute.get("/resubmission/:id", authController.getResubmissionData);

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
  authController.postResubmissionData
);

protectedDriverRoute.get(
  "/get-driver-profile",
  driverController.fetchDriverProfile
);
// protectedDriverRoute.post(
//   "/updateDriverDetails/:id",
//   upload.fields([
//     { name: "aadharFrontImage", maxCount: 1 },
//     { name: "aadharBackImage", maxCount: 1 },
//     { name: "licenseFrontImage", maxCount: 1 },
//     { name: "licenseBackImage", maxCount: 1 },
//     { name: "rcFrontImage", maxCount: 1 },
//     { name: "rcBackImage", maxCount: 1 },
//     { name: "carFrontImage", maxCount: 1 },
//     { name: "carBackImage", maxCount: 1 },
//     { name: "insuranceImage", maxCount: 1 },
//     { name: "pollutionImage", maxCount: 1 },
//     { name: "driverImage", maxCount: 1 },
//   ]),
//   driverController.updateDriverDetails
// );

protectedDriverRoute.put(
  "/update-driver-profile",
  upload.single("profilePhoto"),
  driverController.updateDriverProfile
);

protectedDriverRoute.get(
  "/getMyTrips",
  bookingController.fetchDriverBookingList
);
protectedDriverRoute.get(
  "/getMyTripDetails/:id",
  bookingController.fetchDriverBookingDetails
);
protectedDriverRoute.post(
  "/uploadChatFile",
  upload.fields([{ name: "file", maxCount: 1 }]),
  driverController.uploadChatFile
);

export { publicDriverRoute, protectedDriverRoute };
