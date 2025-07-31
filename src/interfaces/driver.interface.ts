
export enum AccountStatus {
  Good = "Good",
  Warning = "Warning",
  Rejected = "Rejected",
  Blocked = "Blocked",
  Pending = "Pending",
  Incomplete = "Incomplete",
}


export interface DriverInterface{
  _id: string;
  name: string;
  email: string;
  mobile: number;
  password: string;
  adminCommission?: number;
  driverImage: string;
  referralCode: string;
  joiningDate: Date;

  aadhar: {
    id: string;
    frontImageUrl: string;
    backImageUrl: string;
  };

  license: {
    id: string;
    frontImageUrl: string;
    backImageUrl: string;
    validity: Date;
  };

  
  vehicleDetails: {
    registrationId: string;
    vehicleNumber: string;
    vehicleColor: string;
    model: string;
    rcFrontImageUrl: string;
    rcBackImageUrl: string;
    carFrontImageUrl: string;
    carBackImageUrl: string;
    rcStartDate: Date;
    rcExpiryDate: Date;
    insuranceImageUrl: string;
    insuranceStartDate: Date;
    insuranceExpiryDate: Date;
    pollutionImageUrl: string;
    pollutionStartDate: Date;
    pollutionExpiryDate: Date;
  };
  
  location: {
    longitude: string;
    latitude: string;
    address: string;
  };
  
  accountStatus: AccountStatus;

  wallet?: {
    balance: number;
    transactions: {
      date: Date;
      details: string;
      amount: number;
      status: "credit" | "debit" | "failed"; 
      rideId: string;
    }[];
  };

  totalCompletedRides?: number;
  totalCancelledRides?: number;

  rideDetails?: {
    completedRides: number;
    cancelledRides: number;
    Earnings: number;
    hour: number;
    date: Date;
  }[];

  isAvailable: boolean;

  totalRatings?: number;

  feedbacks?: {
    feedback: string;
    rideId: string;
    rating: number;
    date: Date;
  }[];

  createdAt: Date;
  updatedAt: Date;
}
