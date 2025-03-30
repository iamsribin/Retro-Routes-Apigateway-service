
export interface Message {
    message: string ;
  }

  export interface AuthResponse {
    message: string;
    name: string;
    refreshToken: string;
    token: string;
    _id: string;
  }

  export interface UserCredentials {
    userId: string;
    role: string;
  }
  export interface Tokens {
    accessToken: string;
    refreshToken: string;
  }

  export interface UserInterface extends Document {
    name: string;
    email: string;
    mobile: number;
    password: string;
    userImage: string;
    referral_code: string;
    account_status: string;
    joiningDate: string;
    wallet: {
        balance: number;
        transactions: {
            date: Date;
            details: string;
            amount: number;
            status: string;
        }[];
    };
    RideDetails: {
        completedRides: number;
        cancelledRides: number;
    };
  }