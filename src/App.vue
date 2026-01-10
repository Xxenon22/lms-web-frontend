<script setup>
import { useRoute, useRouter } from "vue-router";
import { onMounted, watch } from "vue";
import { useToast } from "primevue/usetoast";

import AdminLayout from "./components/layout/AdminLayout.vue";
import GuruLayout from "./components/layout/GuruLayout.vue";
import SiswaLayout from "./components/layout/SiswaLayout.vue";
import Toast from "primevue/toast";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const layoutMap = {
  admin: AdminLayout,
  teacher: GuruLayout,
  student: SiswaLayout,
};

/* =========================
   MOBILE BLOCK
========================= */
onMounted(() => {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile && route.path !== "/mobile-unavailable") {
    router.replace("/mobile-unavailable");
  }
});

/* =========================
   TOKEN EXPIRED TOAST
========================= */
watch(
  () => route.fullPath,
  () => {
    if (route.query.expired === "1") {
      toast.add({
        severity: "warn",
        summary: "Session Expired",
        detail: "Your session has ended. For security purposes, please sign in again.",
        life: 5000,
      });

      router.replace({ query: {} });
    }
  },
  { immediate: true }
);
</script>

<template>
  <component :is="layoutMap[route.meta.layout] || 'div'">
    <Toast />
    <router-view />
  </component>
</template>
