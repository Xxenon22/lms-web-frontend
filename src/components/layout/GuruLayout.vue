<script setup>
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from "vue-router";
import { useToast } from "primevue";
import { ref, onMounted } from "vue";
import api from "../../services/api";

const visible = ref(false); //untuk Dialog
const loading = ref(false);
const isirombel = ref("");
const isiMapel = ref("");
const toast = useToast();
const rombel = ref([]);
const mapel = ref([]);
const src = ref(null)
const router = useRouter()
const images = ref([]);
const activeIndex = ref(0);

const handleLogout = () => {
  localStorage.removeItem("token"); // hapus JWT
  router.push({ name: "SignIn" });
};

const fetchPhotoProfile = async () => {
  try {
    const res = await api.get("/auth/profile")
    const data = res.data
    src.value = data.photo_profiles_user
      ? `${import.meta.env.VITE_API_URL}${data.photo_profiles_user}`
      : null;
  } catch (error) {
    console.error("Error fetch profile :", error)
  }
}

const confirm = useConfirm();
const requireConfirmation = (event) => {
  confirm.require({
    target: event.currentTarget,
    group: "headless",
    message: "Are you sure you want to Sign Out of this account?"
  });
};

const fetchDataKelas = async () => {
  try {
    const res = await api.get("/rombel")
    rombel.value = res.data.map(b => ({
      id: b.id,
      name: `${b.grade_name || ''} ${b.name_rombel} `, // tampilkan gabungan
    }));
  } catch (error) {
    console.error("Fetch data kelas: ", error)
  }
}

const fetchDataMapel = async () => {
  try {
    const res = await api.get("/mapel"); // endpoint API kamu untuk mapel
    mapel.value = res.data;

  } catch (error) {
    console.error("Fetch data mapel: ", error);
  }
};

const tambahKelas = async () => {
  loading.value = true;
  if (!isirombel.value || !isiMapel.value) {
    toast.add({
      severity: "warn",
      summary: "Warning",
      detail: "Class and Subject are required!"
    })

  }
  try {
    await api.post("/kelas", {
      rombel_id: isirombel.value,
      link_wallpaper_kelas: images.value[activeIndex.value]?.itemImageSrc || null,
      id_mapel: isiMapel.value,
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    toast.add({ severity: "success", summary: "Success", detail: "Class added!", life: 3000 });
    visible.value = false;
    await fetchDataKelas();
  } catch (error) {
    toast.add({ severity: "error", summary: "Error", detail: "Failed to add class", life: 3000 });
  } finally {
    loading.value = false;
  }
};


onMounted(async () => {
  images.value = [
    { itemImageSrc: '/wallpapers/w1.jpg', thumbnailImageSrc: '/wallpapers/w1.jpg' },
    { itemImageSrc: '/wallpapers/w2.jpg', thumbnailImageSrc: '/wallpapers/w2.jpg' },
    { itemImageSrc: '/wallpapers/w3.jpg', thumbnailImageSrc: '/wallpapers/w3.jpg' },
    { itemImageSrc: '/wallpapers/w4.jpg', thumbnailImageSrc: '/wallpapers/w4.jpg' },
    { itemImageSrc: '/wallpapers/w5.jpg', thumbnailImageSrc: '/wallpapers/w5.jpg' },
    { itemImageSrc: '/wallpapers/w6.jpg', thumbnailImageSrc: '/wallpapers/w6.jpg' },
    { itemImageSrc: '/wallpapers/w7.jpg', thumbnailImageSrc: '/wallpapers/w7.jpg' },
  ];
  await fetchDataKelas();
  await fetchDataMapel();
  await fetchPhotoProfile();
});

</script>

<template>
  <!-- Fixed Navbar -->
  <div class="">
    <nav class="navbar fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center space-x-5 relative z-10">
        <img src="../../assets/LOGO_SMK_METLAND.png" alt="Logo" width="65" />
        <h1>
          <b>MILS</b> <br /> <b>M</b>etschoo <b>I</b>ntegrated <b>L</b>earning <b>S</b>ystem
        </h1>
      </div>
      <div class="flex items-center space-x-4">
        <!-- <div class="relative z-10"> -->
        <Button @click="visible = true"
          v-tooltip.bottom="{ value: 'Create / Add Classroom', showDelay: 1000, hideDelay: 300 }" icon="pi pi-plus"
          text />
        <Drawer v-model:visible="visible" :responsiveOptions="responsiveOptions" modal header="Create Classroom"
          position="bottom" style="height: auto">
          <div class="flex justify-center items-center">
            <div class="flex justify-center items-center w-1/2">
              <div class="">
                <Galleria :value="images.slice(0)" :numVisible="5" v-model:activeIndex="activeIndex"
                  containerStyle="max-width: 640px; margin: auto">
                  <!-- Gambar utama -->
                  <template #item="slotProps">
                    <img :src="slotProps.item.itemImageSrc" style="width: 100%; height: 300px; object-fit: cover;" />
                  </template>

                  <!-- Thumbnail -->
                  <template #thumbnail="slotProps">
                    <img :src="slotProps.item.thumbnailImageSrc"
                      style="width: 80px; height: 60px; object-fit: cover;" />
                  </template>
                </Galleria>
              </div>
            </div>

            <div class="flex flex-col justify-center items-center  w-1/2">
              <div class="flex items-center mb-4">
                <label for="rombel" class="font-semibold w-24">Class</label>
                <Select v-model="isirombel" :options="rombel" option-value="id" option-label="name"
                  placeholder="Select Class" class="w-full md:w-56" />
              </div>
              <div class="flex items-center mb-10">
                <label for="mataPelajaran" class="font-semibold w-24">Subject</label>
                <Select v-model="isiMapel" :options="mapel" option-value="id" option-label="nama_mapel"
                  placeholder="Select Subject" class="w-full md:w-56" />
              </div>
              <div class="flex items-center gap-2">
                <Button type="button" label="Cancel" severity="secondary" @click="visible = false"></Button>
                <Button type="button" label="Save" @click="tambahKelas" :loading="loading"></Button>
              </div>
            </div>
          </div>
        </Drawer>
        <ConfirmPopup group="headless">
          <template #container="{ message, acceptCallback, rejectCallback }">
            <div class="rounded p-4">
              <span>{{ message.message }}</span>
              <div class="flex items-center gap-2 mt-4">
                <Button label="Sign Out" @click="handleLogout" severity="danger" size="small" text></Button>
                <Button label="Cancel" @click="rejectCallback" size="small"></Button>
              </div>
            </div>
          </template>
        </ConfirmPopup>

        <!-- Photo Profile -->
        <div @click="requireConfirmation($event)"
          class="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center border-1 bg-gray-200 cursor-pointer">
          <img v-if="src" :src="src" alt="Photo Profile" class="w-full h-full object-cover" />
          <i v-else class="pi pi-user text-gray-500" style="font-size: 1.5rem;"></i>
        </div>
      </div>

    </nav>
    <div class="absolute z-0 overflow-hidden top-0 right-0">
      <img src="/src/assets/Aset Mawar.png" width="130">
    </div>

    <div class="absolute z-0">
      <img src="/src/assets/Pesawat.png" width="500">
    </div>

    <div class="absolute z-0" style="top: -90px;">
      <img src="/src/assets/pesawat_2.png" width="700">
    </div>

  </div>
  <!-- Layout wrapper -->
  <div class="flex h-screen pt-[96px]">
    <!-- Sidebar -->
    <aside class="sidebar text-black flex flex-col overflow-y-auto relative">
      <div class="logo flex items-center px-4 py-6">
        <Icon class="icon" icon="famicons:book-sharp" />
        <h1 class="m-4 font-semibold">Let’s make learning awesome!</h1>
      </div>
      <ul class="flex flex-col space-y-1 z-20">
        <RouterLink to="/home-teacher">
          <li>
            <Icon class="icon" icon="material-symbols:home-rounded" /><span class="nav-item">Home</span>
          </li>
        </RouterLink>
        <RouterLink to="/class-learning-plan">
          <li>
            <Icon class="icon" icon="marketeq:diagram-bar-3" /><span class="nav-item">Learning Plan</span>
          </li>
        </RouterLink>
        <RouterLink to="/class-learning-reflection">
          <li>
            <Icon class="icon" icon="fluent:learning-app-24-regular" /><span class="nav-item">Learning
              Reflection</span>
          </li>
        </RouterLink>
        <RouterLink to="/develope-course-content">
          <li>
            <Icon class="icon" icon="material-symbols:bookmark-manager-rounded" /><span class="nav-item">Develop
              Course
              Content</span>
          </li>
        </RouterLink>
        <RouterLink to="/assignments">
          <li>
            <Icon class="icon" icon="tdesign:task-filled" /><span class="nav-item">Assignments</span>
          </li>
        </RouterLink>
        <RouterLink to="/timetables">
          <li>
            <Icon class="icon" icon="uis:schedule" /><span class="nav-item">Timetable</span>
          </li>
        </RouterLink>
        <RouterLink to="/interactive-forum">
          <li>
            <Icon class="icon" icon="mdi:discussion" /><span class="nav-item">Interactive Forum</span>
          </li>
        </RouterLink>
        <RouterLink to="/classroom-management">
          <li>
            <Icon class="icon" icon="icon-park-outline:category-management" /><span class="nav-item">Classroom
              Management</span>
          </li>
        </RouterLink>
        <!-- <RouterLink>
          <li>
            <Icon class="icon" icon="material-symbols:archive" /><span class="nav-item">Archive</span>
          </li>
        </RouterLink> -->
        <RouterLink to="/teacher-settings">
          <li>
            <Icon class="icon" icon="mdi:cog" /><span class="nav-item">Settings</span>
          </li>
        </RouterLink>
      </ul>

    </aside>

    <!-- Main content -->
    <main class="main-content">
      <slot />
    </main>
  </div>

  <Toast />
</template>

<style scoped>
.navbar {
  height: 96px;
}

.sidebar {
  position: fixed;
  top: 96px;
  left: 0;
  width: 60px;
  height: calc(100vh - 96px);
  transition: width 0.3s ease;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  z-index: 40;
}

.sidebar::-webkit-scrollbar {
  width: 0;
  background: transparent;
}

.sidebar:hover {
  width: 250px;
}

.sidebar ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

.sidebar li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  transition: background-color 0.2s ease;
  border-radius: 8px;
  cursor: pointer;
}

.sidebar li:hover {
  background-color: #FFFCB8;
  opacity: 0.7;
}

.sidebar .icon {
  min-width: 30px;
  height: 30px;
  font-size: 20px;
  color: #797574;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-item {
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease;
  color: black;
}

.sidebar:hover .nav-item {
  opacity: 1;
  visibility: visible;
}

.main-content {
  flex-grow: 1;
  margin-left: 60px;
  transition: margin-left 0.3s ease;
  background-color: white;
  padding: 1.5rem;
  border-radius: 1.5rem;
  overflow-y: auto;
  height: calc(100vh - 96px);
}

.sidebar:hover~.main-content {
  margin-left: 250px;
}
</style>
