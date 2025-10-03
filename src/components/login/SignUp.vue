<script setup>
import { ref } from "vue";
import axios from "axios";
import { useToast } from "primevue/usetoast";
import bg from "../../assets/bg.vue";
import { useRouter } from "vue-router";

const router = useRouter()
const toast = useToast();
const username = ref("");
const email = ref("");
const password = ref("");

const handleRegister = async () => {
  try {
    const res = await axios.post("/api/auth/register", {
      username: username.value,
      email: email.value,
      password: password.value,
    });

    toast.add({
      severity: "success",
      summary: "Success",
      detail: res.data.message || "Registrasi berhasil, silakan login",
      life: 5000,
    });
    localStorage.setItem("role", "student");
    localStorage.setItem("token", res.data.token ?? "");
    router.push("/home-student"); // samakan dengan login
  } catch (err) {
    console.error("Register error:", err.response?.data || err);
    toast.add({
      severity: "error",
      summary: "Failed",
      detail: err.response?.data?.error || "Terjadi kesalahan",
      life: 5000,
    });
  }
};
</script>

<template>
  <bg />
  <div class="flex flex-col items-center bg-cover bg-center justify-center min-h-screen space-y-4 p-6">
    <div
      class="card w-full max-w-6xl min-h-[490px] bg-cover bg-center p-4 rounded-md space-y-4 relative flex flex-col justify-center"
      style="background-image: url(/src/assets/school_bg.png);">
      <div class="flex flex-row justify-center pt-20">
        <div class="flex">
          <div class="logo flex absolute top-4 left-4 items-center space-x-2">
            <img src="../../assets/Logo.png" alt="logo" class="w-15 h-15" />
            <img src="../../assets/LOGO_SMK_METLAND.png" class="w-12 h-12" alt="logo_sekolah" />
          </div>
        </div>
        <form class="space-y-20 w-96 min-h-80 bg-white/30 backdrop-blur-sm p-5 rounded-2xl"
          @submit.prevent="handleRegister">
          <div class="space-y-3">
            <FloatLabel variant="in">
              <InputText class="w-full bg-slate-900" name="username" type="text" v-model="username" />
              <label for="username">Username</label>
            </FloatLabel>
            <FloatLabel variant="in">
              <InputText class="w-full bg-slate-900" name="email" type="text" v-model="email" />
              <label for="email">Email</label>
            </FloatLabel>
            <FloatLabel variant="in">
              <Password toggleMask class="w-full" input-class="w-full" :feedback="false" v-model="password" />
              <label for="password">Password</label>
            </FloatLabel>

          </div>

          <div class="text-center space-y-5">
            <Button class="w-full" label="Sign up" type="submit" />
            <span>Do you have an Account?</span>
            <RouterLink to="/"> Sign in here!</RouterLink>
          </div>
        </form>
      </div>
    </div>
    <footer class="text-white">
      © 2025 Copyright PUSDALITBANGJAR - V.1.0.0
    </footer>
  </div>
  <Toast />
</template>
