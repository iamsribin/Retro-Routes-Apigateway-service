import express, { Application } from "express";
import userController from "./controller";
import upload from '../../middleware/multer'

const userRoute: Application = express(); 
const controller = new userController();

userRoute.post('/register',upload.single('userImage'),controller.register)

export default userRoute;