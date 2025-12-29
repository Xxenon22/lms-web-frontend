<script setup>
import api from "../../services/api";
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const loading = ref(false);

// ambil guruId dari localStorage (hasil login)
// const guruId = ref(localStorage.getItem("id"));
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

        console.log("✅ Image uploaded, backend response:", {
            mimetype: res.data.mimetype,
            bufferLength: res.data.buffer?.length,
        });

        return {
            data: res.data.buffer,
            mimetype: res.data.mimetype
        };
    } catch (error) {
        console.error("❌ Upload image failed:", error);
        throw error;
    }
};



// Submit semua soal
const submitSemuaSoal = async () => {
    if (!judulBaru.value.trim()) {
        toast.add({ severity: "warn", summary: "Title cannot be empty", life: 2000 });
        return;
    }

    // if (!guruId.value) {
    //     toast.add({ severity: "error", summary: "Failed", detail: "Teacher ID not found" });
    //     return;
    // }

    // 🔹 Cek apakah ada minimal 1 soal valid (PG atau Essai)
    let adaPGValid = false;
    let adaEssaiValid = false;

    // Cek PG valid
    for (let i = 0; i < listSoal.value.length; i++) {
        const soal = listSoal.value[i];
        if (
            soal.pertanyaan.trim() &&
            soal.jawaban.a.trim() &&
            soal.jawaban.b.trim() &&
            soal.jawaban.c.trim() &&
            soal.jawaban.d.trim() &&
            soal.jawaban.e.trim() &&
            soal.kunci
        ) {
            adaPGValid = true;
            break;
        }
    }

    // Cek Essai valid
    for (let i = 0; i < listSoalEssai.value.length; i++) {
        const soal = listSoalEssai.value[i];
        if (soal.pertanyaan_essai.trim()) {
            adaEssaiValid = true;
            break;
        }
    }

    if (!adaPGValid && !adaEssaiValid) {
        toast.add({
            severity: "warn",
            summary: "No questions available",
            detail: "Please fill in at least one: Multiple Choice Question or Essay Question.",
            life: 3000,
        });
        return;
    }

    // 🔹 Validasi detail PG (hanya kalau ada PG yang diisi)
    if (adaPGValid) {
        for (let i = 0; i < listSoal.value.length; i++) {
            const soal = listSoal.value[i];
            if (!soal.pertanyaan.trim()) {
                toast.add({ severity: "warn", summary: `Multiple Choice Question Number ${i + 1}`, detail: "Question is required", life: 2500 });
                return;
            }
            if (!soal.jawaban.a.trim() || !soal.jawaban.b.trim() || !soal.jawaban.c.trim() || !soal.jawaban.d.trim() || !soal.jawaban.e.trim()) {
                toast.add({ severity: "warn", summary: `Multiple Choice Question Number ${i + 1}`, detail: "All options A–E are required", life: 2500 });
                return;
            }
            if (!soal.kunci) {
                toast.add({ severity: "warn", summary: `Multiple Choice Question Number ${i + 1}`, detail: "Answer key is required", life: 2500 });
                return;
            }
        }
    }

    //  Validasi detail Essai (hanya kalau ada Essai yang diisi)
    if (adaEssaiValid) {
        for (let i = 0; i < listSoalEssai.value.length; i++) {
            const soal = listSoalEssai.value[i];
            if (!soal.pertanyaan_essai.trim()) {
                toast.add({ severity: "warn", summary: `Essay Question Number ${i + 1}`, detail: "Question is required", life: 2500 });
                return;
            }
        }
    }

    loading.value = true;

    try {
        // Buat bank soal
        const res = await api.post("/bank-soal", { judul_penugasan: judulBaru.value },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );


        const bankSoalId = res.data.id;

        // Gabungkan PG & Essai
        const allData = [];
        const maxLength = Math.max(listSoal.value.length, listSoalEssai.value.length);

        for (let i = 0; i < maxLength; i++) {
            const pg = listSoal.value[i] || {};
            const es = listSoalEssai.value[i] || {};

            const pgImage = pg.gambar ? await uploadGambar(pg.gambar) : null;
            const essaiImage = es.gambar_soal_essai ? await uploadGambar(es.gambar_soal_essai) : null;

            allData.push({
                bank_soal_id: bankSoalId,
                pertanyaan: pg.pertanyaan || null,
                pg_a: pg.jawaban?.a || null,
                pg_b: pg.jawaban?.b || null,
                pg_c: pg.jawaban?.c || null,
                pg_d: pg.jawaban?.d || null,
                pg_e: pg.jawaban?.e || null,
                kunci_jawaban: pg.kunci || null,
                pertanyaan_essai: es.pertanyaan_essai || null,
                gambar: pgImage?.data || null,
                gambar_mimetype: pgImage?.mimetype || null,
                gambar_soal_essai: essaiImage?.data || null,
                gambar_essai_mimetype: essaiImage?.mimetype || null,
            });
        }

        // Submit soal ke API
        await api.post("/soal",
            {
                bank_soal_id: bankSoalId,
                soal_list: allData
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        toast.add({
            severity: "success",
            summary: "Success!",
            detail: "All questions saved successfully.",
            life: 3000,
        });

        // Reset form
        judulBaru.value = "";
        listSoal.value = [
            {
                pertanyaan: "",
                jawaban: { a: "", b: "", c: "", d: "", e: "" },
                kunci: "",
                gambar: null,
                previewUrl: null,
            },
        ];
        listSoalEssai.value = [
            { pertanyaan_essai: "", gambar_soal_essai: null, previewUrlEssai: null },
        ];
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Failed",
            detail: error.response?.data?.message || error.message,
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
                            <InputText v-model="soal.jawaban.a" placeholder="Option A" />
                            <InputText v-model="soal.jawaban.b" placeholder="Option B" />
                            <InputText v-model="soal.jawaban.c" placeholder="Option C" />
                            <InputText v-model="soal.jawaban.d" placeholder="Option D" />
                            <InputText v-model="soal.jawaban.e" placeholder="Option E" />
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
