<script setup>
import api from "../../services/api";
import { onMounted, ref, watch } from "vue";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const kelasDiikuti = ref([]);
const kelasLainnya = ref([]);
const userId = ref(null);
const selectedClass = ref("");
const filteredClass = ref([]);
const kelasHasilPencarian = ref(null);
const isLoading = ref(true);
const visible = ref(false);
const src = ref(null);
const profile = ref([]);
const selectedView = ref("joined");

// Lifecycle
onMounted(async () => {
    try {
        userId.value = localStorage.getItem("id");

        const [semuaKelas, idKelasIkut] = await Promise.all([
            fetchSemuaKelas(),
            fetchKelasYangDiikuti(),
        ]);

        semuaKelas.forEach(k => {
            k.sudahDiikuti = idKelasIkut.includes(k.id);
        });

        kelasDiikuti.value = semuaKelas.filter(k => k.sudahDiikuti);
        kelasLainnya.value = semuaKelas.filter(k => !k.sudahDiikuti);
    } finally {
        isLoading.value = false;
    }
});



// Ambil semua kelas

const fetchSemuaKelas = async () => {
    try {
        const res = await api.get("/kelas/all/list");

        return res.data.map((kelas) => ({
            ...kelas,
            sudahDiikuti: false,

            guru_photo: kelas.teacher?.photo_profile
                ? `${import.meta.env.VITE_API_URL}api/uploads/photo-profile/${kelas.teacher.photo_profile}`
                : null,
        }));
    } catch (err) {
        console.error("fetchSemuaKelas error:", err);
        toast.add({
            severity: "error",
            summary: "Failed",
            detail: "Unable to retrieve classroom",
            life: 3000,
        });
        return [];
    }
};

// Ambil kelas yang diikuti user
const fetchKelasYangDiikuti = async () => {
    try {
        const res = await api.get("/kelas/followed/me");
        return res.data.map((k) => k.kelas_id);
    } catch (err) {
        return [];
    }
};

// Ikuti kelas
const ikutiKelas = async (kelasId) => {
    try {
        await api.post(`/kelas/follow/${kelasId}`, {
            user_id: userId.value,
            kelas_id: kelasId,
        });

        toast.add({
            severity: "success",
            summary: "Success",
            detail: "You have started joining the Classroom.",
            life: 2000,
        });

        const index = kelasLainnya.value.findIndex((k) => k.id === kelasId);
        if (index !== -1) {
            const kelas = kelasLainnya.value[index];
            kelas.sudahDiikuti = true;
            kelasDiikuti.value.push(kelas);
            kelasLainnya.value.splice(index, 1);
        }
    } catch (err) {
        toast.add({
            severity: "warn",
            summary: "Failed",
            detail: "You have already joined this class.",
            life: 3000,
        });
    }
};

// Batal ikuti kelas
const batalIkutiKelas = async (kelasId) => {
    try {
        await api.delete(`/kelas/unfollow/${kelasId}`, {
            data: { user_id: userId.value, kelas_id: kelasId },
        });

        toast.add({
            severity: "info",
            summary: "Success",
            detail: "Class has been unfollowed.",
            life: 2000,
        });

        const index = kelasDiikuti.value.findIndex((k) => k.id === kelasId);
        if (index !== -1) {
            const kelas = kelasDiikuti.value[index];
            kelas.sudahDiikuti = false;
            kelasLainnya.value.push(kelas);
            kelasDiikuti.value.splice(index, 1);
        }
    } catch (err) {
        toast.add({
            severity: "error",
            summary: "Failed",
            detail: "Failed to unfollow the class",
            life: 3000,
        });
    }
};

// search engine
const search = (event) => {
    const query = event.query ? event.query.toLowerCase() : "";
    const semuaKelas = [...kelasDiikuti.value, ...kelasLainnya.value];

    // Filter berdasarkan nama mapel atau nama rombel
    filteredClass.value = semuaKelas
        .filter((kelas) => {
            const mapel = kelas.nama_mapel?.toLowerCase() || "";
            const grade = kelas.rombel?.grade_lvl?.toLowerCase() || "";
            const rombel = kelas.rombel?.name_rombel?.toLowerCase() || "";
            const guru = kelas.teacher?.username?.toLowerCase() || "";
            return (
                mapel.includes(query) ||
                grade.includes(query) ||
                rombel.includes(query) ||
                guru.includes(query)
            );
        })
        .map((kelas) => ({
            name: `${kelas.nama_mapel} - ${kelas.rombel?.grade_lvl || ""} ${kelas.rombel?.major} ${kelas.rombel?.name_rombel || ""}`,
            id: kelas.id,
        }));
};

//update hasil pencarian
watch(selectedClass, (newVal) => {
    if (newVal && newVal.id) {
        const semuaKelas = [...kelasDiikuti.value, ...kelasLainnya.value];
        const hasil = semuaKelas.find((k) => k.id === newVal.id);
        kelasHasilPencarian.value = hasil || null;
    } else {
        kelasHasilPencarian.value = null;
    }
});

// Ambil detail guru (untuk dialog)
const fetchGuruById = async (guruId) => {
    try {
        const res = await api.get(`/auth/teacher/${guruId}`);
        profile.value = res.data;
        src.value = profile.value.id
            ? `${import.meta.env.VITE_API_URL}api/uploads/photo-profile/${profile.value.id}?t=${Date.now()}`
            : null;
        visible.value = true;
    } catch (error) {
        console.error("Error fetch teacher profile by ID:", error);
        toast.add({
            severity: "error",
            summary: "Failed",
            detail: "Unable to retrieve teacher profile",
            life: 3000,
        });
    }
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
                                class="w-full h-32 object-cover" />
                            <div @click="fetchGuruById(kelasHasilPencarian.guru_id)"
                                class="absolute bottom-[-1.5rem] right-4 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-white shadow cursor-pointer">
                                <img v-if="kelasHasilPencarian.guru_photo" :src="kelasHasilPencarian.guru_photo"
                                    alt="Photo Profile" class="w-full h-full object-cover" />
                                <i v-else class="pi pi-user text-gray-500" style="font-size: 1.5rem"></i>
                            </div>
                        </div>
                    </template>

                    <template #title>{{ kelasHasilPencarian.nama_mapel }}</template>
                    <template #subtitle>
                        <div class="flex justify-between">
                            <div class="">
                                {{ kelasHasilPencarian.rombel?.grade_lvl || "" }}
                                {{ kelasHasilPencarian.rombel?.major || "" }}
                                {{ kelasHasilPencarian.rombel?.name_rombel || "" }}
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
            <div v-if="isLoading" class="flex justify-center py-10">
                <ProgressSpinner />
            </div>

            <div v-else-if="kelasDiikuti.length === 0" class="text-center text-gray-400 mb-8">
                You are not enrolled in any classes yet.
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card v-for="kelas in kelasDiikuti" :key="kelas.id" class="w-full overflow-hidden">
                    <template #header>
                        <div class="relative">
                            <img :src="kelas.link_wallpaper_kelas || 'https://primefaces.org/cdn/primevue/images/usercard.png'"
                                class="w-full h-32 object-cover" />
                            <div @click="fetchGuruById(kelas.teacher?.id)"
                                class="absolute bottom-[-1.5rem] right-4 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-white shadow cursor-pointer">
                                <img v-if="kelas.guru_photo" :src="kelas.guru_photo" alt="Photo Profile"
                                    class="w-full h-full object-cover" />
                                <i v-else class="pi pi-user text-gray-500" style="font-size: 1.5rem"></i>
                            </div>
                        </div>
                    </template>

                    <template #title>{{ kelas.nama_mapel }}</template>
                    <template #subtitle>
                        {{ kelas.rombel?.grade_lvl || "" }} {{ kelas.rombel?.major }} {{ kelas.rombel?.name_rombel || ""
                        }}

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
                                class="w-full h-32 object-cover" />
                            <div @click="fetchGuruById(kelas.teacher?.id)"
                                class="absolute bottom-[-1.5rem] right-4 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-white shadow cursor-pointer">
                                <img v-if="kelas.guru_photo" :src="kelas.guru_photo" alt="Photo Profile"
                                    class="w-full h-full object-cover" />
                                <i v-else class="pi pi-user text-gray-500" style="font-size: 1.5rem"></i>
                            </div>
                        </div>
                    </template>

                    <template #title>{{ kelas.nama_mapel }}</template>
                    <template #subtitle>
                        <div class="flex justify-between">
                            <div class="">
                                {{ kelas.rombel?.grade_lvl }} {{ kelas.rombel?.major }} {{ kelas.rombel?.name_rombel }}
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
                <img v-if="src" :src="src" alt="Photo Profile" class="w-full h-full object-cover" />
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