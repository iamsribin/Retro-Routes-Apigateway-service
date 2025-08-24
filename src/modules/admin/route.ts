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

adminRoute.get("/get-drivers-list",adminDriverController.getDriversList);
adminRoute.get("/driverDetails/:id", adminDriverController.getDriverDetails);
adminRoute.post("/driver/verify/:id", adminDriverController.updateDriverAccountStatus);

export default adminRoute