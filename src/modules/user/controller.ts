import { Response, Request } from "express";
import { UserService } from "./config/user.client";
import { StatusCode } from "../../interfaces/enum";
import { Message, AuthResponse } from "../../interfaces/interface";

export default class userController {
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const files: Express.Multer.File | undefined = req.file;
      let userImage = "";
      if (files) {

      }
      const token = req.cookies.otp;

      UserService.Register(
        { ...req.body, userImage, token },
        (err: any, result: Message) => {
          if (err) {
            console.log(err);
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            res.status(StatusCode.Created).json(result);
          }
        }
      );
    } catch (error) {
      console.log(error);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };
  checkUser = async (req: Request, res: Response) => {
    try {
      console.log("error",req.body);
      
      UserService.CheckUser(
        req.body,
        (err: any, result: { token: string; message: string }) => {
          if (err) {
            console.log(err);
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            console.log(" CheckUser result==", result);
            res.cookie("otp", result.token, {
              httpOnly: true,
              expires: new Date(Date.now() + 180000),
              sameSite: "none",
              secure: true,
            });
            res.status(StatusCode.Created).json(result);
          }
        }
      );
    } catch (error) {
      console.log("error=====",error);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };

  checkLoginUser = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("body",req.body);
      UserService.CheckLoginUser(req.body,(err: any, result: AuthResponse) => {
        if (err) {          
          res.status(StatusCode.BadRequest).json({ message: err });
        } else {
          console.log("result", result);
          res.status(StatusCode.Created).json(result);
        }
      })
    }catch(error){
      console.log(error);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };

  resendOtp= (req:Request,res:Response)=>{
    try {
        console.log(req.body);
        UserService.ResendOtp(req.body,(err:any,result:{token:string,message:string})=>{
            if(err){
                res.status(StatusCode.BadRequest).json({message:err})
            }else{
                console.log("result ",result);
                res.cookie("otp", result.token, {
                    httpOnly: true,
                    expires: new Date(Date.now() + 180000),
                    sameSite: "none",
                    secure: true,
                    });
                res.status(StatusCode.Created).json(result)
            }
        })
        
    } catch (error) {
        console.log(error);
         res.status(StatusCode.InternalServerError).json({ message: 'Internal Server Error' });
    }
}


  checkGoogleLoginUser = (req: Request, res: Response) => {
    try {
      console.log("checkGoogleLoginUser",req.body);
      UserService.CheckGoogleLoginUser(
        req.body,
        (err: any, result: AuthResponse) => {
          if (err) {
            console.log(err);
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            console.log("result ", result);
            res.status(StatusCode.Created).json(result);
          }
        } 
      );
    } catch (error) {
      console.log(error);
         res
        .status(StatusCode.InternalServerError)
        .json({ message: "Internal Server Error" });
    }
  };
}
