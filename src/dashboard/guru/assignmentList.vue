<script setup>
import api from '../../services/api';
import { useRouter, useRoute } from 'vue-router';
import { onMounted, ref } from 'vue';
import { useToast } from 'primevue';

const route = useRoute()
const router = useRouter()
// const soalId = route.params.id
const kelasId = route.params.kelasId
const kelas = ref({})
const soalPembelajaran = ref([])
const toast = useToast()
const isLoading = ref(true)

const fetchKelas = async () => {
    const { data, error } = await api.get(`/kelas/${kelasId}`)
    if (error) {
        console.log('cant retrieve class list :', error)
    } else {
        kelas.value = data
        soalPembelajaran.value = data.modules || []
    }
    isLoading.value = false
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

const kembali = () => {
    router.back()
}

onMounted(() => {
    // fetchSoalPembelajaran()
    fetchKelas()
})

</script>

<template>
    <div class="mb-5 flex items-center justify-between">
        <Button icon="pi pi-arrow-left" label="Back" @click="kembali" />
        <!-- <div v-for="kls in kelas" :key="kls.id" class=""> -->
        <h1>Assignment List <b>{{ kelas.grade_lvl }} {{ kelas.name_rombel }}</b></h1>
        <!-- </div> -->
    </div>

    <div v-if="isLoading" class="flex justify-center py-10">
        <ProgressSpinner />
    </div>

    <div class="flex justify-center mt-10" v-else-if="soalPembelajaran.length === 0">
        <span>There are no questions at the moment.</span>
    </div>
    <div v-else>
        <Card class="mb-5" v-for="soal in soalPembelajaran" :key="soal.id">
            <template #header>
                <div class="flex m-5">
                    <Icon icon="material-symbols:assignment" width="24" height="24" class="mr-2" />
                    <span>{{ soal.judul_penugasan }}</span>
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
                        <router-link
                            :to="{ name: 'View-Student-Assignment', params: { kelasId: soal.kelas_id, assignmentId: soal.bank_soal?.id } }">
                            <Button label="View Answer" />
                        </router-link>
                    </div>
                </div>
            </template>
        </Card>
    </div>

    <Toast />
</template>