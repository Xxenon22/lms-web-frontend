<script setup>
import { ref } from "vue";
import api from "../../services/api";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import bg from "../../assets/bg.vue";

const email = ref("");
const password = ref("");
const router = useRouter();
const toast = useToast();

const handleLogin = async () => {
  if (!email.value || !password.value) {
    toast.add({
      severity: 'warn', summary: 'Warning', detail: 'Email and Password are required.'
    });
    return;
  }

  try {
    const res = await api.post("/auth/login", {
      email: email.value,
      password: password.value,
    });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.users.role);
    localStorage.setItem("id", res.data.users.id); // simpan guru_id

    toast.add({
      severity: "success",
      summary: "Login Success",
      detail: `Hi! , ${res.data.users.username}`,
      life: 3000,
    });

    // redirect sesuai role
    if (res.data.users.role === "student") {
      router.push("/home-student");
    } else if (res.data.users.role === "teacher") {
      router.push("/home-teacher");
    } else if (res.data.users.role === "admin") {
      router.push("/home-admin");
    }

  } catch (err) {
    console.error("error login:", err)
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
  <bg />
  <div class="flex flex-col items-center bg-cover bg-center justify-center min-h-screen space-y-4 p-6">
    <div
      class="card w-full max-w-6xl min-h-[490px] bg-cover bg-center  p-4 rounded-md space-y-4 relative flex flex-col justify-center"
      style="background-image: url(/images/bg_school.png);">

      <div class="flex flex-row justify-center pt-20">
        <div class="flex ">
          <div class="logo flex absolute top-4 left-4 items-center space-x-2">
            <img src="../../assets/Logo.png" alt="logo" class="w-15 h-15">
            <img src="../../assets/LOGO_SMK_METLAND.png" class="w-12 h-12" alt="logo_sekolah">
          </div>
        </div>

        <form class="space-y-20 w-96 min-h-80 bg-white/30 backdrop-blur-sm p-5 rounded-2xl"
          @submit.prevent="handleLogin">
          <div class="space-y-6">
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
            <Button class="w-full" label="Sign In" type="submit" />
            <span>Don't have an account yet? </span>
            <RouterLink to="/sign-up">Sign up here!</RouterLink>

          </div>
        </form>
      </div>

    </div>
    <footer class="text-white">
      © 2025 Copyright PUSDALITBANGJAR - V.1.2.0 <!-- Logo PUSDALIT & BANGJAR -->
    </footer>
    <Toast />
  </div>
</template>
