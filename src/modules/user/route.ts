import express from "express";
import userController from "./controller";
import upload from "../../middleware/multer";

const controller = new userController();

// Public routes 
const publicUserRoute = express.Router();
publicUserRoute.post("/register", upload.single("userImage"), controller.register);
publicUserRoute.post("/checkUser", controller.checkUser);
publicUserRoute.post("/resendOtp", controller.resendOtp);
publicUserRoute.post("/checkLoginUser", controller.checkLoginUser);
publicUserRoute.post("/checkGoogleLoginUser", controller.checkGoogleLoginUser);

// Protected routes 
const protectedUserRoute = express.Router();
// protectedUserRoute.get("/profile", controller.getProfile); 
// protectedUserRoute.post("/booking", controller.createBooking); 

export { publicUserRoute, protectedUserRoute };