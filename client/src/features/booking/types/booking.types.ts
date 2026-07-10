export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type DepositStatus = 'NONE' | 'AWAITING' | 'RECEIVED';
export type PaymentMode = 'NONE' | 'DEPOSIT' | 'FULL';
export type PaymentChannel = 'MANUAL' | 'FLITT';

export interface BookingServiceOption {
    name: string;
    durationMinutes: number;
    price?: number;
}

export interface PublicBookingInfo {
    masterName: string;
    username: string | null;
    paymentMode: PaymentMode;
    paymentChannel?: PaymentChannel;
    depositAmount: number | null;
    paymentInfo: string | null;
    services: BookingServiceOption[];
}

export interface SlotsResponse {
    slots: string[];
    dayClosed: boolean;
    durationMinutes: number;
}

export interface RequestOtpPayload {
    clientName: string;
    clientPhone: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    serviceName: string;
    note?: string;
    consent: true;
}

export interface BookPayload extends RequestOtpPayload {
    otpRequestId: string;
    code: string;
}

export interface BookResult {
    id: string;
    status: BookingStatus;
    date: string;
    startTime: string;
    endTime: string;
    serviceName: string;
    paymentMode: PaymentMode;
    paymentChannel: PaymentChannel;
    prepaymentRequired: boolean;
    prepaymentAmount: number | null;
    depositStatus: DepositStatus;
    paymentInfo: string | null;
    redirectUrl: string | null;
    manageUrl: string;
}

export interface MasterBooking {
    id: string;
    clientName: string;
    clientPhone: string;
    serviceName: string;
    durationMinutes: number;
    date: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
    paymentMode: PaymentMode;
    paymentChannel: PaymentChannel;
    prepaymentRequired: boolean;
    prepaymentAmount: number | null;
    depositStatus: DepositStatus;
    note: string | null;
    createdAt: string;
}

export interface BookingFilters {
    page?: number;
    limit?: number;
    status?: BookingStatus;
    date?: string;
}

export interface WorkingInterval {
    open: string;
    close: string;
}

export type WeekdayKey =
    | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type WorkingHours = Record<WeekdayKey, WorkingInterval[] | null>;

export interface ProfileServiceItem {
    name: string;
    price: number;
    priceType?: 'fixed' | 'hourly';
    category: string;
    duration?: number;
    description?: string;
}

export interface BookingSettings {
    bookingEnabled: boolean;
    bookingPaymentMode: PaymentMode;
    bookingPaymentChannel: PaymentChannel;
    bookingPrepaymentAmount: number | null;
    bookingPaymentInfo: string | null;
    workingHours: WorkingHours | null;
    services: ProfileServiceItem[];
}

export interface BookingSettingsPayload {
    bookingEnabled?: boolean;
    bookingPaymentMode?: PaymentMode;
    bookingPaymentChannel?: PaymentChannel;
    bookingPrepaymentAmount?: number | null;
    bookingPaymentInfo?: string | null;
    workingHours?: WorkingHours | null;
    services?: ProfileServiceItem[];
}

export interface ManagedBooking {
    id: string;
    status: BookingStatus;
    date: string;
    startTime: string;
    endTime: string;
    clientName: string;
    serviceName: string;
    currency: string;
    cancellationDeadline: string;
    policyCode: string;
    refundAmountMinor: number;
    retainedAmountMinor: number;
}

export interface ManagedCancellationResult {
    bookingId: string;
    policyCode: string;
    refundAmountMinor: number;
    retainedAmountMinor: number;
    refundStatus: 'SUCCEEDED' | 'PROCESSING' | 'FAILED' | 'NOT_REQUIRED';
}

export interface MasterPaymentBalance {
    currency: string;
    availableMinor: number;
    pendingMinor: number;
    paidMinor: number;
    payouts: Array<{
        id: string;
        amountMinor: number;
        currency: string;
        status: string;
        transferReference: string | null;
        paidAt: string | null;
        createdAt: string;
    }>;
}
