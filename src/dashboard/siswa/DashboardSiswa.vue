<script setup>
import { ref, onMounted, watch } from "vue";
import api from "../../services/api";
import { useToast } from "primevue/usetoast";

const toast = useToast();

/* ================= STATE ================= */
const kelasDiikuti = ref([]);
const kelasLainnya = ref([]);
const selectedView = ref("joined");
const loading = ref(true);

const selectedClass = ref(null);
const filteredClass = ref([]);
const kelasHasilPencarian = ref(null);

/* dialog guru */
const visible = ref(false);
const profile = ref({});
const src = ref(null);
const guruCache = ref({});

const API_URL = import.meta.env.VITE_API_URL;


/* ================= FETCH DASHBOARD ================= */
const loadDashboard = async () => {
    loading.value = true;
    try {
        const res = await api.get("/kelas/student/dashboard");
        // console.log(res.data);

        kelasDiikuti.value = Array.isArray(res.data.joined)
            ? res.data.joined
            : [];

        kelasLainnya.value = Array.isArray(res.data.other)
            ? res.data.other
            : [];

        console.log(kelasLainnya.value.map(k => k.rombel));

    } catch (err) {
        console.error(err);
        toast.add({
            severity: "error",
            summary: "Failed",
            detail: "Failed to load class data",
            life: 3000,
        });
    } finally {
        loading.value = false;
    }
};

const formatRombel = (rombel) => {
    if (!rombel) return "Kelas Umum";

    if (rombel.type === "collab") {
        return rombel.colab_class || "Kelas Kolaborasi";
    }

    return `${rombel.grade_lvl || ""} ${rombel.major || ""} ${rombel.name_rombel || ""} ${rombel.colab_class || ""}`.trim();
};


onMounted(loadDashboard);

/* ================= SEARCH ================= */
const search = (event) => {
    const q = event.query?.toLowerCase() || "";
    const source = [...kelasDiikuti.value, ...kelasLainnya.value];

    filteredClass.value = source
        .filter(k =>
            k.nama_mapel?.toLowerCase().includes(q) ||
            k.teacher?.username?.toLowerCase().includes(q) ||
            formatRombel(k.rombel).toLowerCase().includes(q)
        )
        .slice(0, 10)
        .map(k => ({
            id: k.id,
            name: `${k.nama_mapel} - ${k.rombel?.grade_lvl || ""} ${k.rombel?.major || ""} ${k.rombel?.name_rombel || ""} ${k.rombel?.colab_class} | ${k.guru_name || "No Teacher"}`,
        }));
};

watch(selectedClass, (val) => {
    if (!val) {
        kelasHasilPencarian.value = null;
        return;
    }
    const source = [...kelasDiikuti.value, ...kelasLainnya.value];
    kelasHasilPencarian.value = source.find(k => k.id === val.id) || null;
});

/* ================= FOLLOW ================= */
const ikutiKelas = async (id) => {
    try {
        await api.post(`/kelas/follow/${id}`);
        const kelas = kelasLainnya.value.find(k => k.id === id);
        if (!kelas) return;

        kelas.sudahDiikuti = true;
        kelasDiikuti.value.unshift(kelas);
        kelasLainnya.value = kelasLainnya.value.filter(k => k.id !== id);

        toast.add({ severity: "success", summary: "Joined", life: 2000 });
    } catch {
        toast.add({ severity: "warn", summary: "Already joined", life: 2000 });
    }
};

const batalIkutiKelas = async (id) => {
    try {
        await api.delete(`/kelas/unfollow/${id}`);
        const kelas = kelasDiikuti.value.find(k => k.id === id);
        if (!kelas) return;

        kelas.sudahDiikuti = false;
        kelasLainnya.value.unshift(kelas);
        kelasDiikuti.value = kelasDiikuti.value.filter(k => k.id !== id);

        toast.add({ severity: "info", summary: "Unfollowed", life: 2000 });
    } catch {
        toast.add({ severity: "error", summary: "Failed", life: 2000 });
    }
};

/* ================= TEACHER PROFILE ================= */
const fetchGuruById = async (id) => {
    if (guruCache.value[id]) {
        profile.value = guruCache.value[id];
        src.value = guruCache.value[id].photo_profile;
        visible.value = true;
        return;
    }

    try {
        const res = await api.get(`/auth/teacher/${id}`);
        guruCache.value[id] = {
            ...res.data,
            photo_profile: res.data.photo_url
                ? `${API_URL}${res.data.photo_url}?v=${Date.now()}`
                : null
        };
        profile.value = guruCache.value[id];
        src.value = guruCache.value[id].photo_profile;
        visible.value = true;
    } catch {
        toast.add({ severity: "error", summary: "Failed to load profile" });
    }
};

const withCacheBuster = (url) => {
    if (!url) return null;
    return `${API_URL}${url}?v=${Date.now()}`;
};
</script>

<template>
    <!-- Kelas yang diikuti -->
    <section class="flex flex-col m-10">
        <div class="searching flex justify-between items-center">
            <div class="flex flex-col">
                <h1 class="text-3xl font-semibold">Classroom</h1>
                <p class="text-lg text-gray-500">All your class</p>
            </div>

            <div class="relative ">
                <div
                    class="absolute left-0 top-0 bottom-0 w-12 flex items-center rounded-xl justify-center m-1.5 bg-[#166B6B] z-10">
                    <i class="pi pi-search text-white text-lg"></i>
                </div>

                <AutoComplete v-model="selectedClass" optionLabel="name" :suggestions="filteredClass" @complete="search"
                    placeholder="Find your class here" class="auto-input" />
            </div>
        </div>


        <!-- Hasil Pencarian -->
        <div v-if="kelasHasilPencarian">
            <div class="mt-5">
                <h1 class="text-xl font-bold">Search Result</h1>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-5">
                <Card :key="kelasHasilPencarian.id" class="w-full overflow-hidden">
                    <template #header>
                        <div class="relative">
                            <img :src="kelasHasilPencarian.link_wallpaper_kelas || '/wallpapers/w1.jpg'"
                                class="w-full h-32 object-cover" loading="lazy" />
                            <div @click="fetchGuruById(kelasHasilPencarian.guru_id)"
                                class="absolute bottom-[-1.5rem] right-4 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-white shadow cursor-pointer">
                                <img v-if="kelasHasilPencarian.guru_photo"
                                    :src="withCacheBuster(kelasHasilPencarian.guru_photo)" alt="Photo Profile"
                                    class="w-full h-full object-cover" loading="lazy" />
                                <i v-else class="pi pi-user text-gray-500" style="font-size: 1.5rem"></i>
                            </div>
                        </div>
                    </template>

                    <template #title>{{ kelasHasilPencarian.nama_mapel }}</template>
                    <template #subtitle>
                        <div class="flex justify-between">
                            <div class="">
                                {{ formatRombel(kelasHasilPencarian.rombel) }}

                            </div>

                            <div class="flex gap-4 mt-1 text-white">
                                <Button v-if="kelasHasilPencarian.sudahDiikuti" icon="pi pi-check"
                                    v-tooltip.bottom="'Following a Class'" class="button-join w-full no-border-btn"
                                    rounded @click="batalIkutiKelas(kelasHasilPencarian.id)" />
                                <RouterLink v-if="kelasHasilPencarian.sudahDiikuti"
                                    :to="{ name: 'Join-Class', params: { id: kelasHasilPencarian.id } }">
                                    <Button label="Join" class="button-join no-border-btn w-32" rounded />
                                </RouterLink>
                                <Button v-else :label="kelasHasilPencarian.sudahDiikuti ? 'Following' : 'Add'"
                                    class="no-border-btn w-40 button-join focus:outline-none" icon="pi pi-plus"
                                    iconPos="left" @click="ikutiKelas(kelasHasilPencarian.id)" />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Button switch -->
        <div class="mt-10 mb-5 space-x-4 w-full">
            <Button class="switch-btn w-40 text-white" rounded
                :class="selectedView === 'joined' ? '!bg-[#0D7474]' : '!bg-[#94A4A4]'" @click="selectedView = 'joined'">
                Joined Classes
            </Button>

            <Button class="switch-btn w-40 text-white" rounded
                :class="selectedView === 'other' ? '!bg-[#0D7474]' : '!bg-[#94A4A4]'" @click="selectedView = 'other'">
                Other Class
            </Button>
        </div>


        <!-- Joined Classes -->

        <div class="" v-if="selectedView === 'joined'">
            <div v-if="loading" class="grid grid-cols-3 gap-8">
                <Skeleton height="200px" v-for="i in 6" :key="i" />
            </div>

            <div v-else-if="kelasDiikuti.length === 0" class="text-center text-gray-400 mb-8">
                You are not enrolled in any classes yet.
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card v-for="kelas in kelasDiikuti" :key="kelas.id" class="w-full overflow-hidden">
                    <template #header>
                        <div class="relative">
                            <img :src="kelas.link_wallpaper_kelas || 'https://primefaces.org/cdn/primevue/images/usercard.png'"
                                class="w-full h-32 object-cover" loading="lazy" />
                            <div @click="fetchGuruById(kelas.guru_id)"
                                class="absolute bottom-[-1.5rem] right-4 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-white shadow cursor-pointer">
                                <img v-if="kelas.guru_photo" :src="withCacheBuster(kelas.guru_photo)"
                                    class="w-full h-full object-cover" />
                                <i v-else class="pi pi-user text-gray-500" style="font-size: 1.5rem"></i>
                            </div>
                        </div>
                    </template>

                    <template #title>{{ kelas.nama_mapel }}</template>
                    <template #subtitle>
                        {{ formatRombel(kelas.rombel) }}

                        <div class="flex justify-end gap-4 mt-1 ">
                            <Button v-tooltip.bottom="'Following a Class'" class="no-border-btn button-join"
                                icon="pi pi-check" @click="batalIkutiKelas(kelas.id)" rounded />
                            <RouterLink :to="{ name: 'Join-Class', params: { id: kelas.id } }">
                                <Button label="Join" class="button-join w-32 no-border-btn" rounded />
                            </RouterLink>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Other Classes -->
        <div class="" v-if="selectedView === 'other'">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 ">
                <Card v-for="kelas in kelasLainnya" :key="kelas.id" class="w-full overflow-hidden">
                    <template #header>
                        <div class="relative">
                            <img :src="kelas.link_wallpaper_kelas || 'https://primefaces.org/cdn/primevue/images/usercard.png'"
                                class="w-full h-32 object-cover" loading="lazy" />
                            <div @click="fetchGuruById(kelas.guru_id)"
                                class="absolute bottom-[-1.5rem] right-4 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-white shadow cursor-pointer">
                                <img v-if="kelas.guru_photo" :src="withCacheBuster(kelas.guru_photo)"
                                    alt="Photo Profile" class="w-full h-full object-cover" loading="lazy" />
                                <i v-else class="pi pi-user text-gray-500" style="font-size: 1.5rem"></i>
                            </div>
                        </div>
                    </template>

                    <template #title>{{ kelas.nama_mapel }}</template>
                    <template #subtitle>
                        <div class="flex justify-between">
                            <div class="">
                                {{ formatRombel(kelas.rombel) }}
                            </div>
                            <div class="flex gap-4 mt-1 text-white">
                                <Button :label="kelas.sudahDiikuti ? 'Following' : 'Add'"
                                    class="no-border-btn w-40 button-join focus:outline-none"
                                    :disabled="kelas.sudahDiikuti" icon="pi pi-plus" iconPos="left"
                                    @click="ikutiKelas(kelas.id)" />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </section>

    <!-- Dialog Profil Guru -->
    <Dialog v-model:visible="visible" modal :header="'Teacher Profile'" :style="{ width: '40vw' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
        <div v-if="profile" class="flex flex-col items-center gap-4">
            <div
                class="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-white shadow">
                <img v-if="src" :src="src" alt="Photo Profile" class="w-full h-full object-cover" loading="lazy" />
                <i v-else class="pi pi-user text-gray-500" style="font-size: 3.5rem"></i>
            </div>
            <h2 class="text-xl font-semibold">
                {{ profile.username || "Name not Available" }}
            </h2>
            <p class="text-gray-600">
                {{ profile.phone_number || "Phone number not Available" }}
            </p>
            <p class="text-gray-500">
                {{ profile.teacher_subject || "Subject not Available" }}
            </p>
        </div>
    </Dialog>

    <Toast />
</template>

<style scoped>
/* Khusus untuk tombol switch saja */
:deep(.switch-btn.p-button) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
}

.button-join {
    background-color: #0D7474;
    border-radius: 15px;
}

:deep(.auto-input .p-inputtext) {
    padding-left: 4rem !important;
    border-radius: 15px;
}
</style>