import express from "express";
import {userController} from "./controller";
import upload from "../../middleware/multer";
import {bookingController} from "../booking/controller";
import PaymentController from '../payment/controller';

const paymentController = new PaymentController();
// Public routes 
const publicUserRoute = express.Router();
publicUserRoute.post("/register", upload.single("userImage"), userController.register);
publicUserRoute.post("/checkUser", userController.checkUser);
publicUserRoute.post("/resendOtp", userController.resendOtp);
publicUserRoute.post("/checkLoginUser", userController.checkLoginUser);
publicUserRoute.post("/checkGoogleLoginUser", userController.checkGoogleLoginUser);
publicUserRoute.get("/vehicleModels", bookingController.fetchVehicles);

// Protected routes   
const protectedUserRoute = express.Router();
protectedUserRoute.post("/uploadChatFile",upload.fields([{name:"file", maxCount:1}]), userController.uploadChatFile)
protectedUserRoute.post("/book-my-cab", bookingController.bookCab);
protectedUserRoute.patch("/cancel-ride", bookingController.cancelRide);
protectedUserRoute.get("/get-my-profile", userController.fetchUserProfile)
protectedUserRoute.get("/getMyTrips/:role", bookingController.fetchDriverBookingList)
protectedUserRoute.get("/getMyTripDetails/:id", bookingController.fetchDriverBookingDetails);
protectedUserRoute.get("/payments/cash-payment", paymentController.conformCashPayment);

// protectedUserRoute.get("/profile", userController.getProfile); 
// protectedUserRoute.post("/booking", userController.createBooking); 

export { publicUserRoute, protectedUserRoute };