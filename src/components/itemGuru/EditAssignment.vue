<script setup>
import api from "../../services/api";
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';

const toast = useToast();
const loading = ref(false);
const router = useRouter();
const route = useRoute();

const soalId = route.params.id;
const guruId = ref(null);
const judulBaru = ref("");
const listSoal = ref([]);
const listEssai = ref([]);
const selectedPenugasan = ref(null);

// Ambil profil guru
const fetchGuruProfile = async () => {
    try {
        const res = await api.get("/auth/profile");
        guruId.value = res.data.id;
    } catch (error) {
        console.error("error fetch guru ID :", error);
    }
};

// Ambil judul + soal dari backend Express
const fetchSoalDariAssignment = async () => {
    if (!soalId) return;

    try {
        const res = await api.get(`/soal/${soalId}`);
        const semuaSoal = res.data;

        if (!semuaSoal || semuaSoal.length === 0) {
            toast.add({
                severity: "warn",
                summary: "Empty",
                detail: "Assignment Not found",

            });
            return;
        }

        judulBaru.value = semuaSoal[0]?.judul_penugasan ?? "";

        listSoal.value = semuaSoal
            .filter((soal) => soal.pertanyaan && soal.pertanyaan.trim() !== "")
            .map((soal) => ({
                id: soal.id,
                pertanyaan: soal.pertanyaan,
                jawaban: {
                    a: soal.pg_a,
                    b: soal.pg_b,
                    c: soal.pg_c,
                    d: soal.pg_d,
                    e: soal.pg_e,
                },
                kunci: soal.kunci_jawaban,
                gambar: null,
                uploadedUrl: soal.gambar,
                previewUrl: soal.gambar
                    ? `${import.meta.env.VITE_API_URL}/uploads/gambar-soal/${soal.gambar}`
                    : null,
            }));

        listEssai.value = semuaSoal
            .filter((soal) => soal.pertanyaan_essai && soal.pertanyaan_essai.trim() !== "")
            .map((soal) => ({
                id: soal.id,
                pertanyaan_essai: soal.pertanyaan_essai,
                gambar_soal_essai: null,
                uploadedUrlEssai: soal.gambar_soal_essai,
                previewUrlEssai: soal.gambar_soal_essai
                    ? `${import.meta.env.VITE_API_URL}/uploads/gambar-soal/${soal.gambar_soal_essai}`
                    : null,
            }));

        if (listSoal.value.length === 0) {
            listSoal.value.push({
                pertanyaan: "",
                jawaban: { a: "", b: "", c: "", d: "", e: "" },
                kunci: "",
                gambar: null,
                uploadedUrl: null,
                previewUrl: null,
            });
        }

        if (listEssai.value.length === 0) {
            listEssai.value.push({
                pertanyaan_essai: "",
                gambar_soal_essai: null,
                uploadedUrlEssai: null,
                previewUrlEssai: null,
            });
        }
    } catch (error) {
        console.error("Gagal ambil soal:", error);
        toast.add({ severity: "error", summary: "Failed", detail: "Tidak bisa ambil soal dari server" });
    }
};

// 🔹 Upload gambar (Express pakai multer / storage API)
const uploadGambar = async (file) => {
    try {
        const formData = new FormData();
        formData.append("gambar", file); // <-- backend multer.single("gambar")

        const uploadRes = await api.post("/gambar-soal", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });

        // backend balikin { filePath: "gambarSoal/xxx.png" }
        return uploadRes.data.filePath;
    } catch (error) {
        console.error("Upload gagal:", error);
        toast.add({ severity: "error", summary: "Upload Failed", detail: error.message });
        return null;
    }
};

// 🔹 Submit semua soal
const submitSemuaSoal = async () => {
    try {
        const soalList = [];

        // 🔹 Multiple Choice
        for (let soal of listSoal.value) {
            let uploadedUrl = soal.uploadedUrl;
            if (soal.gambar instanceof File) {
                uploadedUrl = await uploadGambar(soal.gambar);
            }

            soalList.push({
                id: soal.id || null,
                pertanyaan: soal.pertanyaan,
                pg_a: soal.jawaban.a,
                pg_b: soal.jawaban.b,
                pg_c: soal.jawaban.c,
                pg_d: soal.jawaban.d,
                pg_e: soal.jawaban.e,
                kunci_jawaban: soal.kunci,
                gambar: uploadedUrl || null
            });
        }

        // 🔹 Essay
        for (let es of listEssai.value) {
            let uploadedUrlEssai = es.uploadedUrlEssai;
            if (es.gambar_soal_essai instanceof File) {
                uploadedUrlEssai = await uploadGambar(es.gambar_soal_essai);
            }

            soalList.push({
                id: es.id || null,
                pertanyaan_essai: es.pertanyaan_essai,
                gambar_soal_essai: uploadedUrlEssai || null
            });
        }

        await api.put(`/soal/${soalId}`, {
            guru_id: guruId.value,
            soal_list: soalList
        });

        toast.add({
            severity: "success",
            summary: "Success",
            detail: "Semua soal berhasil disimpan",
        });
    } catch (error) {
        console.error("Error saat submit soal:", error.response?.data || error.message);
        toast.add({
            severity: "error",
            summary: "Failed",
            detail: error.response?.data?.message || "Terjadi error saat update soal",
        });
    }
};

const tambahSoal = () => {
    listSoal.value.push({
        pertanyaan: "",
        jawaban: { a: "", b: "", c: "", d: "", e: "" },
        kunci: "",
        gambar: null,
        uploadedUrl: null,
        previewUrl: null
    });
};

const hapusSoal = (index) => {
    if (listSoal.value.length === 1) {
        toast.add({ severity: "warn", summary: "At least 1 question", life: 3000 });
        return;
    }
    listSoal.value.splice(index, 1);
};

const tambahSoalEssai = () => {
    listEssai.value.push({
        pertanyaan_essai: "",
        gambar_soal_essai: null,
        uploadedUrlEssai: null,
        previewUrlEssai: null
    });
};

const hapusSoalEssai = (index) => {
    if (listEssai.value.length === 1) {
        toast.add({ severity: "warn", summary: "At least 1 question", life: 3000 });
        return;
    }
    listEssai.value.splice(index, 1);
};

const onFileSelect = (event, index) => {
    const file = event.files?.[0];
    if (!file) return;

    listSoal.value[index].gambar = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        listSoal.value[index].previewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
};

const onFileSelectEssai = (event, index) => {
    const file = event.files?.[0];
    if (!file) return;

    listEssai.value[index].gambar_soal_essai = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        listEssai.value[index].previewUrlEssai = e.target.result;
    };
    reader.readAsDataURL(file);
};

const kembali = () => {
    router.back();
};

onMounted(async () => {
    await fetchGuruProfile();
    await fetchSoalDariAssignment();
});
</script>

<template>
    <div class="space-y-8">
        <!-- Dropdown pilih penugasan -->
        <div>
            <Button icon="pi pi-arrow-left" class="mb-3" label="Back" @click="kembali"></Button>
        </div>

        <!-- Judul penugasan (bisa diedit) -->
        <div>
            <FloatLabel variant="in">
                <InputText id="judul" v-model="judulBaru" class="w-full" />
                <label for="judul">Title</label>
            </FloatLabel>
        </div>

        <!-- List Soal -->
        <div v-for="(soal, index) in listSoal" :key="index">
            <Card>
                <template #header>
                    <div class="m-5 space-y-5">
                        <Tag value="Multiple Choice" severity="info" rounded class="mb-5"></Tag>
                        <div class="flex justify-between">
                            <Tag severity="success" :value="`${index + 1}.`" rounded></Tag>
                            <div class="flex space-x-2">
                                <Button rounded outlined icon="pi pi-times" severity="danger"
                                    v-tooltip.top="'Delete Question'" @click="hapusSoal(index)" />
                            </div>
                        </div>
                        <div class="card flex flex-col items-center gap-6">
                            <img v-if="soal.previewUrl" :src="soal.previewUrl" alt="Image"
                                class="shadow-md rounded-xl w-full sm:w-64" />
                            <FileUpload mode="basic" @select="(e) => onFileSelect(e, index)" customUpload auto
                                class="p-button-outlined" accept="image/*" name="image" />
                        </div>
                        <Editor v-model="soal.pertanyaan" editorStyle="height:120px">
                            <template v-slot:toolbar>
                                <span class="ql-formats">
                                    <button v-tooltip.bottom="'Bold'" class="ql-bold"></button>
                                    <button v-tooltip.bottom="'Italic'" class="ql-italic"></button>
                                    <button v-tooltip.bottom="'Underline'" class="ql-underline"></button>
                                </span>
                            </template>
                        </Editor>
                    </div>
                </template>
                <template #content>
                    <div class="grid gap-4">
                        <div class="pilgan flex flex-col space-y-4">
                            <InputText v-model="soal.jawaban.a" placeholder="Option A" />
                            <InputText v-model="soal.jawaban.b" placeholder="Option B" />
                            <InputText v-model="soal.jawaban.c" placeholder="Option C" />
                            <InputText v-model="soal.jawaban.d" placeholder="Option D" />
                            <InputText v-model="soal.jawaban.e" placeholder="Option E" />
                            <Select v-model="soal.kunci" :options="['A', 'B', 'C', 'D', 'E']"
                                placeholder="Answer Key" />
                        </div>
                        <div>
                            <Button rounded outlined icon="pi pi-plus" v-tooltip.top="'Add Question'"
                                @click="tambahSoal" />
                        </div>
                    </div>
                </template>
            </Card>
        </div>
        <div v-for="(essai, index) in listEssai" :key="index" class="">
            <Card>
                <template #header>
                    <div class="m-5 space-y-5">
                        <Tag value="Essay" severity="info" rounded class="mb-5"></Tag>
                        <div class="flex justify-between">
                            <Tag severity="success" :value="`${index + 1}.`" rounded></Tag>
                            <div class="flex space-x-2">
                                <Button rounded outlined icon="pi pi-times" severity="danger"
                                    v-tooltip.top="'Delete Question'" @click="hapusSoalEssai(index)" />
                            </div>
                        </div>
                        <div class="card flex flex-col items-center gap-6">
                            <img v-if="essai.previewUrlEssai" :src="essai.previewUrlEssai" alt="Image"
                                class="shadow-md rounded-xl w-full sm:w-64" />
                            <FileUpload mode="basic" @select="(e) => onFileSelectEssai(e, index)" customUpload auto
                                class="p-button-outlined" accept="image/*" name="image" />
                        </div>
                        <Editor v-model="essai.pertanyaan_essai" editorStyle="height:120px">
                            <template v-slot:toolbar>
                                <span class="ql-formats">
                                    <button v-tooltip.bottom="'Bold'" class="ql-bold"></button>
                                    <button v-tooltip.bottom="'Italic'" class="ql-italic"></button>
                                    <button v-tooltip.bottom="'Underline'" class="ql-underline"></button>
                                </span>
                            </template>
                        </Editor>
                        <div>
                            <Button rounded outlined icon="pi pi-plus" v-tooltip.top="'Add Question'"
                                @click="tambahSoalEssai" />
                        </div>
                    </div>

                </template>
            </Card>
        </div>

        <!-- Submit -->
        <div class="flex justify-end space-x-2">
            <Button label="Submit" :loading="loading" @click="submitSemuaSoal" />
        </div>
        <Toast />
    </div>
</template>
