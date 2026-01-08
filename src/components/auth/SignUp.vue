<script setup>
import { ref } from "vue";
import api from "../../services/api";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";
import { Password } from "primevue";

const router = useRouter();
const toast = useToast();

const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);

// const handleRegister = async () => {

//   if (password.value !== confirmPassword.value) {
//     toast.add({
//       severity: "warn",
//       summary: "Password Mismatch",
//       detail: "Password and confirmation do not match",
//       life: 4000,
//     })
//     return;
//   }

//   try {
//     const res = await api.post("/auth/register", {
//       username: username.value,
//       email: email.value,
//       password: password.value,
//       confirmPassword: confirmPassword.value,
//     });

//     // toast.add({
//     //   severity: "success",
//     //   summary: "Success",
//     //   detail: res.data.message,
//     //   life: 5000,
//     // });
//     // localStorage.setItem("processType", "register");
//     // localStorage.setItem("email", email.value); // untuk verifikasi
//     // localStorage.setItem("role", "student");
//     // localStorage.setItem("isLoginProcess", "false"); // <- penting
//     // router.push("/verify-code");

//     toast.add({
//       severity: "success",
//       summary: "Success",
//       detail: res.data.message,
//       life: 5000,
//     });

//     // bersihkan data otp
//     localStorage.removeItem("processType");
//     localStorage.removeItem("email");
//     localStorage.removeItem("isLoginProcess");

//     router.push("/home-student"); // atau /login

//   } catch (err) {
//     console.error("Register error:", err.response?.data || err);
//     toast.add({
//       severity: "error",
//       summary: "Failed",
//       detail: err.response?.data?.message,
//       life: 5000,
//     });
//   }
// };

const handleRegister = async () => {
  if (!username.value || !email.value || !password.value || !confirmPassword.value) {
    toast.add({
      severity: "warn",
      summary: "Incomplete Data",
      detail: "Please fill in all fields",
      life: 4000,
    });
    return;
  }

  if (password.value !== confirmPassword.value) {
    toast.add({
      severity: "warn",
      summary: "Password Mismatch",
      detail: "Password and confirmation do not match",
      life: 4000,
    });
    return;
  }

  loading.value = true;

  try {
    const res = await api.post("/auth/register", {
      username: username.value,
      email: email.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
    });

    toast.add({
      severity: "success",
      summary: "Success",
      detail: res.data.message,
      life: 4000,
    });

    // reset form
    username.value = "";
    email.value = "";
    password.value = "";
    confirmPassword.value = "";

    // redirect (pilih salah satu)
    // router.push("/login");
    // atau langsung masuk:
    router.push("/home-student");

  } catch (err) {
    console.error("Register error:", err);

    toast.add({
      severity: "error",
      summary: "Registration Failed",
      detail: err.response?.data?.message || "Something went wrong",
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
};
</script>
<template>
  <div class="logo flex absolute top-4 left-4 m-4 items-center space-x-2">
    <img src="../../assets/LOGO_SMK_METLAND.png" class="w-15 h-15" alt="school's_logo" />
    <div class="flex flex-col">
      <h1 class="text-2xl font-semibold">MILES</h1>
      <p>Metschoo Integrated Learning System</p>
    </div>
  </div>
  <div class="flex flex-col items-center bg-cover bg-center justify-center min-h-screen p-30">
    <div class="card rounded-2xl space-y-4 flex justify-center bg-white h-[550px] ">
      <div class="w-1/2 h-full">
        <img src="../../assets/smkmetland.png" class="w-full h-full object-cover rounded-l-2xl">
      </div>

      <div class="w-1/2 flex flex-row justify-center">
        <form class="space-y-5 w-full min-h-80 p-10 rounded-2xl" @submit.prevent="handleRegister">
          <div class="header flex flex-col items-center space-y-2">
            <h1 class="text-3xl font-bold">Welcome To MILES</h1>
            <p>Create your Account!</p>
          </div>
          <div class="space-y-3">
            <FloatLabel variant="in">
              <InputText class="w-full" name="username" type="text" v-model="username" />
              <label for="username">Username</label>
            </FloatLabel>
            <FloatLabel variant="in">
              <InputText class="w-full" name="email" type="text" v-model="email" />
              <label for="email">Email</label>
            </FloatLabel>
            <FloatLabel variant="in">
              <Password toggleMask class="w-full" input-class="w-full" v-model="password" />
              <label for="password">Password</label>
            </FloatLabel>
            <FloatLabel variant="in">
              <Password toggleMask class="w-full" input-class="w-full" v-model="confirmPassword" />
              <label for="confirmPassword">Confirm Password</label>
            </FloatLabel>
          </div>

          <div class="text-center space-y-5">
            <Button class="button w-48" label="Sign up" type="submit" variant="outlined" rounded />
            <p>Do you have an Account?
              <RouterLink to="/"> Sign in here!</RouterLink>
            </p>
          </div>
        </form>
      </div>
    </div>
    <!-- <footer class="text-white">
      © 2025 Copyright PUSDALITBANGJAR - V.1.2.0
    </footer> -->
  </div>
  <Toast />
</template>

<style scoped>
.button {
  background-color: #E5F4F4;
  border: 1px solid #B3D2D2;
}
</style>
