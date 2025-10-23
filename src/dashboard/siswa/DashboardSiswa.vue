<script setup>
import api from "../../services/api";
import { onMounted, ref, watch } from "vue";
import { useToast } from "primevue/usetoast";
import { useRoute } from "vue-router";

const toast = useToast();
const kelasDiikuti = ref([]);
const kelasLainnya = ref([]);
const userId = ref(null);
const selectedClass = ref("");
const filteredClass = ref([]);
const kelasHasilPencarian = ref(null);
const isLoading = ref(true);
const visible = ref(false);
const src = ref(null)
const profile = ref([])


// Utility untuk format profile + wallpaper jadi URL penuh
// const formatKelas = (kelas) => {
//     return {
//         ...kelas,
//         profiles: kelas.profiles
//             ? {
//                 ...kelas.profiles,
//                 photo_profiles_user: kelas.profiles.photo_profiles_user
//                     ? `${import.meta.env.VITE_API_URL}${kelas.profiles.photo_profiles_user}`
//                     : null,
//             }
//             : null,
//     };
// };

// Lifecycle
onMounted(async () => {
    userId.value = localStorage.getItem("id");

    const semuaKelas = await fetchSemuaKelas();
    const idKelasIkut = await fetchKelasYangDiikuti();

    semuaKelas.forEach((k) => {
        k.sudahDiikuti = idKelasIkut.includes(k.id);
    });

    kelasDiikuti.value = semuaKelas.filter((k) => k.sudahDiikuti);
    kelasLainnya.value = semuaKelas.filter((k) => !k.sudahDiikuti);
    isLoading.value = false;
});

// Ambil semua kelas
const fetchSemuaKelas = async () => {
    try {
        const res = await api.get("/kelas/all/list");

        return res.data.map(kelas => ({
            id: kelas.id,
            nama_mapel: kelas.nama_mapel,
            guru_id: kelas.guru_id,
            guru_name: kelas.teacher?.username || "Unknown Teacher",
            guruPhoto: kelas.teacher?.photo_profiles_user
                ? `${import.meta.env.VITE_API_URL}${kelas.teacher.photo_profiles_user}`
                : null,
            grade_lvl: kelas.rombel?.grade_lvl || "-",
            name_rombel: kelas.rombel?.name_rombel || "-",
            link_wallpaper_kelas: kelas.link_wallpaper_kelas
                ? `${import.meta.env.VITE_API_URL}${kelas.link_wallpaper_kelas}`
                : "/wallpapers/default.jpg",
        }));
    } catch (err) {
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

// Search kelas
const search = (event) => {
    const query = event.query.toLowerCase();
    const semuaKelas = [...kelasDiikuti.value, ...kelasLainnya.value];

    filteredClass.value = semuaKelas
        .filter((kelas) =>
            kelas.nama_mapel.toLowerCase().includes(query)
        )
        .map((kelas) => ({
            name: `${kelas.nama_mapel} - ${kelas.grade_lvl} ${kelas.name_rombel}`,
            id: kelas.id,
        }));
};


watch(selectedClass, (newVal) => {
    if (newVal && newVal.id) {
        const semuaKelas = [...kelasDiikuti.value, ...kelasLainnya.value];
        const hasil = semuaKelas.find((k) => k.id === newVal.id);
        if (hasil) {
            kelasHasilPencarian.value = hasil;
        }
    } else {
        kelasHasilPencarian.value = null;
    }
});

const fetchGuruById = async (guruId) => {
    try {
        const res = await api.get(`/auth/teacher/${guruId}`);
        profile.value = res.data;
        src.value = profile.value.photo_profiles_user
            ? `${import.meta.env.VITE_API_URL}${profile.value.photo_profiles_user}`
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
    <section class="flex flex-col">
        <div class="searching flex justify-end">
            <AutoComplete v-model="selectedClass" optionLabel="name" placeholder="🔍 Find your class here..."
                :suggestions="filteredClass" @complete="search" />
        </div>

        <!-- Hasil Pencarian -->
        <div v-if="kelasHasilPencarian">
            <div class="m-5">
                <h1 class="text-xl font-bold">Search Result</h1>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card :key="kelasHasilPencarian.id" class="w-full overflow-hidden">
                    <template #header>
                        <div class="relative">
                            <img :src="kelasHasilPencarian.link_wallpaper_kelas || '/wallpapers/w1.jpg'"
                                class="w-full h-32 object-cover" />
                            <div @click="fetchGuruById(kelasHasilPencarian.guru_id)"
                                class="absolute bottom-[-1.5rem] right-4 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-white shadow cursor-pointer">
                                <img v-if="kelasHasilPencarian.guruPhoto" :src="kelasHasilPencarian.guruPhoto"
                                    alt="Photo Profile" class="w-full h-full object-cover" />
                                <i v-else class="pi pi-user text-gray-500" style="font-size: 1.5rem;"></i>
                            </div>

                        </div>
                    </template>
                    <template #title>{{ kelasHasilPencarian.nama_mapel }}</template>
                    <template #subtitle>
                        {{ kelasHasilPencarian.grade_lvl }} {{
                            kelasHasilPencarian.name_rombel }}
                    </template>
                    <template #footer>
                        <div class="flex gap-4 mt-1">
                            <RouterLink v-if="kelasHasilPencarian.sudahDiikuti"
                                :to="{ name: 'Join-Class', params: { id: kelasHasilPencarian.id } }">
                                <Button label="Join" class="w-full" />
                            </RouterLink>
                            <Button v-if="kelasHasilPencarian.sudahDiikuti" icon="pi pi-check" label="Following"
                                v-tooltip.bottom="'Following a Class'" outlined severity="secondary" class="w-full"
                                @click="batalIkutiKelas(kelasHasilPencarian.id)" />
                            <Button v-else label="Follow" outlined severity="secondary" class="w-full"
                                @click="ikutiKelas(kelasHasilPencarian.id)" />
                        </div>
                    </template>
                </Card>
            </div>
        </div>
        <div class="m-5">
            <h1 class="text-xl font-bold">Joined Classes</h1>
        </div>

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
                        <div @click="fetchGuruById(kelas.guru_id)"
                            class="absolute bottom-[-1.5rem] right-4 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-white shadow cursor-pointer">
                            <img v-if="profile.photo_profiles_user" :src="src" alt="Photo Profile"
                                class="w-full h-full object-cover" />
                            <i v-else class="pi pi-user text-gray-500" style="font-size: 1.5rem;"></i>
                        </div>
                    </div>
                </template>

                <template #title>
                    <span>{{ kelas.nama_mapel }}</span>
                </template>
                <template #subtitle>
                    {{ kelas.grade_lvl }} {{ kelas.name_rombel }}
                </template>
                <template #footer>
                    <div class="flex justify-center gap-4 mt-1">
                        <RouterLink :to="{ name: 'Join-Class', params: { id: kelas.id } }">
                            <Button label="Join" class="w-full" />
                        </RouterLink>
                        <Button icon="pi pi-check" label="Following" v-tooltip.bottom="'Following a Class'" outlined
                            severity="secondary" class="w-full" @click="batalIkutiKelas(kelas.id)" />
                    </div>
                </template>
            </Card>
        </div>

    </section>

    <!-- Daftar Kelas Lainnya -->
    <section class="flex flex-col mt-12">
        <div class="m-5">
            <h1 class="text-xl font-bold">Other Classroom</h1>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card v-for="kelas in kelasLainnya" :key="kelas.id" class="w-full overflow-hidden">
                <template #header>
                    <div class="relative">
                        <img :src="kelas.link_wallpaper_kelas || 'https://primefaces.org/cdn/primevue/images/usercard.png'"
                            class="w-full h-32 object-cover" />
                        <div @click="fetchGuruById(kelas.guru_id)"
                            class="absolute bottom-[-1.5rem] right-4 w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-white shadow cursor-pointer">
                            <img v-if="profile.photo_profiles_user" :src="src" alt="Photo Profile"
                                class="w-full h-full object-cover" />
                            <i v-else class="pi pi-user text-gray-500" style="font-size: 1.5rem;"></i>
                        </div>
                    </div>
                </template>
                <template #title>{{ kelas.nama_mapel }}</template>
                <template #subtitle>
                    {{ kelas.grade_lvl }} {{ kelas.name_rombel }}
                </template>
                <template #footer>
                    <div class="flex gap-4 mt-1">
                        <Button :label="kelas.sudahDiikuti ? 'Following' : 'Follow'" severity="secondary" outlined
                            class="w-full" :disabled="kelas.sudahDiikuti" @click="ikutiKelas(kelas.id)" />
                    </div>
                </template>
            </Card>
        </div>
    </section>

    <Dialog v-model:visible="visible" modal :header="'Teachers Profile'" :style="{ width: '40vw' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">

        <div v-if="profile" class="flex flex-col items-center gap-4">
            <div
                class="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-white shadow">
                <img v-if="profile.photo_profiles_user" :src="src" alt="Photo Profile"
                    class="w-full h-full object-cover" />
                <i v-else class="pi pi-user text-gray-500" style="font-size: 3.5rem;"></i>
            </div>
            <h2 class="text-xl font-semibold">{{ profile.username || 'Name not Available' }}</h2>
            <p class="text-gray-600">{{ profile.phone_number || 'Phone number not Available' }}</p>
            <p class="text-gray-500">{{ profile.teacher_subject || 'Subject not Available' }}</p>
        </div>
    </Dialog>

    <Toast />
</template>
