import axios from "axios";

const api = axios.create({
    baseURL: "https://metschoo-ils.my.id/api"
});

/* =========================
   REQUEST INTERCEPTOR
========================= */
api.interceptors.request.use(config => {
    const token = localStorage.getItem("token");

    // ⛔ JANGAN kirim token ke /maintenance
    if (token && !config.url.includes("/maintenance")) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

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

            // flag hanya 1x
            if (!localStorage.getItem("token_expired")) {
                localStorage.setItem("token_expired", "1");
                window.location.href = "/?expired=1";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
