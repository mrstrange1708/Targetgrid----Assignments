import { io } from 'socket.io-client';

const rawBaseUrl = import.meta.env.NEXT_PUBLIC_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:7777';
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');

export const socket = io(normalizedBaseUrl, {
    transports: ['websocket'],
    reconnectionAttempts: 5,
});
