<script setup>
import api from "../../services/api";
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from "vue-router";

const toast = useToast();
const router = useRouter();
const route = useRoute();

const soalId = route.params.id;
const judulBaru = ref("");
const listSoal = ref([]);
const listEssai = ref([]);

/* ================= FETCH DATA ================= */

const fetchSoalDariAssignment = async () => {
    const res = await api.get(`/soal/${soalId}`);
    const data = res.data;

    judulBaru.value = data[0]?.judul_penugasan ?? "";

    listSoal.value = data
        .filter(d => d.pertanyaan)
        .map(d => ({
            id: d.id,
            pertanyaan: d.pertanyaan,
            jawaban: {
                a: d.pg_a,
                b: d.pg_b,
                c: d.pg_c,
                d: d.pg_d,
                e: d.pg_e
            },
            kunci: d.kunci_jawaban,

            // BASE64 EXISTING
            gambar: d.gambar,
            gambar_mimetype: d.gambar_mimetype,

            previewUrl: d.gambar
                ? `data:${d.gambar_mimetype};base64,${d.gambar}`
                : null
        }));

    listEssai.value = data
        .filter(d => d.pertanyaan_essai)
        .map(d => ({
            id: d.id,
            pertanyaan_essai: d.pertanyaan_essai,
            gambar_soal_essai: d.gambar_soal_essai,
            gambar_essai_mimetype: d.gambar_essai_mimetype,
            previewUrlEssai: d.gambar_soal_essai
                ? `data:${d.gambar_essai_mimetype};base64,${d.gambar_soal_essai}`
                : null
        }));
};

/* ================= FILE HANDLER ================= */

const readBase64 = (file, cb) => {
    const reader = new FileReader();
    reader.onload = e => cb(e.target.result.split(",")[1]);
    reader.readAsDataURL(file);
};

const onFileSelect = (e, index) => {
    const file = e.files?.[0];
    if (!file) return;

    readBase64(file, base64 => {
        listSoal.value[index].gambar = base64;
        listSoal.value[index].gambar_mimetype = file.type;
        listSoal.value[index].previewUrl = `data:${file.type};base64,${base64}`;
    });
};

const onFileSelectEssai = (e, index) => {
    const file = e.files?.[0];
    if (!file) return;

    readBase64(file, base64 => {
        listEssai.value[index].gambar_soal_essai = base64;
        listEssai.value[index].gambar_essai_mimetype = file.type;
        listEssai.value[index].previewUrlEssai = `data:${file.type};base64,${base64}`;
    });
};

/* ================= SUBMIT ================= */

const submitSemuaSoal = async () => {
    const soal_list = [];

    listSoal.value.forEach(s => {
        soal_list.push({
            id: s.id,
            pertanyaan: s.pertanyaan,
            pg_a: s.jawaban.a,
            pg_b: s.jawaban.b,
            pg_c: s.jawaban.c,
            pg_d: s.jawaban.d,
            pg_e: s.jawaban.e,
            kunci_jawaban: s.kunci,
            gambar: s.gambar,
            gambar_mimetype: s.gambar_mimetype
        });
    });

    listEssai.value.forEach(e => {
        soal_list.push({
            id: e.id,
            pertanyaan_essai: e.pertanyaan_essai,
            gambar_soal_essai: e.gambar_soal_essai,
            gambar_essai_mimetype: e.gambar_essai_mimetype
        });
    });

    await api.put(`/soal/${soalId}`, {
        judul_penugasan: judulBaru.value,
        soal_list
    });

    toast.add({ severity: "success", summary: "Success", detail: "Soal tersimpan" });
};

onMounted(fetchSoalDariAssignment);
</script>

<template>
    <div class="space-y-8">
        <!-- Dropdown pilih penugasan -->
        <div class="m-5">
            <Button icon="pi pi-arrow-left" class="mb-3" label="Back" @click="kembali"></Button>
        </div>

        <!-- Judul penugasan (bisa diedit) -->
        <div class="m-5">
            <FloatLabel variant="in">
                <InputText id="judul" v-model="judulBaru" class="w-full" />
                <label for="judul">Title</label>
            </FloatLabel>
        </div>

        <!-- List Soal -->
        <div v-for="(soal, index) in listSoal" :key="index">
            <Card class=m-5>
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
        <div class="flex justify-end space-x-2 m-5">
            <Button label="Submit" :loading="loading" @click="submitSemuaSoal" />
        </div>
        <Toast />
    </div>
</template>
