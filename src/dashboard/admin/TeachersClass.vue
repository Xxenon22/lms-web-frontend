<script setup>
import api from "../../services/api";
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useRoute, useRouter } from "vue-router";
import { useToast, Toast } from "primevue";

const kelas = ref([])
const isLoading = ref(true);
const subject = ref([]);
const gradeLvl = ref([]);
const guru = ref([]);
const route = useRoute();
const router = useRouter();
const kelasId = route.params.kelasId;

const fetchRuangKelas = async () => {
    try {
        const res = await api.get(`/kelas/admin/${kelasId}`)
        kelas.value = res.data
    } catch (error) {
        console.error("Fetch Class:", error)
    }
};

const fetchGuru = async () => {
    try {
        const res = await api.get(`/auth/teacher/${kelasId}`)
        guru.value = res.data
    } catch (error) {
        console.error("Fetch teacher:", error)
    }
}

const fetchDataSubject = async () => {
    try {
        const res = await api.get("/mapel")
        subject.value = res.data;
    } catch (err) {
        console.error("Fetch Subject:", err)
    }
}

const fetchDataGradeLevel = async () => {
    try {
        const res = await api.get("/rombel")
        gradeLvl.value = res.data
    } catch (err) {
        console.error("Fetch Grade Level:", err)
    }
}
const back = () => router.back();


onMounted(async () => {
    // await fetchUserid(); // ambil user ID dulu
    await fetchDataSubject();
    await fetchDataGradeLevel();
    await fetchGuru();
    const data = await fetchRuangKelas();
    if (data) kelas.value = data;
    isLoading.value = false;
});
</script>

<template>
    <section class="header m-10 flex items-center gap-3">
        <Button label="Back" icon="pi pi-chevron-left" @click="back" />
    </section>
    <section class="flex flex-col m-10">
        <div class="flex justify-between mb-5">
            <div class="flex flex-col ml-10">
                <h1 class="text-3xl font-semibold">Classroom</h1>
                <p class="text-sm text-gray-500">All your class</p>
            </div>
            <div class="flex flex-col ml-10 items-end" v-if="guru">
                <h1 class="text-3xl font-semibold">{{ guru.username }}</h1>
                <p class="text-sm text-gray-500">{{ guru.teacher_subject }}</p>
            </div>
        </div>

        <div v-if="isLoading" class="flex justify-center py-10">
            <ProgressSpinner />
        </div>

        <div v-else-if="kelas.length === 0" class="text-center text-gray-400 mb-8">
            You have not created a class yet.
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card v-for="kls in kelas" class="w-full overflow-hidden m-5">
                <template #header>
                    <div class="relative">
                        <img :src="kls.link_wallpaper_kelas || '/wallpapers/w1.jpg'" class="w-full h-40 object-cover" />
                    </div>
                </template>
                <template #title>{{ kls.nama_mapel }}</template>
                <template #subtitle>
                    <!-- COLLAB CLASS -->
                    <span v-if="kls.colab_class">
                        Collab Class • {{ kls.colab_class }}
                    </span>

                    <!-- REGULAR CLASS -->
                    <span v-else>
                        {{ kls.grade_lvl }} {{ kls.major }} {{ kls.name_rombel }}
                    </span>
                </template>
                <template #footer>
                    <div class="flex gap-4 mt-1">
                        <router-link :to="{ name: 'Teacher-Assignment', params: { kelasId: kls.id } }" class="w-full">
                            <Button label="Assignment List" severity="secondary" outlined class="w-full" />
                        </router-link>
                        <!-- <router-link :to="{ path: `/enter-to-the-class/${kls.id}` }" class="w-full">
                            <Button label="Access Class" class="w-full button-join" />
                        </router-link> -->
                    </div>
                </template>
            </Card>
        </div>
    </section>
    <Toast />
</template>

<style scoped>
:deep(.button-join) {
    /* background: transparent !important; */
    border: none !important;
    /* box-shadow: none !important; */
}

.button-join {
    background-color: #0D7474;
    /* border-radius: 15px; */
}
</style>
