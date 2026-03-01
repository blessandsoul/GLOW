import { apiClient } from '@/lib/api/axios.config';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';

import type { SendMessageResponse } from '../types';

interface ChatMessagePayload {
    message: string;
    language: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

class ChatService {
    async sendMessage(
        data: ChatMessagePayload
    ): Promise<SendMessageResponse['data']> {
        const response = await apiClient.post(API_ENDPOINTS.CHAT.MESSAGE, data);
        return response.data.data;
    }
}

export const chatService = new ChatService();
