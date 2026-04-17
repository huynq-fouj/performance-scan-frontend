export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthData {
  accessToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password?: string;
  remember: boolean;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  fullName: string;
}
