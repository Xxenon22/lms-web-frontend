<script setup>
import api from '../../services/api';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const studentList = ref([])
const kelasId = route.params.kelasId
const currentAssignmentId = route.params.assignmentId
const photoKey = ref(Date.now());


// daftar materi di kelas ini
const materiKelas = ref([])

const fetchMateriKelas = async () => {
    try {
        const res = await api.get(`/module-pembelajaran/kelas/${kelasId}`)
        const data = Array.isArray(res.data) ? res.data : []
        materiKelas.value = data.map(m => Number(m.id))
    } catch (err) {
        console.error("Error Fetch materi kelas :", err)
    }
}

const fetchStudentList = async () => {
    try {
        // Ambil daftar siswa
        const { data: students } = await api.get(`/kelas/students/${kelasId}`)

        // Ambil jawaban siswa untuk assignment ini (semua siswa)
        const { data: jawabanList } = await api.get(`/jawaban-siswa/all`, {
            params: { bank_soal_id: currentAssignmentId }
        })

        const updatedList = []
        for (const student of students) {
            // Ambil progress siswa
            const { data: progresList } = await api.get(`/progress-materi/${student.user_id}`)
            const progresKelas = progresList.filter(p =>
                materiKelas.value.includes(Number(p.materi_id))
            )
            const hasProgress = progresKelas.length > 0 && progresKelas.every(p => p.status_selesai === true)

            // Cek jawaban assignment
            const jawabanSiswa = jawabanList.find(j => j.user_id === student.user_id)
            const hasJawaban = !!jawabanSiswa

            updatedList.push({
                ...student,
                status: hasProgress && hasJawaban ? "Completed" : "Not Completed",
                assignmentId: jawabanSiswa?.bank_soal_id || null,
                nilai: jawabanSiswa?.nilai || null,
                photo_profile: student.id
                    ? `${import.meta.env.VITE_API_URL}api/uploads/photo-profile/${student.id}`
                    : null
            })
        }

        studentList.value = updatedList
    } catch (err) {
        console.error("Error fetching student list:", err)
    }
}

const back = () => {
    router.back()
}

onMounted(async () => {
    await fetchMateriKelas()
    await fetchStudentList()
})
</script>

<template>
    <div class="m-5 flex justify-between">
        <Button icon="pi pi-arrow-left" label="Back" @click="back" />
    </div>
    <div class="space-y-3 m-10">
        <Card v-for="student in studentList" :key="student.id">
            <template #content>
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <div
                            class="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
                            <Image v-if="student.photo_profiles_user" :src="student.photo_profiles_user" image=""
                                shape="circle" />
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
