import express from "express";
import {userController} from "./controller";
import upload from "../../middleware/multer";
// import {bookingController} from "../booking/controller";

// Public routes 
const publicUserRoute = express.Router();
publicUserRoute.post("/register", upload.single("userImage"), userController.register);
publicUserRoute.post("/checkUser", userController.checkUser);
publicUserRoute.post("/resendOtp", userController.resendOtp);
publicUserRoute.post("/checkLoginUser", userController.checkLoginUser);
publicUserRoute.post("/checkGoogleLoginUser", userController.checkGoogleLoginUser);
// publicUserRoute.get("/vehicles", bookingController.fetchVehicles);
// publicUserRoute.get("/profile/:id",userController.fetchUserProfile);

// publicUserRoute.get("/bookings/:id",bookinguserController.fetchUserBookingList);

// Protected routes 
const protectedUserRoute = express.Router();
protectedUserRoute.post("/uploadChatFile",upload.fields([{name:"file", maxCount:1}]), userController.uploadChatFile)
protectedUserRoute.get("/sample",(req,res)=>{
console.log("ethi");
res.json({heelo:"ksdj"})
})

// protectedUserRoute.get("/profile", userController.getProfile); 
// protectedUserRoute.post("/booking", userController.createBooking); 

export { publicUserRoute, protectedUserRoute };