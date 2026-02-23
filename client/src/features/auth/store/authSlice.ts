import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IUser, IAuthState } from '../types/auth.types';

const initialState: IAuthState = {
    user: null,
    isAuthenticated: false,
    isInitializing: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<IUser>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.isInitializing = false;
        },
        setInitialized: (state) => {
            state.isInitializing = false;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isInitializing = false;
        },
        updateCredits: (state, action: PayloadAction<number>) => {
            if (state.user) {
                state.user.credits = action.payload;
            }
        },
    },
});

export const { setUser, setInitialized, logout, updateCredits } = authSlice.actions;
export default authSlice.reducer;
