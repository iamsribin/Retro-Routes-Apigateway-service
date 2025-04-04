import { Request, Response } from "express";
import { UserService } from "../../user/config/user.client";
import { Message, UserInterface } from "../../../interfaces/interface";
import { StatusCode } from "../../../interfaces/enum";

export default class AdminController {
  getActiveUsers = (req: Request, res: Response) => {
    try {
      UserService.AdiminGetActiveUser(
        {},
        (err: any, result: { User: UserInterface }) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            console.log("result:::", result);
            res.status(StatusCode.Created).json(result.User);
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
          console.log("blocked result", result);

          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            res.status(StatusCode.OK).json(result.Users);
          }
        }
      );
    } catch (error) {}
  };

  getUserData = (req: Request, res: Response) => {
    try {
      console.log("id", req.query);

      UserService.AdminGetUserData(
        req.query,
        (err: any, result: { User: UserInterface }) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            console.log("response===", result);

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
      console.log(request);

      UserService.AdminUpdateUserStatus(
        request,
        (err: any, result: { message: any }) => {
          if (err) {
            console.log("error===", err);
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            console.log(result);
            res.status(StatusCode.OK).json({ message: "Success" });
          }
        }
      );
    } catch (error) {
      console.log(error);
    }
  };
}
