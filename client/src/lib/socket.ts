import { io } from 'socket.io-client';

export const socket = io(import.meta.env.NEXT_PUBLIC_API_BASE_URL, {
    transports: ['websocket'],
    reconnectionAttempts: 5,
});
