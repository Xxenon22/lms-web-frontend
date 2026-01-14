<script setup>
import api from '../../services/api';
import { useRoute } from 'vue-router';
import { onMounted, ref } from 'vue';
import { useToast } from 'primevue';

const route = useRoute()
const toast = useToast()

const kelasId = route.params.kelasId

const classroom = ref(null)
const modules = ref([])
const isLoading = ref(true)


const fetchClassroom = async () => {
    try {
        const res = await api.get(`/kelas/${kelasId}`)
        classroom.value = res.data
        modules.value = res.data.modules || []
        // console.log(modules.value)
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Failed to load class',
            life: 3000
        })
        console.error(err)
    } finally {
        isLoading.value = false
    }
}

const formatDate = (created_at) => {
    if (!created_at) return "Date is not available";
    return new Intl.DateTimeFormat("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Jakarta",
    }).format(new Date(created_at));
};

const formatRombel = (rombel) => {
    if (!rombel) return "Kelas Umum";

    if (rombel.type === "collab") {
        return rombel.colab_class || "Kelas Kolaborasi";
    }

    return `${rombel.grade_lvl || ""} ${rombel.major || ""} ${rombel.name_rombel || ""}`.trim();
};

onMounted(() => {
    fetchClassroom()
})

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
                <h2 class="text-lg">
                    {{ formatRombel(classroom.rombel) }}
                </h2>
            </div>
            <p>{{ classroom.guru_name }}</p>
        </div>
    </section>
    <div v-if="isLoading" class="flex justify-center py-10">
        <ProgressSpinner />
    </div>

    <div class="flex justify-center mt-10" v-else-if="modules.length === 0">
        <span>There are no questions at the moment.</span>
    </div>
    <div v-else>
        <Card class="mb-5 m-5" v-for="soal in modules" :key="soal.id">
            <template #header>
                <div class="flex m-5">
                    <Icon icon="material-symbols:assignment" width="24" height="24" class="mr-2" />
                    <span>{{ soal.judul }}</span>
                </div>
            </template>
            <template #content>
                <div class="flex items-center justify-between">
                    <div class="flex m-5">
                        <Icon icon="uiw:date" width="20" height="20" class="mr-2" />
                        <span v-tooltip.bottom="'Date of Question Creation'">{{ formatDate(soal.created_at) }}</span>
                    </div>
                    <div class="flex space-x-5">
                        <!-- <div class=""><Button icon="pi pi-check" label="Completed" severity="success" outlined /></div> -->
                        <router-link v-if="soal.bank_soal_id" :to="{
                            name: 'View-Student-Assignment',
                            params: {
                                kelasId: soal.kelas_id,
                                bankSoalId: soal.bank_soal_id
                            }
                        }">
                            <Button label="View Answer" />
                        </router-link>
                        <Button v-else label="View Answer" disabled outlined />
                    </div>
                </div>
            </template>
        </Card>
    </div>

    <Toast />
</template>