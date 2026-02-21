import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IUser, IAuthTokens, IAuthState } from '../types/auth.types';

const initialState: IAuthState = {
    user: null,
    tokens: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: IUser; tokens: IAuthTokens }>
        ) => {
            state.user = action.payload.user;
            state.tokens = action.payload.tokens;
            state.isAuthenticated = true;
        },
        updateTokens: (state, action: PayloadAction<IAuthTokens>) => {
            state.tokens = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.tokens = null;
            state.isAuthenticated = false;
        },
        updateCredits: (state, action: PayloadAction<number>) => {
            if (state.user) {
                state.user.credits = action.payload;
            }
        },
    },
});

export const { setCredentials, updateTokens, logout, updateCredits } = authSlice.actions;
export default authSlice.reducer;
