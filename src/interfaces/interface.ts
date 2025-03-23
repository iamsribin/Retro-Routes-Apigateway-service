
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