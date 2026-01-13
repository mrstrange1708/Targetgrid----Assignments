import { io } from 'socket.io-client';

export const socket = io('http://localhost:7777', {
    transports: ['websocket'],
    reconnectionRequests: 5,
});
