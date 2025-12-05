<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../services/api'
import { useToast } from 'primevue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isSubmitting = ref(false)
const hasChanges = ref(false)
const initialNilai = ref(null)

const userId = route.params.userId
const assignmentId = route.params.assignmentId

// State data
const loading = ref(true)
const errorMessage = ref(null)
const jawabanPilgan = ref([])
const jawabanEssai = ref([])
const jawabanRefleksi = ref(null)
const nilai = ref(null)
const fileJawabanSiswa = ref([])

function getImageUrl(filename) {
    if (!filename) return null
    return `${import.meta.env.VITE_API_URL}/uploads/gambar-soal/${filename}`
}

const fetchJawabanSiswa = async () => {
    try {
        const res = await api.get('/jawaban-siswa/all-with-soal', {
            params: { bank_soal_id: assignmentId },
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
                    gambar: getImageUrl(item.gambar),
                },
            }))

        jawabanEssai.value = data
            .filter(item => item.pertanyaan_essai)
            .map((item, idx) => ({
                id: item.jawaban_id,
                nomor: idx + 1,
                jawaban_essai: item.jawaban_essai,
                refleksi_siswa: item.refleksi_siswa,
                soal: {
                    pertanyaan_essai: item.pertanyaan_essai,
                    gambar_soal_essai: getImageUrl(item.gambar_soal_essai),
                },
            }))

        jawabanRefleksi.value = data[0]?.refleksi_siswa || null
    } catch (err) {
        console.error('Error fetch jawaban siswa:', err)
        errorMessage.value = 'Gagal mengambil data jawaban.'
    }
    loading.value = false
}

const fetchNilai = async () => {
    try {
        const res = await api.get('/jawaban-siswa/all-with-soal', {
            params: { bank_soal_id: assignmentId },
        })
        const data = res.data.filter(item => item.user_id === Number(userId))
        const itemWithNilai = data.find(d => d.nilai !== null)
        nilai.value = itemWithNilai?.nilai ?? null
        initialNilai.value = itemWithNilai?.nilai ?? null
    } catch (err) {
        console.error('Fetch Nilai:', err)
    }
}

watch(nilai, () => {
    hasChanges.value = nilai.value !== initialNilai.value
})

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
            nilai: nilai.value,
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

function getFileUrl(filename) {
    if (!filename) return null
    return `${import.meta.env.VITE_API_URL}/uploads/file-jawaban-siswa/${filename}`
}

const fetchFileJawabanSiswa = async () => {
    try {
        const res = await api.get(`/jawaban-siswa/file/${assignmentId}`, {
            params: { user_id: userId },
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })

        fileJawabanSiswa.value = res.data
            .filter(file => file.nama_file)
            .map(file => ({
                ...file,
                url: getFileUrl(file.nama_file),
                isPdf: file.nama_file.endsWith('.pdf'),
            }))
    } catch (err) {
        console.error('Error fetch file jawaban siswa:', err)
    }
}

// Pisahkan file menjadi gambar dan pdf
const imageFiles = computed(() => fileJawabanSiswa.value.filter(f => !f.isPdf))
const pdfFiles = computed(() => fileJawabanSiswa.value.filter(f => f.isPdf))

// Buat data untuk Galleria
const galleriaItems = computed(() =>
    imageFiles.value.map(file => ({
        itemImageSrc: file.url,
        thumbnailImageSrc: file.url,
        alt: file.nama_file,
    }))
)

const responsiveOptions = ref([
    { breakpoint: '1300px', numVisible: 4 },
    { breakpoint: '575px', numVisible: 1 },
])

const back = () => router.back()

onMounted(async () => {
    await fetchJawabanSiswa()
    await fetchNilai()
    await fetchFileJawabanSiswa()
})

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
    <div class="m-5">
        <Button icon="pi pi-arrow-left" label="Back" @click="back" />
    </div>

    <div v-if="loading">Loading...</div>
    <div v-else-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>

    <div v-else class="space-y-4 m-10">
        <!-- Soal pilihan ganda -->
        <Card v-for="item in jawabanPilgan" :key="item.nomor">
            <template #content>
                <Tag value="Multiple Choice" severity="success" class="mb-3" />
                <div class="flex items-center space-x-2 mb-2">
                    <Tag :value="`${item.nomor}`" severity="info" />
                    <span class="font-bold" v-html="item.soal.pertanyaan"></span>
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

                <div v-if="!item.benar" class="mt-2 p-2 bg-green-100 rounded">
                    <Tag severity="success" value="Correct Answer" />
                    <p class="font-bold">{{ getCorrectAnswerText(item) }}</p>
                </div>
            </template>
        </Card>

        <!-- Essay -->
        <Card v-for="essai in jawabanEssai" :key="essai.nomor">
            <template #content>
                <Tag value="Essay" severity="info" class="mb-3" />
                <div class="flex items-center space-x-2 mb-2">
                    <Tag :value="`${essai.nomor}`" severity="info" />
                    <span class="font-bold" v-html="essai.soal.pertanyaan_essai"></span>
                </div>
                <div v-if="essai.soal.gambar_soal_essai" class="mb-3 flex justify-center">
                    <Image :src="essai.soal.gambar_soal_essai" alt="Gambar Soal" image-class="w-64 h-auto rounded" />
                </div>
                <p>{{ essai.jawaban_essai }}</p>
            </template>
        </Card>

        <!-- Reflection -->
        <Card v-if="jawabanRefleksi">
            <template #header>
                <h1 class="font-bold m-5">Student Reflection</h1>
            </template>
            <template #content>
                <p class="m-5">{{ jawabanRefleksi }}</p>
            </template>
        </Card>

        <!-- Gallery untuk gambar -->
        <Card v-if="imageFiles.length">
            <template #header>
                <div class="m-5 flex justify-between items-center">
                    <h1 class="font-bold text-lg">Student Image Submissions</h1>
                </div>
            </template>

            <template #content>
                <div class="card flex justify-center">
                    <Galleria :value="galleriaItems" :responsiveOptions="responsiveOptions" :numVisible="4"
                        containerStyle="max-width: 640px; margin: auto" showThumbnails showIndicators circular autoPlay
                        transitionInterval="4000">
                        <template #item="slotProps">
                            <img :src="slotProps.item.itemImageSrc" :alt="slotProps.item.alt"
                                style="width: 100%; height: 300px; object-fit: cover;" />
                        </template>
                        <template #thumbnail="slotProps">
                            <img :src="slotProps.item.thumbnailImageSrc" :alt="slotProps.item.alt"
                                style="width: 80px; height: 60px; object-fit: cover;" />
                        </template>
                    </Galleria>
                </div>
            </template>
        </Card>

        <!-- PDF Files -->
        <Card v-if="pdfFiles.length">
            <template #header>
                <div class="m-5 flex justify-between items-center">
                    <h1 class="font-bold text-lg">Student PDF Submissions</h1>
                </div>
            </template>

            <template #content>
                <!-- <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"> -->
                <div v-for="file in pdfFiles" :key="file.id" class="p-3 border shadow-sm hover:shadow-md transition">
                    <!-- <p class="font-semibold mb-2">{{ file.nama_file }}</p> -->
                    <iframe :src="file.url" class="w-full h-[800px] rounded border mb-3" allow="fullscreen"
                        allowfullscreen></iframe>
                    <div class="flex justify-between items-center">
                        <small class="text-gray-500">{{ new Date(file.created_at).toLocaleString() }}</small>
                        <Button label="Download" icon="pi pi-download" class="p-button-sm p-button-info"
                            @click="window.open(file.url, '_blank')" />
                    </div>
                </div>
                <!-- </div> -->
            </template>
        </Card>

        <!-- Summary dan nilai -->
        <div v-if="jawabanPilgan.length" class="mb-5 p-3 bg-blue-100 rounded text-center font-bold">
            Correct {{ summaryPilgan.benar }} out of {{ summaryPilgan.total }} Questions
        </div>

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
