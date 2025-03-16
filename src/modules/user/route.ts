import express from "express";
import userController from "./controller";
import upload from '../../middleware/multer';

const userRoute = express.Router();
const controller = new userController();

userRoute.post('/register',upload.single('userImage'), controller.register);
userRoute.post('/checkUser', controller.checkUser);

userRoute.post('/checkLoginUser',controller.checkLoginUser);

userRoute.post('/checkGoogleLoginUser',controller.checkGoogleLoginUser);

export default userRoute;