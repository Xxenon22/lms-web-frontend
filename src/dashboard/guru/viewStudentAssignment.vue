<script setup>
import api from '../../services/api';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()

const studentList = ref([])
const materiKelas = ref([])
const loading = ref(false)

const kelasId = route.params.kelasId
const currentAssignmentId = route.params.assignmentId

// =========================
// FETCH MATERI KELAS
// =========================
const fetchMateriKelas = async () => {
    try {
        const res = await api.get(`/module-pembelajaran/kelas/${kelasId}`)
        const data = Array.isArray(res.data) ? res.data : []
        materiKelas.value = data.map(m => Number(m.id))
    } catch (err) {
        console.error("Error Fetch materi kelas :", err)
    }
}

// =========================
// FETCH STUDENT LIST
// =========================
const fetchStudentList = async () => {
    try {
        // 1️⃣ SELALU ambil murid kelas
        const { data: students } = await api.get(`/kelas/students/${kelasId}`)

        // 2️⃣ Jawaban assignment → OPSIONAL
        let jawabanList = []
        if (currentAssignmentId) {
            const res = await api.get(`/jawaban-siswa/all`, {
                params: { bank_soal_id: currentAssignmentId }
            })
            jawabanList = res.data || []
        }

        const updatedList = []

        for (const student of students) {
            // 3️⃣ Progress materi
            const { data: progresList } = await api.get(
                `/progress-materi/${student.user_id}`
            )

            const progresKelas = progresList.filter(p =>
                materiKelas.value.includes(Number(p.materi_id))
            )

            const hasProgress =
                progresKelas.length > 0 &&
                progresKelas.every(p => p.status_selesai === true)

            // 4️⃣ Jawaban siswa (boleh null)
            const jawabanSiswa = jawabanList.find(
                j => j.user_id === student.user_id
            )

            updatedList.push({
                ...student,
                status:
                    currentAssignmentId && hasProgress && jawabanSiswa
                        ? "Completed"
                        : "Not Completed",
                assignmentId: jawabanSiswa?.bank_soal_id || null,
                nilai: jawabanSiswa?.nilai || null,
                user_photo: student.photo_url
                    ? `${import.meta.env.VITE_API_URL}${student.photo_url}?v=${Date.now()}`
                    : null
            })
        }

        studentList.value = updatedList
    } catch (err) {
        console.error("Error fetching student list:", err)
    } finally {
        loading.value = false
    }
}

// =========================
// NAVIGATION
// =========================
const back = () => {
    router.back()
}

// =========================
// MOUNTED
// =========================
onMounted(async () => {
    loading.value = true
    await fetchMateriKelas()
    await fetchStudentList()
})

</script>

<template>
    <div class="m-5 flex justify-between">
        <Button icon="pi pi-arrow-left" label="Back" @click="back" />
    </div>
    <div class="space-y-3 m-10">
        <div v-if="loading" class="flex justify-center items-center h-64">
            <ProgressSpinner />
        </div>
        <Card v-for="student in studentList" :key="student.id">
            <template #content>
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <div
                            class="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
                            <img v-if="student.user_photo" :src="student.user_photo"
                                class="w-full h-full object-cover" />
                            <i v-else class="pi pi-user text-gray-500 text-xl"></i>
                        </div>
                        <span>{{ student.name }}</span>
                    </div>
                    <div class="space-x-5">
                        <Tag :severity="student.status === 'Completed' ? 'success' : 'danger'"
                            :value="student.status === 'Completed' ? 'Task Completed' : 'Not Completed'" />
                        <Tag v-if="student.status === 'Completed' && student.nilai !== null" severity="secondary"
                            :value="`${student.nilai} / 100`" />
                    </div>
                    <div>
                        <router-link v-if="student.assignmentId"
                            :to="{ name: 'Assignment-Review', params: { userId: student.user_id, assignmentId: student.assignmentId } }">
                            <Button label="Review" outlined :disabled="student.status !== 'Completed'" />
                        </router-link>
                        <Button v-else label="Review" outlined disabled style="cursor: not-allowed;" />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
