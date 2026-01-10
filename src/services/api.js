import axios from "axios";

const api = axios.create({
    baseURL: "https://metschoo-ils.my.id/api"
});

/* REQUEST */
api.interceptors.request.use(config => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/* RESPONSE */
api.interceptors.response.use(
    res => res,
    error => {
        const status = error.response?.status;

        // 🔐 TOKEN EXPIRED
        if (status === 401) {
            if (!localStorage.getItem("token_expired")) {
                localStorage.setItem("token_expired", "1");
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                window.location.href = "/?expired=1";
            }
        }

        // 🛠️ MAINTENANCE
        if (status === 503 && error.response?.data?.maintenance) {
            window.location.href = "/maintenance";
        }

        return Promise.reject(error);
    }
);

export default api;
