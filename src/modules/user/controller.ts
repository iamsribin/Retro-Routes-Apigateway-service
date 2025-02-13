import { Response, Request } from "express";
import { UserService } from "./config/user.client";
import { StatusCode } from "../../interfaces/enum";
import uploadToS3 from "../../services/s3";
import { Message } from "../../interfaces/interface";

export default class userController {
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const files: Express.Multer.File | undefined = req.file;
      let userImage = "";
      if (files) {
        userImage = await uploadToS3(files);
      }
      const token = req.cookies.otp;
      UserService.Register(
        { ...req.body, userImage, token },
        (err: any, result: Message) => {
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
