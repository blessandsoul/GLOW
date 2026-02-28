import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse } from '@/lib/api/api.types';
import type {
    ILoginRequest,
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

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
            currentPassword,
            newPassword,
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
}

export const authService = new AuthService();
