import { Request, Response } from "express";
import { UserService } from "../../user/config/user.client";
import { Message, UserInterface } from '../../../interfaces/interface';
import { StatusCode } from "../../../interfaces/enum";

export default class AdminController {
  getActiveUsers = (req: Request, res: Response) => {
    try {

        UserService.AdiminGetActiveUser({},(err:any,result:{User:UserInterface})=>{
            if (err) {
                res.status(StatusCode.BadRequest).json({message:err})
            }else{
                console.log("result:::",result);
                res.status(StatusCode.Created).json(result.User)
            }
        })
    } catch (error) {
      console.log(error);
    }
  };

  getBlockedUsers = (req:Request, res:Response)=>{
    try {
        UserService.AdminGetBlockedUsers({},(err:any,result:{Users:UserInterface})=>{
            console.log("blocked result",result);
            
   if(err){
    res.status(StatusCode.BadRequest).json({message:err});
   }else{
    res.status(StatusCode.OK).json(result.Users);
    }
        })
    } catch (error) {
        
    }
  }
}
