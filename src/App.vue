<script setup>
import { useRoute, useRouter } from "vue-router";
import { onMounted } from "vue";
import AdminLayout from "./components/layout/AdminLayout.vue";
import GuruLayout from "./components/layout/GuruLayout.vue";
import SiswaLayout from "./components/layout/SiswaLayout.vue";
import { Toast } from "primevue";

const route = useRoute();
const router = useRouter();

const layoutMap = {
  admin: AdminLayout,
  teacher: GuruLayout,
  student: SiswaLayout,
};

onMounted(() => {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile && route.path !== "/mobile-unavailable") {
    router.replace("/mobile-unavailable");
  }
});

</script>
<template>
  <component :is="layoutMap[route.meta.layout] || 'div'">
    <Toast />
    <router-view />
  </component>
</template>
