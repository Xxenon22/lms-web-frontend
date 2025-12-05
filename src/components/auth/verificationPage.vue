<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../../services/api";
import { useToast } from "primevue/usetoast";

const router = useRouter();
const toast = useToast()
const processType = localStorage.getItem("processType");
const email = localStorage.getItem("email") || "unknown@mail.com";

// 6-digit OTP code array
const code = ref(["", "", "", "", "", ""]);
const codeInputs = ref([0, 1, 2, 3, 4, 5]);

// Move to next input
const moveNext = (index) => {
    if (code.value[index].length === 1 && index < 5) {
        const next = document.querySelectorAll("input")[index + 1];
        next.focus();
    }
};

// Backspace -> move previous
const movePrev = (index, event) => {
    if (event.key === "Backspace" && !code.value[index] && index > 0) {
        const previous = document.querySelectorAll("input")[index - 1];
        previous.focus();
    }
};

// Submit verification
const submitCode = async () => {
    const finalCode = code.value.join("");

    if (finalCode.length !== 6) {
        alert("Code must be 6 digits.");
        return;
    }

    try {
        let res;

        if (processType === "login") {
            // 🔥 PENTING — LOGIN HARUS KE ENDPOINT INI
            res = await api.post("/auth/verify-login-code", {
                email,
                code: finalCode,
            });
        } else {
            // 🔥 REGISTER — BARU PAKAI VERIFY EMAIL
            res = await api.post("/auth/verify-email", {
                email,
                code: finalCode,
            });
        }

        // Simpan TOKEN setelah login
        if (processType === "login") {
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("role", res.data.user.role);
            localStorage.setItem("user", JSON.stringify(res.data.user));
        }

        const role = res?.data?.user?.role || localStorage.getItem("role");

        toast.add({
            severity: "success",
            summary: "Verification Success",
            detail: "Code verified successfully",
            life: 5000,
        });

        // Redirect based on role
        if (role === "admin") return router.push("/home-admin");
        if (role === "teacher") return router.push("/home-teacher");
        return router.push("/home-student");

    } catch (err) {
        toast.add({
            severity: "error",
            summary: "Verify Code Failed",
            detail: err.response?.data?.message || "Invalid code",
        });
    }
};
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-300 to-emerald-500 p-4">
        <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">

            <!-- Icon -->
            <div class="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                    stroke="currentColor" class="w-8 h-8 text-emerald-600">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M3 8l7.89 5.26c.69.46 1.53.46 2.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>

            <!-- Title -->
            <h2 class="text-2xl font-bold text-gray-800">Verify Your Email</h2>
            <p class="text-gray-500 mt-1 t ext-sm">
                Enter the 6-digit code sent to
                <br />
                <span class="font-semibold text-gray-700">{{ email }}</span>
            </p>

            <!-- Code Inputs -->
            <div class="flex justify-between mt-6">
                <input v-for="(digit, index) in codeInputs" :key="index" maxlength="1" class="w-12 h-14 border border-gray-300 rounded-xl text-center text-xl font-semibold
                 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    v-model="code[index]" @input="moveNext(index)" @keydown.backspace="movePrev(index, $event)" />
            </div>

            <!-- Button -->
            <button @click="submitCode" style="background-color: #43A047;"
                class="mt-6 w-full py-3 text-white font-semibold rounded-xl transition">
                Confirm
            </button>

        </div>
    </div>
    <Toast />
</template>
