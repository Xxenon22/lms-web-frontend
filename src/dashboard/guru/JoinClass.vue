<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRoute, useRouter } from 'vue-router';
import Menu from 'primevue/menu';
import api from '../../services/api';
import Swal from 'sweetalert2';

const router = useRouter();
const route = useRoute();
const targetKelasId = parseInt(route.params.kelasId); // kelasId dari route
const toast = useToast();
const materiGuru = ref([]);
const guruId = ref(null);
const menuMap = ref({});
const selectedMateri = ref(null);
const isLoading = ref(true);
const classroom = ref(null);

// ✅ ambil profile guru dulu
const fetchGuruProfile = async () => {
  try {
    const res = await api.get("/auth/profile");
    const data = res.data;
    guruId.value = data.id;

    await fetchMateriGuru();
  } catch (error) {
    console.error("Error fetch profile :", error);
  }
};

// ✅ ambil materi guru berdasarkan guruId & kelasId
const fetchMateriGuru = async () => {
  if (!guruId.value || !targetKelasId) {
    console.warn("Teacher ID or class ID is not available yet.");
    return;
  }

  try {
    const res = await api.get(`/module-pembelajaran/kelas/${targetKelasId}`);
    materiGuru.value = res.data || [];
  } catch (error) {
    console.error("Error retrieving teacher materials.:", error);
    toast.add({
      severity: "error",
      summary: "Failed",
      detail: "Could not load teacher's materials.",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

// ✅ format tanggal
const formatDate = (created_at) => {
  if (!created_at) return "Date not available.";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(created_at));
};

//  menu popup
const toggleMenu = (event, materiId) => {
  const menuRef = menuMap.value[materiId];
  if (menuRef?.toggle) {
    menuRef.toggle(event);
  }
  selectedMateri.value = materiId;
};

//  lihat detail materi
const lihatMateri = () => {
  if (selectedMateri.value)
    router.push({ name: 'Learning-Material-Details', params: { id: selectedMateri.value } });
};

//  hapus materi
const deleteMateri = async () => {
  if (!selectedMateri.value) return;
  const confirm = await Swal.fire({
    title: "Are you sure, you want to delete this Material?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
  });

  if (!confirm.isConfirmed) return;
  try {
    await api.delete(`/module-pembelajaran/${selectedMateri.value}`);
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Material deleted', life: 3000 });
    await fetchMateriGuru();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: 'Cant Delete Material', life: 3000 });
    console.error("Error delete materi:", error);
  }
};

const fetchClassroom = async () => {
  try {
    const res = await api.get(`/kelas/${targetKelasId}`);
    classroom.value = res.data;
    console.log("Classroom data:", classroom.value);
    if (!res) {
      toast.add({ severity: "error", summary: "Classroom not found!", life: 3000 });
      return;
    }

  } catch (err) {
    console.error('fetchClassroom', err);
  }
}

onMounted(() => {
  fetchGuruProfile();
  fetchClassroom();
});
</script>

<template>
  <section v-if="classroom"
    class="relative w-full h-[285px] rounded-b-3xl overflow-hidden flex items-center text-black mb-5 shadow-2xl">
    <!-- Wallpaper -->
    <div class="absolute inset-0 bg-cover bg-center">
      <img :src="classroom.link_wallpaper_kelas" alt="" />
    </div>

    <!-- Overlay gradient + blur -->
    <div class=" absolute inset-0 backdrop-blur-[5px]" style="background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 1) 20%,    /* kiri: putih 60% */
            rgba(20, 107, 107,0.40) 50%,   /* tengah kiri */
            rgba(20, 107, 107, 0.71) 60%,   /* tengah */
            rgba(255, 255, 255, 0.00) 90%    /* kanan bening */
        );">
    </div>

    <!-- Content -->
    <div class="relative z-10 space-y-8 pl-10">
      <div class="flex flex-col">
        <h1 class="text-2xl font-semibold">{{ classroom.nama_mapel }}</h1>
        <h2 class="text-lg">{{ classroom.grade_lvl }} {{ classroom.major }} {{ classroom.name_rombel }}</h2>
      </div>
      <p>{{ classroom.guru_name }}</p>
    </div>
  </section>

  <div v-if="isLoading" class="flex justify-center py-10">
    <ProgressSpinner />
  </div>

  <div v-else-if="materiGuru.length === 0" class="text-center text-gray-400 mb-8">
    No materials have been uploaded yet.
  </div>

  <div v-else>
    <div v-for="materi in materiGuru" :key="materi.id" class="m-5">
      <Panel toggleable>
        <template #header>
          <div class="flex items-center gap-2">
            <span class="font-bold">{{ materi.judul }}</span>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-4">
            <span class="text-surface-500 dark:text-surface-400">
              Uploaded On {{ formatDate(materi.created_at) }}
            </span>
          </div>
        </template>
        <template #icons>
          <Button icon="pi pi-cog" @click="(e) => toggleMenu(e, materi.id)" severity="secondary" rounded text />
          <Menu :ref="(el) => menuMap[materi.id] = el" :model="[
            { label: 'Open Material', icon: 'pi pi-eye', command: lihatMateri },
            { label: 'Delete Material', icon: 'pi pi-trash', command: deleteMateri }
          ]" popup />
        </template>

        <div class="m-0 overflow-auto break-all">
          <div v-html="materi.deskripsi"></div>
        </div>
      </Panel>
    </div>
  </div>
</template>
