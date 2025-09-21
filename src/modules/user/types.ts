export interface WalletTransactionDto {
  date: Date;
  details: string;
  amount: number;
  status: string;
}

export interface WalletDto {
  balance: number;
  transactions: number;
}

export interface RideDetailsDto {
  completedRides: number;
  cancelledRides: number;
}

export interface UserProfileDto {
  id: string;
  name: string;
  email: string;
  mobile: string;
  userImage: string | null;
  referralCode: string | null;
  joiningDate: Date;
  accountStatus: "Good" | "Block";
  wallet: WalletDto;
  rideDetails: RideDetailsDto;
}
