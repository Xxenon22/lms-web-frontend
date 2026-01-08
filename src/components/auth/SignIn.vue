<script setup>
import { ref } from "vue";
import api from "../../services/api";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";

const email = ref("");
const password = ref("");
const router = useRouter();
const toast = useToast();

const handleLogin = async () => {
  if (!email.value || !password.value) {
    toast.add({
      severity: "warn",
      summary: "Warning",
      detail: "Email and Password are required.",
    });
    return;
  }

  // try {
  //   // STEP 1 LOGIN → request OTP
  //   const res = await api.post("/auth/login", {
  //     email: email.value,
  //     password: password.value,
  //   });

  //   // === SUCCESS: OTP DIKIRIM ===
  //   if (res.data.nextStep === "verify-login-code") {
  //     toast.add({
  //       severity: "info",
  //       summary: "OTP Sent",
  //       detail: "We have sent a login code to your email.",
  //       life: 3000,
  //     });

  //     // SIMPAN EMAIL & MODE LOGIN
  //     localStorage.setItem("email", email.value);
  //     localStorage.setItem("processType", "login"); // membedakan dengan register

  //     router.push("/verify-code");
  //     return;
  //   }

  // } catch (err) {
  //   console.error("error login:", err);

  //   toast.add({
  //     severity: "error",
  //     summary: "Login Failed",
  //     detail: err.response?.data?.message || "Something went wrong",
  //     life: 3000,
  //   });
  // }

  try {
    const res = await api.post("/auth/login", {
      email: email.value,
      password: password.value,
    });

    // Simpan token dan role langsung
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.user.role);

    toast.add({
      severity: "success",
      summary: "Login Success",
      detail: `Welcome back, ${res.data.user.username}!`,
      life: 3000,
    });

    // Redirect sesuai role
    if (res.data.user.role === "student") router.push("/home-student");
    if (res.data.user.role === "teacher") router.push("/home-teacher");
    if (res.data.user.role === "admin") router.push("/home-admin");

  } catch (err) {
    console.error("error login:", err);

    toast.add({
      severity: "error",
      summary: "Login Failed",
      detail: err.response?.data?.message || "Something went wrong",
      life: 3000,
    });
  }
};
</script>

<template>

  <div class="logo flex absolute top-4 left-4 m-4 items-center space-x-2">
    <img src="../../assets/LOGO_SMK_METLAND.png" class="w-15 h-15" alt="school's_logo">
    <div class="flex flex-col">
      <h1 class="text-2xl font-semibold">MILES</h1>
      <p>
        Metschoo Integrated Learning System</p>
    </div>
  </div>
  <div class="flex flex-col items-center bg-cover bg-center justify-center min-h-screen p-30">
    <div class="card rounded-2xl space-y-4 flex justify-center bg-white h-[500px] overflow-hidden">

      <div class="w-1/2 h-full">
        <img src="../../assets/smkmetland.png" class="w-full h-full object-cover rounded-l-2xl">
      </div>

      <div class=" w-1/2 flex flex-row justify-center">
        <form class="space-y-15 w-full min-h-80 p-15 rounded-2xl" @submit.prevent="handleLogin">
          <div class="header flex flex-col items-center space-y-2">
            <h1 class="text-3xl font-bold">Welcome To MILES</h1>
            <p>Please sign in to your account!</p>
          </div>
          <div class="space-y-10">
            <FloatLabel variant="out">
              <InputText class="w-full bg-slate-900" name="email" type="text" v-model="email" />
              <label for="email">Email</label>
            </FloatLabel>

            <FloatLabel variant="out">
              <Password toggleMask class="w-full" input-class="w-full" :feedback="false" v-model="password" />
              <label for="password">Password</label>
            </FloatLabel>
          </div>
          <div class="text-center space-y-5">
            <Button class="button w-48" label="Sign In" type="submit" rounded variant="outlined" />
            <p>Don't have an account?
              <RouterLink to="/sign-up">Sign up here!</RouterLink>
            </p>
          </div>
        </form>
      </div>

    </div>
    <!-- <footer class="text-white">
      © 2025 Copyright PUSDALITBANGJAR - V.1.2.0
    </footer> -->
    <Toast />
  </div>
</template>

<style scoped>
.button {
  background-color: #E5F4F4;
  border: 1px solid #B3D2D2;
}
</style>