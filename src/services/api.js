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


// RESPONSE → tangkap token expired
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.setItem("token_expired", "true");

            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default api;
