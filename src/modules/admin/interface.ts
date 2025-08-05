import { DriverInterface } from "../../interfaces/driver.interface";
import { StatusCode } from "../../types/common/enum";

export interface Res_getDriversListByAccountStatus {
  status: StatusCode;
  message?:string;
  data: {
    _id: string;
    name: string;
    email: string;
    mobile: number;
    joiningDate: string;
    accountStatus: "Good" | "Warning" | "Rejected" | "Blocked" | "Pending" | "Incomplete";
    vehicle: string;
    driverImage:string;
  }[];
}

export interface Res_AdminGetDriverDetailsById {
  status: StatusCode;
  message?: string;
  data: (Omit<DriverInterface, 'password' | 'referralCode' | '_id'> & { _id: string }) | null;
}


export interface Res_adminUpdateDriverStatus {
  status: StatusCode;
  message?: string;
  data: boolean
}