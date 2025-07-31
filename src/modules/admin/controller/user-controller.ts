import { Request, Response } from "express";
import { UserService } from "../../user/config/user.client";
import { UserInterface } from "../../../interfaces/interface";
import { StatusCode } from "../../../interfaces/enum";

export default class AdminController {
  getActiveUsers = (req: Request, res: Response) => {
    try {
      UserService.AdminGetActiveUser(
        {},
        (err: any, result: { Users: UserInterface }) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            const users = result.Users || [];                        
            res.status(StatusCode.Created).json(users);
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  getBlockedUsers = (req: Request, res: Response) => {
    try {
      UserService.AdminGetBlockedUsers(
        {},
        (err: any, result: { Users: UserInterface }) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            const users = result.Users || [];
            res.status(StatusCode.Created).json(users);
          }
        }
      );
    } catch (error) {}
  };

  getUserData = (req: Request, res: Response) => {
    try {
      UserService.AdminGetUserData(
        req.query,
        (err: any, result: { User: UserInterface }) => {
          if (err) {
            
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            console.log("result",result);
            res.status(StatusCode.OK).json(result);
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  updateUserStatus = (req: Request, res: Response) => {
    try {
      const { reason, status } = req.body;
      const { id } = req.query;

      const request = {
        reason,
        status,
        id,
      };

      UserService.AdminUpdateUserStatus(
        request,
        (err: any, result: { message: any }) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            res.status(StatusCode.OK).json({ message: "Success", userId: id });
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  };
}
