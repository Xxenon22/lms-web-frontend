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
const bankSoalId = route.params.bankSoalId

// ======================
// STATE DATA
// ======================
const loading = ref(true)
const errorMessage = ref(null)

const jawabanPilgan = ref([])
const jawabanEssai = ref([])
const jawabanRefleksi = ref(null)
const profileSiswa = ref([])
const nilai = ref(null)

// FILE JAWABAN
const fileJawabanSiswa = ref([])

// ======================
// HELPER
// ======================
function getImageUrl(filename) {
    if (!filename) return null
    return `${import.meta.env.VITE_API_URL}/uploads/gambar-soal/${filename}`
}

// function getFileUrl(filename) {
//     if (!filename) return null
//     return `${import.meta.env.VITE_API_URL}/uploads/file-jawaban-siswa/${filename}`
// }

// ======================
// FETCH JAWABAN (SOAL)
// ======================
const fetchJawabanSiswa = async () => {
    try {
        const res = await api.get(`/jawaban-siswa/by-bank-soal/${bankSoalId}`)

        const data = (res.data || [])
            .filter(d => d.user_id === Number(userId)) // 🔥 WAJIB

        if (!data.length) {
            jawabanPilgan.value = []
            jawabanEssai.value = []
            jawabanRefleksi.value = null
            return
        }

        // ================= PILGAN =================
        jawabanPilgan.value = data
            .filter(item => item.pg_a !== null && item.jawaban !== null)
            .map((item, idx) => ({
                id: item.jawaban_id,
                nomor: idx + 1,
                jawaban: item.jawaban,
                benar:
                    item.jawaban?.toUpperCase() ===
                    item.kunci_jawaban?.toUpperCase(),
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

        // ================= ESSAI =================
        jawabanEssai.value = data
            .filter(item => item.pertanyaan_essai && item.jawaban_essai)
            .map((item, idx) => ({
                id: item.jawaban_id,
                nomor: idx + 1,
                jawaban_essai: item.jawaban_essai,
                soal: {
                    pertanyaan_essai: item.pertanyaan_essai,
                    gambar_soal_essai: getImageUrl(item.gambar_soal_essai),
                },
            }))

        jawabanRefleksi.value = data[0]?.refleksi_siswa ?? null

    } catch (err) {
        console.error(err)
        errorMessage.value = 'Failed to retrieve student answer'
    } finally {
        loading.value = false
    }
}

// const submitNilai = async () => {
//     try {
//         isSubmitting.value = true;

//         await api.put("/jawaban-siswa/nilai", {
//             user_id: Number(userId),
//             bank_soal_id: Number(bankSoalId),
//             nilai: nilai.value,
//         });

//         toast.add({
//             severity: "success",
//             summary: "Success",
//             detail: "Score saved successfully",
//             life: 3000,
//         });

//         initialNilai.value = nilai.value;
//         hasChanges.value = false;

//     } catch (err) {
//         console.error("Submit nilai error:", err);
//         toast.add({
//             severity: "error",
//             summary: "Error",
//             detail: "Failed to submit score",
//             life: 3000,
//         });
//     } finally {
//         isSubmitting.value = false;
//     }
// };


// ======================
// FETCH NILAI
// ======================

const profile = async () => {
    try {
        const res = await api.get(`/auth/student/${userId}`);
        profileSiswa.value = res.data;
    } catch (err) {
        console.error("Fetch profile siswa error:", err);
    }
};

const fetchNilai = async () => {
    const res = await api.get(`/jawaban-siswa/by-bank-soal/${bankSoalId}`)

    const row = res.data.find(
        r => r.user_id === Number(userId) && r.nilai !== null
    )

    nilai.value = row?.nilai ?? null
    initialNilai.value = nilai.value
}

watch(nilai, () => {
    hasChanges.value = nilai.value !== initialNilai.value
})

// ======================
// FETCH FILE JAWABAN SISWA (INI PENTING)
// ======================
const fetchFileJawabanSiswa = async () => {
    try {
        const res = await api.get(
            `/jawaban-siswa/files-by-bank-guru/${bankSoalId}`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );

        // console.log("RAW FILE RESPONSE:", res.data);

        fileJawabanSiswa.value = res.data
            .filter(f => f.user_id === Number(userId))
            .map(file => ({
                id: file.id,
                nama_file: file.file_name,
                file_mime: file.file_mime,
                created_at: file.created_at,
                isPdf: file.file_mime === "application/pdf",

                // 🔥 PISAH JELAS
                url: file.url,                   // STATIC
                download_url: file.download_url, // API
            }));


        // console.log("FILE JAWABAN SISWA (MAPPED):", fileJawabanSiswa.value);

    } catch (err) {
        console.error("Error fetch file jawaban siswa:", err);
    }
};


// ======================
// DOWNLOAD
// // ======================
// const downloadFile = async (url, filename) => {
//     try {
//         const res = await api.get(url, { responseType: "blob" });

//         const blob = new Blob([res.data]);
//         const link = document.createElement("a");
//         link.href = URL.createObjectURL(blob);
//         link.download = filename;
//         link.click();

//         URL.revokeObjectURL(link.href);
//     } catch (err) {
//         toast.add({
//             severity: "error",
//             summary: "Download failed",
//             detail: "Unauthorized or file missing",
//             life: 3000,
//         });
//     }
// };

// ======================
// OPEN FILE
// ======================   
const openFile = (url) => {
    window.open(url, "_blank");
};

// ======================
// COMPUTED FILE
// ======================
const imageFiles = computed(() => {
    const result = fileJawabanSiswa.value.filter(f => !f.isPdf)
    return result
})

const pdfFiles = computed(() => {
    const result = fileJawabanSiswa.value.filter(f => f.isPdf)
    // console.log('PDF FILES:', result) // 🔍 DEBUG
    return result
})

// ======================
// GALLERIA
// ======================
const galleriaItems = computed(() => {
    const items = imageFiles.value.map(file => ({
        itemImageSrc: file.url,
        thumbnailImageSrc: file.url,
        alt: file.nama_file,
    }))
    // console.log('GALLERIA ITEMS:', items) // 🔍 DEBUG
    return items
})

const responsiveOptions = ref([
    { breakpoint: '1300px', numVisible: 4 },
    { breakpoint: '575px', numVisible: 1 },
])

// ======================
// NAVIGATION
// ======================
const back = () => router.back()

// ======================
// MOUNTED
// ======================
onMounted(async () => {
    await fetchJawabanSiswa()
    await fetchNilai()
    await fetchFileJawabanSiswa()
    await profile()
})

// ======================
// HELPER UI
// ======================
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
    <div class="flex justify-between m-5">
        <Button icon="pi pi-chevron-left" label="Back" @click="back" />
        <h1 class="text-xl font-semibold" v-if="profileSiswa">{{ profileSiswa.username }}</h1>
    </div>

    <div v-if="loading">Loading...</div>
    <div v-if="!loading && !jawabanPilgan.length && !jawabanEssai.length && !jawabanRefleksi">
        <p class="flex justify-center text-gray-500 italic">
            Student has not submitted this assignment yet.
        </p>
    </div>
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

        <!-- image File -->
        <Card v-if="imageFiles.length">
            <template #header>
                <div class="m-5">
                    <h1 class="font-bold text-lg">Student Image Submissions</h1>
                </div>
            </template>

            <template #content>
                <div class="space-y-3">
                    <div v-for="file in imageFiles" :key="file.id"
                        class="flex items-center justify-between p-3 border rounded hover:shadow transition">
                        <div class="flex items-center gap-3">
                            <i class="pi pi-image text-xl text-blue-500"></i>
                            <div>
                                <p class="font-semibold">{{ file.nama_file }}</p>
                                <small class="text-gray-500">
                                    {{ new Date(file.created_at).toLocaleString() }}
                                </small>
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <Button icon="pi pi-external-link" severity="secondary" size="small"
                                @click="openFile(file.url)" />
                            <Button icon="pi pi-download" severity="info" size="small"
                                @click="downloadFile(file.download_url, file.nama_file)" />
                        </div>
                    </div>
                </div>
            </template>
        </Card>


        <!-- PDF Files -->
        <Card v-if="pdfFiles.length">
            <template #header>
                <div class="m-5">
                    <h1 class="font-bold text-lg">Student PDF Submissions</h1>
                </div>
            </template>

            <template #content>
                <div class="space-y-3">
                    <div v-for="file in pdfFiles" :key="file.id"
                        class="flex items-center justify-between p-3 border rounded hover:shadow transition">
                        <div class="flex items-center gap-3">
                            <i class="pi pi-file-pdf text-xl text-red-500"></i>
                            <div>
                                <p class="font-semibold">{{ file.nama_file }}</p>
                                <small class="text-gray-500">
                                    {{ new Date(file.created_at).toLocaleString() }}
                                </small>
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <Button icon="pi pi-external-link" severity="secondary" size="small"
                                @click="openFile(file.url)" />
                            <!-- <Button icon="pi pi-download" severity="info" size="small"
                                @click="downloadFile(file.url, file.file_name)" /> -->
                        </div>
                    </div>
                </div>
            </template>
        </Card>


        <!-- Summary dan nilai -->
        <div v-if="jawabanPilgan.length" class="mb-5 p-3 bg-blue-100 rounded text-center font-bold">
            Correct {{ summaryPilgan.benar }} out of {{ summaryPilgan.total }} Questions
        </div>
        <!-- 
        <div class="mt-10 space-y-2">
            <FloatLabel>
                <InputNumber v-model="nilai" />
                <label for="nilai">Score</label>
            </FloatLabel>
            <Button label="Submit Score" @click="submitNilai" :disabled="!hasChanges || isSubmitting" />
        </div> -->
    </div>

    <Toast />
</template>
