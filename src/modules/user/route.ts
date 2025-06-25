import express from "express";
import userController from "./controller";
import upload from "../../middleware/multer";
import BookingController from "../booking/controller";
const controller = new userController();
const bookingController = new BookingController();
// Public routes 
const publicUserRoute = express.Router();
publicUserRoute.post("/register", upload.single("userImage"), controller.register);
publicUserRoute.post("/checkUser", controller.checkUser);
publicUserRoute.post("/resendOtp", controller.resendOtp);
publicUserRoute.post("/checkLoginUser", controller.checkLoginUser);
publicUserRoute.post("/checkGoogleLoginUser", controller.checkGoogleLoginUser);
publicUserRoute.get("/vehicles", bookingController.fetchVehicles);
// publicUserRoute.get("/profile/:id",controller.fetchUserProfile);

// publicUserRoute.get("/bookings/:id",bookingController.fetchUserBookingList);

// Protected routes 
const protectedUserRoute = express.Router();
protectedUserRoute.post("/uploadChatFile",upload.fields([{name:"file", maxCount:1}]), controller.uploadChatFile)

// protectedUserRoute.get("/profile", controller.getProfile); 
// protectedUserRoute.post("/booking", controller.createBooking); 

export { publicUserRoute, protectedUserRoute };