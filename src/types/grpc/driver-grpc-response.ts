import { Aadhar, Insurance, License, Pollution, VehicleDetails, VehicleRC } from "../../interfaces/document.interface";
import { DriverInterface } from "../../interfaces/driver.interface";

export interface DriverDocumentDTO {
  _id: string;
  aadhar: Aadhar;
  license: License;
  vehicleRC: VehicleRC;
  vehicleDetails: VehicleDetails;
  insurance: Insurance;
  pollution: Pollution;
}

export interface OnlineDriverDTO {
  driverName: string;
  driverId: string;
  cancelledRides: number;
  vehicleModel: string;
  color: string;
  rating: number;
  vehicleNumber: string;
  driverImage: string;
  mobile: number;
}
export interface DriverListDTO {
  id: string;
  name: string;
  email: string;
  mobile: number;
  joiningDate: string;
  accountStatus:
    | "Good"
    | "Warning"
    | "Rejected"
    | "Blocked"
    | "Pending"
    | "Incomplete";
  vehicle: string;
  driverImage: string;
}

export interface PaginatedUserListDTO{
  drivers:DriverListDTO[],
  pagination: Pagination
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AdminDriverDetailsDTO {
  data:
    | (Omit<DriverInterface, "password" | "referralCode" | "_id"> & {
        _id: string;
      })
    | null;
}