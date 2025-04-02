import express,{ Application } from "express";
import UserController from "./controller/userController";
import { isValidated } from "../auth/controller";
import DriverController from "./controller/driverController";
const adminRoute: Application = express();

const adminDriverController = new DriverController()
const adminUserController = new UserController()

adminRoute.get("/getActiveUserData",isValidated,adminUserController.getActiveUsers);
adminRoute.get("/blockedUserData",isValidated,adminUserController.getBlockedUsers);
adminRoute.get("/userData",isValidated, adminUserController.getUserData);

adminRoute.get("/verifiedDrivers",isValidated,adminDriverController.getVerifiedDrivers);
adminRoute.get("/pendingDrivers",isValidated,adminDriverController.pendingDrivers);
adminRoute.get("/blockedDrivers",isValidated,adminDriverController.getBlockedDrivers);


adminRoute.patch("")
export default adminRoute