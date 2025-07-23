import { StatusCode } from "../../interfaces/enum";
import { ResubmissionInterface } from "../../interfaces/resubmission.interface";

export interface Res_checkLogin{
    status: StatusCode,
    message: string,
    navigate?:string,
    name?: string,
    refreshToken?:string,
    token?:string,
    driverId?:string,
}

export interface Res_getResubmissionDocuments{
  status:StatusCode,
  message:string,
  navigate?:string,
  data?:ResubmissionInterface
}
export interface Res_common{
  status:StatusCode,
  message:string,
  id?:string,
  navigate?:string,
}

export interface Res_checkRegisterDriver{
  status: StatusCode;
  message: string;
  isFullyRegistered?: boolean;
  driverId?: string;
  nextStep?: 'documents' | 'driverImage' | 'location' | 'insurance' | 'vehicle' | null;
}


export interface DriverProfileDTO {
  name: string;
  email: string;
  mobile: string;
  driverImage?: string;
  address?: string;
  totalRatings: number;
  joiningDate: string;
  completedRides: number;
  cancelledRides: number;
  walletBalance?: number;
  adminCommission: number;
}

export interface IResponse<T> {
  status: StatusCode;
  message: string;
  navigate?:string;
  data: T | null;
}