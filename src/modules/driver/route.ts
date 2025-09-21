import express from "express";
import upload from "../../middleware/multer";
import { authController } from "./controllers/auth-controller";
import {bookingController} from "../booking/controller";
import { driverController } from "./controllers/driver-controller";


const publicDriverRoute = express.Router();
const protectedDriverRoute = express.Router();

/* ===================== PUBLIC DRIVER ROUTES ===================== */

// ---------- GET ----------
publicDriverRoute.get("/vehicleModels", bookingController.fetchVehicles);
publicDriverRoute.get("/resubmission/:id", authController.getResubmissionData);
// ---------- POST ---------- 
publicDriverRoute.post("/checkLoginDriver", authController.checkLogin);
publicDriverRoute.post("/checkRegisterDriver", authController.checkRegisterDriver);
publicDriverRoute.post("/registerDriver", authController.register);
publicDriverRoute.post("/checkGoogleLoginDriver", authController.checkGoogleLoginDriver);
publicDriverRoute.post("/location", authController.location);
publicDriverRoute.post("/handle-online-change", driverController.handleOnlineChange);

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


/* ===================== PROTECTED DRIVER ROUTES ===================== */

// ---------- GET ----------
protectedDriverRoute.get("/get-driver-profile", driverController.fetchDriverProfile);
protectedDriverRoute.get("/get-my-documents", driverController.fetchDriverDocuments);
protectedDriverRoute.get("/getMyTrips/:role", bookingController.fetchDriverBookingList);
protectedDriverRoute.get("/getMyTripDetails/:id", bookingController.fetchDriverBookingDetails);

// // ---------- PUT ----------
protectedDriverRoute.put(
  "/update-driver-profile",
  upload.single("profilePhoto"),
  driverController.updateDriverProfile
);

protectedDriverRoute.put(
  "/update-driver-documents",
  upload.any(),
  driverController.updateDriverDocuments
);

// // ---------- POST ----------
protectedDriverRoute.post(
  "/uploadChatFile",
  upload.fields([{ name: "file", maxCount: 1 }]),
  driverController.uploadChatFile
);

protectedDriverRoute.post("/check-security-pin",bookingController.checkSecurityPin)
protectedDriverRoute.patch("/ride-completed",bookingController.rideCompleted)
 
export { publicDriverRoute, protectedDriverRoute };
