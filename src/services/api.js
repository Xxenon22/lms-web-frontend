import axios from "axios";

const api = axios.create({
    baseURL: "https://metschoo-ils.my.id/api",
    // timeout: 10000, // 30 detik
});
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


/* =========================
   RESPONSE INTERCEPTOR
========================= */
api.interceptors.response.use(
    response => response,
    error => {
        const status = error.response?.status;

        if (status === 401) {
            console.warn("TOKEN EXPIRED → FORCE LOGOUT");

            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.setItem("token_expired", "1");

            // ⛔ WAJIB hard redirect
            window.location.href = "/?expired=1";
        }

        return Promise.reject(error);
    }
);

export default api;
