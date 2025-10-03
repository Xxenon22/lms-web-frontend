<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../services/api' // axios instance
import { useToast } from 'primevue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isSubmitting = ref(false)
const hasChanges = ref(false)
const initialNilai = ref(null)

// Ambil params dari URL
const userId = route.params.userId
const assignmentId = route.params.assignmentId

// State jawaban
const loading = ref(true)
const errorMessage = ref(null)
const jawabanPilgan = ref([])
const jawabanEssai = ref([])
const jawabanRefleksi = ref(null)
const nilai = ref(null)

// Helper untuk URL gambar (backend Express)
function getImageUrl(filename) {
    if (!filename) return null
    return `${import.meta.env.VITE_API_URL}/uploads/gambar-soal/${filename}`
}

// Ambil jawaban siswa by userId + assignmentId
const fetchJawabanSiswa = async () => {
    if (!userId || !assignmentId) {
        errorMessage.value = 'Parameter userId atau assignmentId tidak ditemukan.'
        loading.value = false
        return
    }

    try {
        const res = await api.get('/jawaban-siswa/all-with-soal', {
            params: { bank_soal_id: assignmentId }
        })

        const data = res.data.filter(item => item.user_id === Number(userId))
        if (!data.length) {
            loading.value = false
            return
        }

        jawabanPilgan.value = data
            .filter(item => item.pertanyaan && item.jawaban !== undefined)
            .map((item, idx) => ({
                id: item.jawaban_id,
                nomor: idx + 1,
                jawaban: item.jawaban,
                benar: item.jawaban?.toUpperCase() === item.kunci_jawaban?.toUpperCase(),
                soal: {
                    pertanyaan: item.pertanyaan,
                    pg_a: item.pg_a,
                    pg_b: item.pg_b,
                    pg_c: item.pg_c,
                    pg_d: item.pg_d,
                    pg_e: item.pg_e,
                    kunci_jawaban: item.kunci_jawaban,
                    gambar: getImageUrl(item.gambar)
                }
            }));

        jawabanEssai.value = data
            .filter(item => item.pertanyaan_essai)
            .map((item, idx) => ({
                id: item.jawaban_id,
                nomor: idx + 1,
                jawaban_essai: item.jawaban_essai,
                refleksi_siswa: item.refleksi_siswa,
                soal: {
                    pertanyaan_essai: item.pertanyaan_essai,
                    gambar_soal_essai: getImageUrl(item.gambar_soal_essai)
                }
            }));

        jawabanRefleksi.value = data[0]?.refleksi_siswa || null;

    } catch (err) {
        console.error("Error fetch jawaban siswa:", err)
        errorMessage.value = 'Gagal mengambil data jawaban.'
    }
    loading.value = false
}

// Ambil nilai
const fetchNilai = async () => {
    try {
        const res = await api.get('/jawaban-siswa/all-with-soal', {
            params: { bank_soal_id: assignmentId }
        })

        // Ambil jawaban siswa untuk user ini
        const data = res.data.filter(item => item.user_id === Number(userId))

        // Ambil nilai, ambil nilai pertama yang ada
        const itemWithNilai = data.find(d => d.nilai !== null)
        nilai.value = itemWithNilai?.nilai ?? null
        initialNilai.value = itemWithNilai?.nilai ?? null
    } catch (err) {
        console.error('Fetch Nilai:', err)
    }
}


// Watch perubahan nilai untuk aktifkan button
watch(nilai, () => {
    hasChanges.value = nilai.value !== initialNilai.value
})

// Submit nilai
const submitNilai = async () => {
    if (isSubmitting.value || !hasChanges.value) return

    if (!nilai.value) {
        toast.add({ severity: 'warn', detail: 'Please fill out score', life: 3000 })
        return
    }

    isSubmitting.value = true

    try {
        await api.put('/jawaban-siswa/nilai', {
            user_id: userId,
            bank_soal_id: assignmentId,
            nilai: nilai.value
        })
        toast.add({ severity: 'success', detail: 'Score submitted', life: 3000 })
        initialNilai.value = nilai.value
        hasChanges.value = false
    } catch (err) {
        console.error('Submit Nilai error:', err)
        toast.add({ severity: 'error', detail: 'Failed to submit score', life: 3000 })
    }
    isSubmitting.value = false
}

const back = () => router.back()

onMounted(async () => {
    await fetchJawabanSiswa()
    await fetchNilai()
})

// Option helper
function optionClass(item, option) {
    if (item.jawaban?.toUpperCase() === option) {
        return item.benar ? 'bg-green-200 p-1 rounded' : 'bg-red-200 p-1 rounded'
    }
    return ''
}

function getCorrectAnswerText(item) {
    if (!item.soal.kunci_jawaban) return ''
    const key = item.soal.kunci_jawaban.toUpperCase()
    const field = `pg_${key.toLowerCase()}`
    const text = item.soal[field] || ''
    return `${key}. ${text}`
}

const summaryPilgan = computed(() => {
    const total = jawabanPilgan.value.length
    const benar = jawabanPilgan.value.filter(item => item.benar).length
    return { benar, total }
})
</script>

<template>
    <div class="mb-5">
        <Button icon="pi pi-arrow-left" label="Back" @click="back" />
    </div>

    <div v-if="loading">Loading...</div>
    <div v-else-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>

    <div v-else class="space-y-4">
        <!-- Multiple Choice -->
        <Card v-for="item in jawabanPilgan" :key="item.nomor">
            <template #content>
                <div class="mb-5">
                    <Tag value="Multiple Choice" severity="success" />
                </div>
                <div class="mb-2 flex items-center space-x-2">
                    <Tag :value="`${item.nomor}`" severity="info" />
                    <span class="font-bold overflow-auto break-all" v-html="item.soal.pertanyaan"></span>
                </div>

                <div v-if="item.soal.gambar" class="mb-3 flex justify-center">
                    <Image :src="item.soal.gambar" alt="Gambar Soal" image-class="w-64 h-auto rounded" />
                </div>

                <ul class="space-y-1">
                    <li :class="optionClass(item, 'A')">A. {{ item.soal.pg_a }}</li>
                    <li :class="optionClass(item, 'B')">B. {{ item.soal.pg_b }}</li>
                    <li :class="optionClass(item, 'C')">C. {{ item.soal.pg_c }}</li>
                    <li :class="optionClass(item, 'D')">D. {{ item.soal.pg_d }}</li>
                    <li :class="optionClass(item, 'E')">E. {{ item.soal.pg_e }}</li>
                </ul>

                <!-- Jawaban benar hanya muncul kalau siswa salah -->
                <div v-if="!item.benar" class="mt-2 p-2 bg-green-100 rounded">
                    <Tag severity="success" value="Correct Answer" />
                    <p class="font-bold">
                        {{ getCorrectAnswerText(item) }}
                    </p>
                </div>
            </template>
        </Card>

        <!-- Essay -->
        <Card v-for="essai in jawabanEssai" :key="essai.nomor">
            <template #content>
                <div class="mb-5">
                    <Tag value="Essay" severity="success" />
                </div>
                <div class="mb-2 flex items-center space-x-2">
                    <Tag :value="`${essai.nomor}`" severity="info" />
                    <span class="font-bold overflow-auto break-all" v-html="essai.soal.pertanyaan_essai"></span>
                </div>
                <div v-if="essai.soal.gambar_soal_essai" class="mb-3 flex justify-center">
                    <Image :src="essai.soal.gambar_soal_essai" alt="Gambar Soal" image-class="w-64 h-auto rounded" />
                </div>
                <div>
                    <p>{{ essai.jawaban_essai }}</p>
                </div>
            </template>
        </Card>

        <!-- Reflection -->
        <Card v-if="jawabanRefleksi">
            <template #header>
                <div class="m-5">
                    <h1 class="font-bold">Student Reflection</h1>
                </div>
            </template>
            <template #content>
                <div class="m-5">
                    <p>{{ jawabanRefleksi }}</p>
                </div>
            </template>
        </Card>

        <div v-if="jawabanPilgan.length" class="mb-5 p-3 bg-blue-100 rounded text-center font-bold">
            Correct {{ summaryPilgan.benar }} out of {{ summaryPilgan.total }} Questions
        </div>

        <!-- Score input -->
        <div class="mt-10 space-y-2">
            <FloatLabel>
                <InputNumber v-model="nilai" />
                <label for="nilai">Score</label>
            </FloatLabel>
            <Button label="Submit Score" @click="submitNilai" :disabled="!hasChanges || isSubmitting" />
        </div>
    </div>

    <Toast />
</template>
