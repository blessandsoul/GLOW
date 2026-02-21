export type UserRole = 'USER' | 'MASTER' | 'ADMIN' | 'SALON';

export interface IUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    isEmailVerified: boolean;
    avatar?: string;
    credits: number;
    createdAt: string;
    updatedAt: string;
}

export interface IAuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface ILoginRequest {
    email: string;
    password: string;
}

export interface IRegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    referralCode?: string;
}

export interface IAuthState {
    user: IUser | null;
    tokens: IAuthTokens | null;
    isAuthenticated: boolean;
}
