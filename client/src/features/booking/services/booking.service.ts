import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import type { ApiResponse, PaginatedApiResponse } from '@/lib/api/api.types';
import type {
    PublicBookingInfo,
    SlotsResponse,
    RequestOtpPayload,
    BookPayload,
    BookResult,
    MasterBooking,
    BookingFilters,
    BookingStatus,
    BookingSettings,
    BookingSettingsPayload,
} from '../types/booking.types';

class BookingService {
    async getPublicInfo(username: string): Promise<PublicBookingInfo> {
        const { data } = await apiClient.get<ApiResponse<PublicBookingInfo>>(
            API_ENDPOINTS.BOOKING.PUBLIC_SERVICES(username),
        );
        return data.data;
    }

    async getSlots(username: string, date: string, serviceName: string): Promise<SlotsResponse> {
        const { data } = await apiClient.get<ApiResponse<SlotsResponse>>(
            API_ENDPOINTS.BOOKING.SLOTS(username),
            { params: { date, serviceName } },
        );
        return data.data;
    }

    async requestOtp(username: string, payload: RequestOtpPayload): Promise<{ requestId: string }> {
        const { data } = await apiClient.post<ApiResponse<{ requestId: string }>>(
            API_ENDPOINTS.BOOKING.REQUEST_OTP(username),
            payload,
        );
        return data.data;
    }

    async book(username: string, payload: BookPayload): Promise<BookResult> {
        const { data } = await apiClient.post<ApiResponse<BookResult>>(
            API_ENDPOINTS.BOOKING.BOOK(username),
            payload,
        );
        return data.data;
    }

    async getMine(filters: BookingFilters): Promise<PaginatedApiResponse<MasterBooking>['data']> {
        const { data } = await apiClient.get<PaginatedApiResponse<MasterBooking>>(
            API_ENDPOINTS.BOOKING.MINE,
            { params: filters },
        );
        return data.data;
    }

    async updateStatus(id: string, status: BookingStatus): Promise<MasterBooking> {
        const { data } = await apiClient.patch<ApiResponse<MasterBooking>>(
            API_ENDPOINTS.BOOKING.UPDATE_STATUS(id),
            { status },
        );
        return data.data;
    }

    async markDepositReceived(id: string): Promise<MasterBooking> {
        const { data } = await apiClient.post<ApiResponse<MasterBooking>>(
            API_ENDPOINTS.BOOKING.DEPOSIT_RECEIVED(id),
            {},
        );
        return data.data;
    }

    // Booking config lives on the master profile; load + persist the booking-relevant subset.
    async getSettings(): Promise<BookingSettings> {
        const { data } = await apiClient.get<ApiResponse<BookingSettings>>(
            API_ENDPOINTS.PROFILES.ME,
        );
        const p = (data.data ?? {}) as Partial<BookingSettings>;
        return {
            bookingEnabled: p.bookingEnabled ?? false,
            bookingPrepaymentEnabled: p.bookingPrepaymentEnabled ?? false,
            bookingPrepaymentAmount: p.bookingPrepaymentAmount ?? 20,
            bookingPaymentInfo: p.bookingPaymentInfo ?? null,
            workingHours: p.workingHours ?? null,
            services: p.services ?? [],
        };
    }

    async saveSettings(payload: BookingSettingsPayload): Promise<void> {
        await apiClient.put<ApiResponse<unknown>>(API_ENDPOINTS.PROFILES.ME, payload);
    }
}

export const bookingService = new BookingService();
