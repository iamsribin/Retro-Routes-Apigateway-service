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
adminRoute.patch("/updateUserStatus", adminUserController.updateUserStatus);

adminRoute.get("/verifiedDrivers",isValidated,adminDriverController.getVerifiedDrivers);
adminRoute.get("/pendingDrivers",isValidated,adminDriverController.pendingDrivers);
adminRoute.get("/blockedDrivers",isValidated,adminDriverController.getBlockedDrivers);
adminRoute.get("/driverDetails/:id", isValidated, adminDriverController.getDriverDetails);
// adminRoute.get("/driverDetails/:id", adminDriverController.)
adminRoute.post("/driver/verify/:id", isValidated, adminDriverController.updateDriverAccountStatus);

export default adminRoute