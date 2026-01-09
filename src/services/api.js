import axios from "axios";

const api = axios.create({
    baseURL: "https://metschoo-ils.my.id/api",
    // timeout: 10000, // 30 detik
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;

});

api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 503 && err.response.data?.maintenance) {
            window.location.href = "/maintenance";
        }
        return Promise.reject(err);
    }
);

export default api;
