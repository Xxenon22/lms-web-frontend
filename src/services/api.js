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

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    res => res,
    err => {
        const status = err.response?.status;

        // 🔥 TOKEN EXPIRED / INVALID
        if (status === 401 || status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("users");

            // optional: flag notif
            localStorage.setItem("session_expired", "1");

            window.location.href = "/";
        }

        // Maintenance
        if (status === 503 && err.response.data?.maintenance) {
            window.location.href = "/maintenance";
        }

        return Promise.reject(err);
    }
);
export default api;
