import type {
    ILoginRequest,
    IRegisterRequest,
    IUser,
    IAuthTokens,
} from '../types/auth.types';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const MOCK_TOKENS: IAuthTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
};

function makeMockUser(email: string, firstName: string, lastName: string): IUser {
    return {
        id: 'mock-user-id',
        email,
        firstName,
        lastName,
        role: 'USER',
        isEmailVerified: true,
        credits: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

// In-memory store for mock session
let mockUser: IUser | null = null;
let mockCredits = 3;

class AuthService {
    async register(data: IRegisterRequest): Promise<{ user: IUser; tokens: IAuthTokens }> {
        await delay(800);
        mockCredits = 3;
        mockUser = makeMockUser(data.email, data.firstName, data.lastName);
        return { user: mockUser, tokens: MOCK_TOKENS };
    }

    async login(data: ILoginRequest): Promise<{ user: IUser; tokens: IAuthTokens }> {
        await delay(600);
        if (data.password.length < 4) {
            throw Object.assign(new Error('Invalid email or password'), { isAxiosError: true, response: { data: { error: { message: 'Invalid email or password' } } } });
        }
        mockCredits = 3;
        mockUser = makeMockUser(data.email, data.email.split('@')[0] || 'User', '');
        return { user: mockUser, tokens: MOCK_TOKENS };
    }

    async logout(): Promise<void> {
        await delay(200);
        mockUser = null;
    }

    async refreshToken(_refreshToken: string): Promise<IAuthTokens> {
        await delay(200);
        return MOCK_TOKENS;
    }

    async getMe(): Promise<IUser> {
        await delay(300);
        if (!mockUser) throw new Error('Not authenticated');
        return { ...mockUser, credits: mockCredits };
    }

    async verifyEmail(_token: string): Promise<void> {
        await delay(300);
    }

    async requestPasswordReset(_email: string): Promise<void> {
        await delay(500);
    }

    async resetPassword(_token: string, _password: string): Promise<void> {
        await delay(500);
    }
}

export const authService = new AuthService();

// Export for use by creditsService mock
export function _getCredits() { return mockCredits; }
export function _decrementCredits() { mockCredits = Math.max(0, mockCredits - 1); }
