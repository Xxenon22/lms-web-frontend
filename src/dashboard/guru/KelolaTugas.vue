<script setup>
import api from "../../services/api";
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const loading = ref(false);

const judulBaru = ref("");

// Soal pilihan ganda
const listSoal = ref([
    {
        pertanyaan: "",
        jawaban: { a: "", b: "", c: "", d: "", e: "" },
        kunci: "",
        gambar: null,
        previewUrl: null,
    },
]);

// Soal essai
const listSoalEssai = ref([
    {
        pertanyaan_essai: "",
        gambar_soal_essai: null,
        previewUrlEssai: null,
    },
]);

// Tambah soal PG
const tambahSoal = () => {
    listSoal.value.push({
        pertanyaan: "",
        jawaban: { a: "", b: "", c: "", d: "", e: "" },
        kunci: "",
        gambar: null,
        previewUrl: null,
    });
};

// Hapus soal PG
const hapusSoalPilgan = (index) => {
    if (listSoal.value.length === 1) {
        toast.add({
            severity: 'warn', summary: 'At least 1 question', life: 3000
        })
        return;
    }
    listSoal.value.splice(index, 1);
};

// Tambah soal Essai
const tambahSoalEssai = () => {
    listSoalEssai.value.push({
        pertanyaan_essai: "",
        gambar_soal_essai: null,
        previewUrlEssai: null,
    });
};

// Hapus soal Essai
const hapusSoalEssai = (index) => {
    if (listSoalEssai.value.length === 1) {
        toast.add({
            severity: 'warn',
            summary: 'At least 1 question',
            life: 3000
        })
        return;
    }
    listSoalEssai.value.splice(index, 1)
};


const onFileSelect = (event, index) => {
    const file = event.files?.[0];
    if (!file) return;

    // 🔹 Batas ukuran file 50MB (dalam byte)
    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
        toast.add({
            severity: "warn",
            summary: "File too large",
            detail: "Maximum file size allowed is 50MB.",
            life: 3000,
        });
        return;
    }

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

    // 🔹 Batas ukuran file 50MB (dalam byte)
    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
        toast.add({
            severity: "warn",
            summary: "File too large",
            detail: "Maximum file size allowed is 50MB.",
            life: 3000,
        });
        return;
    }

    listSoalEssai.value[index].gambar_soal_essai = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        listSoalEssai.value[index].previewUrlEssai = e.target.result;
    };
    reader.readAsDataURL(file);
};


const uploadGambar = async (file) => {
    try {
        console.log("📤 Uploading image:", {
            name: file.name,
            size: file.size,
            type: file.type,
        });

        const formData = new FormData();
        formData.append("gambar", file);

        const res = await api.post("/gambar-soal", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res.data.path;
    } catch (error) {
        console.error("❌ Upload image failed:", error);
        throw error;
    }
};



// Submit semua soal
const submitSemuaSoal = async () => {
    if (!judulBaru.value.trim()) {
        toast.add({ severity: "warn", summary: "Title required" });
        return;
    }

    loading.value = true;

    try {
        // CREATE BANK SOAL
        const bank = await api.post(
            "/bank-soal",
            { judul_penugasan: judulBaru.value },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const bankSoalId = bank.data.id;

        const allData = [];
        const max = Math.max(listSoal.value.length, listSoalEssai.value.length);

        for (let i = 0; i < max; i++) {
            const pg = listSoal.value[i] || {};
            const es = listSoalEssai.value[i] || {};

            allData.push({
                pertanyaan: pg.pertanyaan || null,
                pg_a: pg.jawaban?.a || null,
                pg_b: pg.jawaban?.b || null,
                pg_c: pg.jawaban?.c || null,
                pg_d: pg.jawaban?.d || null,
                pg_e: pg.jawaban?.e || null,
                kunci_jawaban: pg.kunci || null,
                pertanyaan_essai: es.pertanyaan_essai || null,
            });
        }

        // 🔥 FORM DATA
        const formData = new FormData();
        formData.append(
            "data",
            JSON.stringify({
                bank_soal_id: bankSoalId,
                soal_list: allData
            })
        );

        // APPEND FILE
        listSoal.value.forEach((s, i) => {
            if (s.gambar) {
                formData.append(`pg_image_${i}`, s.gambar);
            }
        });

        listSoalEssai.value.forEach((s, i) => {
            if (s.gambar_soal_essai) {
                formData.append(`essai_image_${i}`, s.gambar_soal_essai);
            }
        });

        await api.post("/soal", formData, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "multipart/form-data"
            }
        });

        toast.add({
            severity: "success",
            summary: "Success",
            detail: "Question saved successfully"
        });

        // RESET
        judulBaru.value = "";
        listSoal.value = [{
            pertanyaan: "",
            jawaban: { a: "", b: "", c: "", d: "", e: "" },
            kunci: "",
            gambar: null,
            previewUrl: null
        }];

        listSoalEssai.value = [{
            pertanyaan_essai: "",
            gambar_soal_essai: null,
            previewUrlEssai: null
        }];

    } catch (err) {
        console.error(err);
        toast.add({
            severity: "error",
            summary: "Failed",
            detail: err.response?.data?.message || err.message
        });
    }

    loading.value = false;
};

// onMounted(() => {
//     guruId.value = localStorage.getItem("id");
// });

</script>

<template>
    <div class="space-y-8">
        <div class="flex justify-between items-center">

            <div class="m-5">
                <FloatLabel variant="in">
                    <InputText id="judul" v-model="judulBaru" class="w-full" />
                    <label for="judul">Title</label>
                </FloatLabel>
            </div>
        </div>

        <div v-for="(soal, index) in listSoal" :key="index">
            <Card class="m-5">
                <template #header>
                    <div class="m-5 space-y-5">
                        <Tag value="Multiple Choice" severity="info" rounded></Tag>
                        <div class="flex justify-between">
                            <Tag severity="success" :value="`${index + 1}.`" rounded></Tag>
                            <div class="flex space-x-2">
                                <Button rounded outlined icon="pi pi-times" severity="danger"
                                    v-tooltip.top="'Delete Question'" @click="hapusSoalPilgan(index)" />
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
                            <div class="flex items-center space-x-3">
                                <h1>A.</h1>
                                <InputText v-model="soal.jawaban.a" placeholder="Option A" class="w-full" />
                            </div>
                            <div class="flex items-center space-x-3">
                                <h1>B.</h1>
                                <InputText v-model="soal.jawaban.b" placeholder="Option B" class="w-full" />
                            </div>
                            <div class="flex items-center space-x-3">
                                <h1>C.</h1>
                                <InputText v-model="soal.jawaban.c" placeholder="Option C" class="w-full" />
                            </div>
                            <div class="flex items-center space-x-3">
                                <h1>D.</h1>
                                <InputText v-model="soal.jawaban.d" placeholder="Option D" class="w-full" />
                            </div>
                            <div class="flex items-center space-x-3">
                                <h1>E.</h1>
                                <InputText v-model="soal.jawaban.e" placeholder="Option E" class="w-full" />
                            </div>
                            <Select v-model="soal.kunci" :options="['A', 'B', 'C', 'D', 'E']"
                                placeholder="Answer Key" />
                        </div>

                        <div class="">
                            <Button rounded outlined icon="pi pi-plus" v-tooltip.top="'Add Question'"
                                @click="tambahSoal" />
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <div v-for="(soal, index) in listSoalEssai" :key="index">
            <Card class="m-5">
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
                            <img v-if="soal.previewUrlEssai" :src="soal.previewUrlEssai" alt="Image"
                                class="shadow-md rounded-xl w-full sm:w-64" />
                            <FileUpload mode="basic" @select="(e) => onFileSelectEssai(e, index)" customUpload auto
                                class="p-button-outlined" accept="image/*" name="image" />
                        </div>
                        <Editor v-model="soal.pertanyaan_essai" editorStyle="height:120px">
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
                    <div class="">
                        <Button rounded outlined icon="pi pi-plus" v-tooltip.top="'Add Question'"
                            @click="tambahSoalEssai" />
                    </div>
                </template>
            </Card>
        </div>


        <div class="flex justify-end space-x-2 m-5">
            <Button label="Submit" :loading="loading" @click="submitSemuaSoal" />
        </div>
        <Toast />
    </div>
</template>
