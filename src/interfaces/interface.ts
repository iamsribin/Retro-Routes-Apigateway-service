import { Socket } from "socket.io";
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

  export interface IWalletTransaction {
  id: string
  date: Date
  details: string
  amount: number
  status: string
  userId: string 
}

export interface IRideDetails {
  id: string
  completedRides: number
  cancelledRides: number
}

  export interface UserInterface extends Document {
  id: string
  name: string
  email: string
  mobile: number
  password: string
  userImage?: string
  referral_code?: string
  joiningDate: Date
  account_status: 'Good' | 'Block'
  reason?: string
  isAdmin: boolean
  wallet_balance: number
  transactions: IWalletTransaction[]
  rideDetails: IRideDetails
  }

  interface DecodedToken {
    clientId: string,
    role:string
    
    }

  export interface AuthenticatedSocket extends Socket {
    decoded?: DecodedToken;
    }