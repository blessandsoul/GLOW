export type WaitlistStatus = 'WAITING' | 'NOTIFIED' | 'CONVERTED' | 'CANCELLED' | 'EXPIRED';

export interface WaitlistServiceOption {
    name: string;
    category?: string;
    price?: number;
}

export interface PublicMasterServices {
    masterName: string;
    username: string | null;
    services: WaitlistServiceOption[];
}

export interface RequestOtpPayload {
    clientName: string;
    clientPhone: string;
    requestedDate: string; // YYYY-MM-DD
    serviceName?: string;
    preferredTime?: string; // HH:MM
    note?: string;
    consent: true;
}

export interface JoinPayload extends RequestOtpPayload {
    otpRequestId: string;
    code: string;
}

// Sanitized entry returned by the public join endpoint.
export interface WaitlistJoinResult {
    id: string;
    status: WaitlistStatus;
    requestedDate: string;
    serviceName: string | null;
    preferredTime: string | null;
}

// Full entry visible to the owning master.
export interface WaitlistEntry {
    id: string;
    clientName: string;
    clientPhone: string;
    phoneVerified: boolean;
    requestedDate: string;
    serviceName: string | null;
    preferredTime: string | null;
    note: string | null;
    status: WaitlistStatus;
    notifiedAt: string | null;
    createdAt: string;
}

export interface WaitlistDaySummary {
    date: string;
    waiting: number;
    notified: number;
}

export interface WaitlistFilters {
    page?: number;
    limit?: number;
    status?: WaitlistStatus;
    date?: string;
}
