<script setup>
import api from '../../services/api'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const studentList = ref([])
const loading = ref(false)

const kelasId = route.params.kelasId
const bankSoalId = route.params.bankSoalId

// =========================
// FETCH STUDENT + PROGRESS + JAWABAN
// =========================
const fetchStudentList = async () => {
    try {
        loading.value = true

        // 1️⃣ Ambil siswa kelas
        const { data: students } = await api.get(`/kelas/students/${kelasId}`)

        // 2️⃣ Ambil SEMUA jawaban untuk assignment ini
        let jawabanList = []
        if (bankSoalId) {
            const res = await api.get(`/jawaban-siswa/all`, {
                params: { bank_soal_id: bankSoalId }
            })
            jawabanList = res.data || []
        }

        // 3️⃣ Mapping FINAL (INI KUNCI UTAMA)
        studentList.value = students.map(student => {
            const jawabanUser = jawabanList.find(
                j => j.user_id === student.user_id
            )

            const isCompleted = !!jawabanUser   // 🔥 LOGIC BENAR

            return {
                ...student,
                status: isCompleted ? 'Completed' : 'Not Completed',
                bankSoalId: jawabanUser?.bank_soal_id ?? bankSoalId,
                nilai: jawabanUser?.nilai ?? null,
                user_photo: student.photo_url
                    ? `${import.meta.env.VITE_API_URL}${student.photo_url}?v=${Date.now()}`
                    : null
            }
        })
    } catch (err) {
        console.error('Error fetch student list:', err)
    } finally {
        loading.value = false
    }
}

try {
    loading.value = true

    // 1️⃣ Ambil siswa kelas
    const { data: students } = await api.get(`/kelas/students/${kelasId}`)

    // 2️⃣ Ambil progress per siswa
    const progressMap = {}

    for (const student of students) {
        const { data } = await api.get(`/progress-materi/${student.user_id}`)
        progressMap[student.user_id] = data || []
    }

    // 3️⃣ Ambil jawaban assignment (opsional)
    let jawabanList = []
    if (bankSoalId) {
        const res = await api.get(`/jawaban-siswa/all`, {
            params: { bank_soal_id: bankSoalId }
        })
        jawabanList = res.data || []
    }

    // 4️⃣ Mapping final
    studentList.value = students.map(student => {
        const progressUser = progressMap[student.user_id] || []

        const isCompleted =
            progressUser.length > 0 &&
            progressUser.every(p => p.status_selesai === true)

        const jawaban = jawabanList.find(
            j => j.user_id === student.user_id
        )

        return {
            ...student,
            status: isCompleted ? 'Completed' : 'Not Completed',
            bankSoalId: jawaban?.bank_soal_id ?? null,
            nilai: jawaban?.nilai ?? null,
            user_photo: student.photo_url
                ? `${import.meta.env.VITE_API_URL}${student.photo_url}?v=${Date.now()}`
                : null
        }
    })
} catch (err) {
    console.error('Error fetch student list:', err)
} finally {
    loading.value = false
}


// =========================
// NAVIGATION
// =========================
const back = () => router.back()

// =========================
// MOUNTED
// =========================
onMounted(fetchStudentList)
</script>

<template>
    <div class="m-5 flex justify-between">
        <Button icon="pi pi-arrow-left" label="Back" @click="back" />
    </div>

    <div class="space-y-3 m-10">
        <div v-if="loading" class="flex justify-center h-64">
            <ProgressSpinner />
        </div>

        <Card v-for="student in studentList" :key="student.user_id">
            <template #content>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                            <img v-if="student.user_photo" :src="student.user_photo"
                                class="w-full h-full object-cover" />
                            <i v-else class="pi pi-user text-gray-500 text-xl" />
                        </div>
                        <span>{{ student.name }}</span>
                    </div>

                    <div class="flex gap-3">
                        <Tag :severity="student.status === 'Completed' ? 'success' : 'danger'"
                            :value="student.status === 'Completed' ? 'Task Completed' : 'Not Completed'" />
                        <Tag v-if="student.status === 'Completed' && student.nilai !== null" severity="secondary"
                            :value="`${student.nilai} / 100`" />
                    </div>

                    <router-link v-if="student.status === 'Completed'"
                        :to="{ name: 'Assignment-Review', params: { userId: student.user_id, bankSoalId: student.bankSoalId } }">
                        <Button label="Review" outlined />
                    </router-link>

                    <Button v-else label="Review" outlined disabled style="cursor: not-allowed" />
                </div>
            </template>
        </Card>
    </div>
</template>
