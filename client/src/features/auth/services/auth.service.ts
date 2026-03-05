import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type {
    IChangePasswordOtpResponse,
    ILoginRequest,
    IRecoverPasswordRequestResponse,
    IRegisterRequest,
    IRegisterResponse,
    IResendOtpResponse,
    IUser,
    IVerifyPhoneRequest,
} from '../types/auth.types';

class AuthService {
    async register(data: IRegisterRequest): Promise<IRegisterResponse> {
        const response = await apiClient.post<ApiResponse<IRegisterResponse>>(
            API_ENDPOINTS.AUTH.REGISTER,
            data,
        );
        return response.data.data;
    }

    async login(data: ILoginRequest): Promise<{ user: IUser }> {
        const response = await apiClient.post<ApiResponse<{ user: IUser }>>(
            API_ENDPOINTS.AUTH.LOGIN,
            data,
        );
        return response.data.data;
    }

    async logout(): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    }

    async refresh(): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.REFRESH);
    }

    async getMe(): Promise<IUser> {
        const response = await apiClient.get<ApiResponse<IUser>>(
            API_ENDPOINTS.AUTH.ME,
        );
        return response.data.data;
    }

    async verifyEmail(token: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
    }

    async requestPasswordReset(email: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.REQUEST_PASSWORD_RESET, { email });
    }

    async resetPassword(token: string, password: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
    }

    async changePasswordRequestOtp(newPassword: string, currentPassword?: string): Promise<IChangePasswordOtpResponse> {
        const response = await apiClient.post<ApiResponse<IChangePasswordOtpResponse>>(
            API_ENDPOINTS.AUTH.CHANGE_PASSWORD_REQUEST_OTP,
            { newPassword, ...(currentPassword ? { currentPassword } : {}) },
        );
        return response.data.data;
    }

    async changePassword(newPassword: string, otpRequestId: string, code: string, currentPassword?: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
            newPassword,
            otpRequestId,
            code,
            ...(currentPassword ? { currentPassword } : {}),
        });
    }

    async verifyPhone(data: IVerifyPhoneRequest): Promise<{ user: IUser }> {
        const response = await apiClient.post<ApiResponse<{ user: IUser }>>(
            API_ENDPOINTS.AUTH.VERIFY_PHONE,
            data,
        );
        return response.data.data;
    }

    async resendOtp(): Promise<IResendOtpResponse> {
        const response = await apiClient.post<ApiResponse<IResendOtpResponse>>(
            API_ENDPOINTS.AUTH.RESEND_OTP,
        );
        return response.data.data;
    }

    async setPhone(phone: string): Promise<{ requestId: string }> {
        const response = await apiClient.post<ApiResponse<{ requestId: string }>>(
            API_ENDPOINTS.AUTH.SET_PHONE,
            { phone },
        );
        return response.data.data;
    }

    async recoverPasswordRequest(email: string): Promise<IRecoverPasswordRequestResponse> {
        const response = await apiClient.post<ApiResponse<IRecoverPasswordRequestResponse>>(
            API_ENDPOINTS.AUTH.RECOVER_PASSWORD_REQUEST,
            { email },
        );
        return response.data.data;
    }

    async recoverPassword(
        recoveryToken: string,
        requestId: string,
        code: string,
        password: string,
    ): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.RECOVER_PASSWORD, {
            recoveryToken,
            requestId,
            code,
            password,
        });
    }
}

export const authService = new AuthService();
