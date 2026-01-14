import axios from 'axios';


export const api = axios.create({
    baseURL: `${import.meta.env.NEXT_PUBLIC_API_BASE_URL}/api`,
});
