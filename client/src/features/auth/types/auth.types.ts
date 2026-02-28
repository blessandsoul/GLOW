export type UserRole = 'USER' | 'MASTER' | 'ADMIN' | 'SALON';

export interface IUser {
    id: string;
    firstName: string;
    lastName: string;
    username: string | null;
    email: string;
    phone: string | null;
    role: UserRole;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    avatar?: string;
    credits: number;
    createdAt: string;
    updatedAt: string;
}

export interface ILoginRequest {
    email: string;
    password: string;
}

export interface IRegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    referralCode?: string;
}

export interface IRegisterResponse {
    user: IUser;
    otpRequestId: string;
}

export interface IVerifyPhoneRequest {
    requestId: string;
    code: string;
}

export interface IResendOtpResponse {
    requestId: string;
}

export interface IAuthState {
    user: IUser | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
}
