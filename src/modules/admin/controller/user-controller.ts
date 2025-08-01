import { Request, Response } from "express";
import { UserService } from "../../user/config/user.client";
import { UserInterface } from "../../../interfaces/interface";
import { StatusCode } from "../../../interfaces/enum";

export default class AdminController {
  getUsersList = (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, search = "", status } = req.query;

      // Optional: Convert page and limit to numbers
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const searchTerm = search as string;
      UserService.AdminGetUsersList(
        { page: pageNumber, limit: limitNumber, search: searchTerm, status },
        (err: any, result: any) => {
          if (err) {
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            console.log("result result", result);

            const users = result.Users || [];
            const { Users, pagination } = result;
            console.log("9090",{ Users, pagination });
            
            res.status(StatusCode.Created).json({ users: Users || [], pagination });
            // res.status(StatusCode.Created).json(users);
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
            console.log("result", result);
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
