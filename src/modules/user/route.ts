import express from "express";
import userController from "./controller";
import upload from '../../middleware/multer';

// Create a router instead of an application
const userRoute = express.Router();
const controller = new userController();

userRoute.post('/register',upload.single('userImage'), controller.register);
userRoute.post('/checkUser', controller.checkUser);
userRoute.post('/checkLoginUser',controller.checkLoginUser);

export default userRoute;