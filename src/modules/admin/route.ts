import express,{ Application } from "express";
import AdminController from "./controller/userController";
const adminRoute: Application = express();

const userController = new AdminController()

adminRoute.get("/getActiveUserData",userController.getActiveUsers);
adminRoute.get("/blockedUserData",userController.getBlockedUsers);

export default adminRoute