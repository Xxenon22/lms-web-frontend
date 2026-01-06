import axios from "axios";

const api = axios.create({
    baseURL: "https://metschoo-ils.my.id/api",
    timeout: 60000, // 30 detik
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;
