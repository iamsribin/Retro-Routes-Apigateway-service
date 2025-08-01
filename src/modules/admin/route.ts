import express,{ Application } from "express";
import UserController from "./controller/user-controller";
import DriverController from "./controller/driver-controller";
const adminRoute: Application = express();

const adminDriverController = new DriverController()
const adminUserController = new UserController()

adminRoute.get("/getActiveUserData",adminUserController.getUsersList);
adminRoute.get("/blockedUserData",adminUserController.getUsersList);
adminRoute.get("/userData", adminUserController.getUserData);
adminRoute.patch("/updateUserStatus", adminUserController.updateUserStatus);

adminRoute.get("/verifiedDrivers",adminDriverController.getVerifiedDrivers);
adminRoute.get("/pendingDrivers",adminDriverController.pendingDrivers);
adminRoute.get("/blockedDrivers",adminDriverController.getBlockedDrivers);
adminRoute.get("/driverDetails/:id", adminDriverController.getDriverDetails);
adminRoute.post("/driver/verify/:id", adminDriverController.updateDriverAccountStatus);

export default adminRoute