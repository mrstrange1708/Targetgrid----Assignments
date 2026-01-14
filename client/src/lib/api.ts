import axios from 'axios';


const rawBaseUrl = import.meta.env.NEXT_PUBLIC_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:7777';
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');

export const api = axios.create({
    baseURL: `${normalizedBaseUrl}`,
});
 