import express,{ Application } from "express";
import AdminController from "./controller/userController";
import { isValidated } from "../auth/controller";
import DriverController from "./controller/driverController";
const adminRoute: Application = express();

const adminDriverController = new DriverController()
const adminUserController = new AdminController()

adminRoute.get("/getActiveUserData",isValidated,adminUserController.getActiveUsers);
adminRoute.get("/blockedUserData",isValidated,adminUserController.getBlockedUsers);


adminRoute.get("/verifiedDrivers",adminDriverController.getVerifiedDrivers);
adminRoute.get("/pendingDrivers",adminDriverController.pendingDrivers);
adminRoute.get("/blockedDrivers",adminDriverController.getBlockedDrivers);

export default adminRoute