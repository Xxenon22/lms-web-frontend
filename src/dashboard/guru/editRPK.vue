<script setup>
import api from '../../services/api';
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRoute, useRouter } from 'vue-router';

const toast = useToast();
const route = useRoute();
const id = route.params.id;
const router = useRouter();

// Form fields
const rombel = ref("");
const namaGuru = ref(null);
const tutor = ref("");
const tanggal = ref("");
const fase = ref("");
const studyTime = ref("");
const tujuanPemb = ref("");
const lintasDis = ref("");
const pemanfaatan = ref("");
const kemitraanPemb = ref("");
const dpl1 = ref(false);
const dpl2 = ref(false);
const dpl3 = ref(false);
const dpl4 = ref(false);
const dpl5 = ref(false);
const dpl6 = ref(false);
const dpl7 = ref(false);
const dpl8 = ref(false);

// Pengalaman belajar
const memahami = ref("");
const mengaplikasikan = ref("");
const merefleksi = ref("");

// Prinsip pembelajaran
const berkesadaranMemahami = ref(false);
const bermaknaMemahami = ref(false);
const menggembirakanMemahami = ref(false);

const berkesadaranMengaplikasikan = ref(false);
const bermaknaMengaplikasikan = ref(false);
const menggembirakanMengaplikasikan = ref(false);

const berkesadaranMerefleksi = ref(false);
const bermaknaMerefleksi = ref(false);
const menggembirakanMerefleksi = ref(false);

// Asesmen
const asesmenMemahami = ref("");
const asesmenMengaplikasikan = ref("");
const asesmenMerefleksi = ref("");

// Options
const selectedFase = ref([]);
const selectedRombel = ref([]);
const selectedInstructor = ref([]);

// child-table IDs
const currentMemahamiId = ref(null);
const currentMengaplikasikanId = ref(null);
const currentMerefleksiId = ref(null);

const filteredInstructor = ref([])

// ================== FETCH SECTION ===================

const fetchSelectedFase = async () => {
    try {
        const res = await api.get("/phase");
        selectedFase.value = res.data;
    } catch (error) {
        console.error("fetch Phase :", error);
    }
};
const fetchSelectedRombel = async () => {
    try {
        const res = await api.get("/kelas", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        selectedRombel.value = res.data.map(b => ({
            id: b.rombel_id,
            name: `${b.grade_lvl || ''} ${b.major} ${b.name_rombel || ''} - ${b.nama_mapel}`
        }));
    } catch (error) {
        console.error("fetch rombel :", error);
    }
};

const fetchSelectedInstructor = async (order = "asc") => {
    try {
        const res = await api.get("/teacher");
        selectedInstructor.value = res.data.map(i => ({
            id: Number(i.id),
            name: i.name
        }))
            .sort((a, b) => order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    } catch (error) {
        console.error("fetch instructor :", error);
    }
};

// ================== MAIN FIX SECTION ===================
const fetchExistingRPK = async () => {
    try {

        const res = await api.get(`/rpk/${id}`);
        const data = res.data;
        // === Parent table ===
        rombel.value = data.rombel_id;
        filteredInstructor.value = [...selectedInstructor.value];
        namaGuru.value = selectedInstructor.value.find(
            i => i.id === data.instructor
        );
        tanggal.value = data.hari_tanggal ? new Date(data.hari_tanggal) : null;
        fase.value = data.phase_id;
        studyTime.value = data.waktu;
        tujuanPemb.value = data.tujuan_pembelajaran;
        lintasDis.value = data.lintas_disiplin_ilmu;
        pemanfaatan.value = data.pemanfaatan_digital;
        kemitraanPemb.value = data.kemitraan_pembelajaran;

        dpl1.value = data.dpl_1;
        dpl2.value = data.dpl_2;
        dpl3.value = data.dpl_3;
        dpl4.value = data.dpl_4;
        dpl5.value = data.dpl_5;
        dpl6.value = data.dpl_6;
        dpl7.value = data.dpl_7;
        dpl8.value = data.dpl_8;

        // === Child relation IDs ===
        currentMemahamiId.value = data.memahami_id;
        currentMengaplikasikanId.value = data.mengaplikasikan_id;
        currentMerefleksiId.value = data.merefleksi_id;

        // === Fetch child contents (langsung dari data utama) ===
        memahami.value = data.memahami || "";
        berkesadaranMemahami.value = data.memahami_berkesadaran || false;
        bermaknaMemahami.value = data.memahami_bermakna || false;
        menggembirakanMemahami.value = data.memahami_menggembirakan || false;
        asesmenMemahami.value = data.asesmen_memahami || "";

        mengaplikasikan.value = data.mengaplikasikan || "";
        berkesadaranMengaplikasikan.value = data.mengaplikasikan_berkesadaran || false;
        bermaknaMengaplikasikan.value = data.mengaplikasikan_bermakna || false;
        menggembirakanMengaplikasikan.value = data.mengaplikasikan_menggembirakan || false;
        asesmenMengaplikasikan.value = data.asesmen_mengaplikasikan || "";

        merefleksi.value = data.merefleksi || "";
        berkesadaranMerefleksi.value = data.merefleksi_berkesadaran || false;
        bermaknaMerefleksi.value = data.merefleksi_bermakna || false;
        menggembirakanMerefleksi.value = data.merefleksi_menggembirakan || false;
        asesmenMerefleksi.value = data.asesmen_merefleksi || "";

    } catch (err) {
        toast.add({ severity: 'error', summary: 'Failed', detail: 'Failed to load RPK data.', life: 3000 });
        console.error(err);
    }
};
// =======================================================

const updateRPK = async () => {
    try {
        const postOrPut = async (path, id, payload) => {
            if (id) {
                await api.put(`/${path}/${id}`, payload);
                return id;
            } else {
                const res = await api.post(`/${path}`, payload);
                return res.data.id;
            }
        };

        const memahamiId = await postOrPut("rpk-memahami", currentMemahamiId.value, {
            memahami: memahami.value,
            berkesadaran: berkesadaranMemahami.value,
            bermakna: bermaknaMemahami.value,
            menggembirakan: menggembirakanMemahami.value,
            asesmen_memahami: asesmenMemahami.value,
        });

        const mengaplikasikanId = await postOrPut("rpk-mengaplikasikan", currentMengaplikasikanId.value, {
            mengaplikasikan: mengaplikasikan.value,
            berkesadaran: berkesadaranMengaplikasikan.value,
            bermakna: bermaknaMengaplikasikan.value,
            menggembirakan: menggembirakanMengaplikasikan.value,
            asesmen_mengaplikasikan: asesmenMengaplikasikan.value,
        });

        const merefleksiId = await postOrPut("rpk-merefleksi", currentMerefleksiId.value, {
            merefleksi: merefleksi.value,
            berkesadaran: berkesadaranMerefleksi.value,
            bermakna: bermaknaMerefleksi.value,
            menggembirakan: menggembirakanMerefleksi.value,
            asesmen_merefleksi: asesmenMerefleksi.value,
        });

        const adjustedDate = tanggal.value
            ? new Date(tanggal.value.getTime() - tanggal.value.getTimezoneOffset() * 60000)
                .toISOString()
                .split("T")[0]
            : null;

        await api.put(`/rpk/${id}`, {
            rombel_id: rombel.value,
            instructor: namaGuru.value?.id,
            tutor: tutor.value,
            hari_tanggal: adjustedDate,
            phase_id: fase.value,
            waktu: studyTime.value,
            tujuan_pembelajaran: tujuanPemb.value,
            lintas_disiplin_ilmu: lintasDis.value,
            pemanfaatan_digital: pemanfaatan.value,
            kemitraan_pembelajaran: kemitraanPemb.value,
            dpl_1: dpl1.value,
            dpl_2: dpl2.value,
            dpl_3: dpl3.value,
            dpl_4: dpl4.value,
            dpl_5: dpl5.value,
            dpl_6: dpl6.value,
            dpl_7: dpl7.value,
            dpl_8: dpl8.value,
            memahami_id: memahamiId,
            mengaplikasikan_id: mengaplikasikanId,
            merefleksi_id: merefleksiId,
        });

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'RPK updated successfully.',
            life: 3000
        });
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: err.message,
            life: 3000
        });
        console.error(err);
    }
};

const searchInstructor = (event) => {
    const query = event.query.toLowerCase();
    filteredInstructor.value = selectedInstructor.value.filter(i =>
        i.name.toLowerCase().includes(query)
    );
};

onMounted(async () => {
    await fetchSelectedFase();
    await fetchSelectedRombel();
    await fetchSelectedInstructor("asc");
    filteredInstructor.value = [...selectedInstructor.value];
    await fetchExistingRPK();
});

const back = () => router.back();
</script>


<template>
    <div class="m-5">
        <Button icon="pi pi-arrow-left" label="Back" @click="back" />
    </div>
    <Card>
        <template #header>
            <h1 class="font-xl font-bold m-5">Edit Learning Plan</h1>
        </template>

        <template #content>
            <!-- Identity Section -->
            <Card class="mb-10">
                <template #content>
                    <div class="space-y-5">
                        <h1>Identity</h1>
                        <div class="flex flex-row space-x-5">
                            <div class="w-1/2 space-y-5">
                                <div class="flex flex-col space-y-2">
                                    <Label> Class </Label>
                                    <Select v-model="rombel" :options="selectedRombel" option-label="name"
                                        option-value="id" placeholder="-- Select Class --" class="w-full" />
                                </div>
                                <div class="flex flex-col space-y-2">
                                    <Label>Day / Date</Label>
                                    <DatePicker v-model="tanggal" showIcon fluid iconDisplay="input"
                                        placeholder="-- Day / Date --" class="w-full" />
                                </div>
                                <div class="flex flex-col space-y-2">
                                    <Label>Study Time</Label>
                                    <InputText v-model="studyTime" placeholder="Example: 07:00 - 09:30 WIB"
                                        class="w-full" />

                                </div>
                            </div>
                            <div class="w-1/2 space-y-5">
                                <div class="flex flex-col space-y-2">
                                    <Label>Instructor</Label>
                                    <AutoComplete v-model="namaGuru" :suggestions="filteredInstructor"
                                        optionLabel="name" dataKey="id" dropdown forceSelection
                                        @complete="searchInstructor" placeholder="-- Select Instructor --"
                                        class="w-full" />
                                </div>
                                <div class="flex flex-col space-y-2">
                                    <Label>Tutor (optional)</Label>
                                    <InputText v-model="tutor" class="w-full" />
                                </div>
                                <div class="flex flex-col space-y-2">
                                    <Label>Phase</Label>
                                    <Select v-model="fase" :options="selectedFase" option-label="phase"
                                        option-value="id" placeholder="-- Select Learning Phase --" class="w-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Instructional Design -->
            <Card class="mb-10">
                <template #header>
                    <div class="m-5">
                        <h1>Instructional Design</h1>
                    </div>
                </template>
                <template #content>
                    <div class="flex flex-row space-x-5">
                        <div class="w-1/2 space-y-5">
                            <div class="flex flex-col space-y-2">
                                <label>Learning Objective</label>
                                <Textarea v-model="tujuanPemb" class="w-full" />
                            </div>
                            <div class="flex flex-col space-y-2">
                                <label>Interdisciplinary</label>
                                <Textarea v-model="lintasDis" class="w-full" />
                            </div>
                        </div>
                        <div class="w-1/2 space-y-5">
                            <div class="flex flex-col space-y-2">
                                <label>Digital Utilization</label>
                                <Textarea v-model="pemanfaatan" class="w-full" />
                            </div>
                            <div class="flex flex-col space-y-2">
                                <label>Learning Partnership</label>
                                <Textarea v-model="kemitraanPemb" class="w-full" />
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Graduate Profile Dimensions -->
            <Card class="mb-10">
                <template #header>
                    <div class="m-5">
                        <h1>Dimensi Profil Lulusan</h1>
                    </div>
                </template>
                <template #content>
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="dpl1" :binary="true" inputId="gpd1" />
                            <label for="gpd1"><b>DPL 1:</b> Keimanan dan ketakwaan Terhadap Tuhan YME</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="dpl2" :binary="true" inputId="gpd2" />
                            <label for="gpd2"><b>DPL 2:</b> Kewargaan</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="dpl3" :binary="true" inputId="gpd3" />
                            <label for="gpd3"><b>DPL 3:</b> Penalaran Kritis</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="dpl4" :binary="true" inputId="gpd4" />
                            <label for="gpd4"><b>DPL 4:</b> Kreativitas</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="dpl5" :binary="true" inputId="gpd5" />
                            <label for="gpd5"><b>DPL 5:</b> Kolaborasi</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="dpl6" :binary="true" inputId="gpd6" />
                            <label for="gpd6"><b>DPL 6:</b> Kemandirian</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="dpl7" :binary="true" inputId="gpd7" />
                            <label for="gpd7"><b>DPL 7:</b> Kesehatan</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="dpl8" :binary="true" inputId="gpd8" />
                            <label for="gpd8"><b>DPL 8:</b> Komunikasi</label>
                        </div>
                    </div>
                </template>
            </Card>

            <Card>
                <template #content>
                    <div class="flex flex-row space-x-5">
                        <div class="w-1/3 space-y-5">
                            <h1>Pengalaman Belajar</h1>
                            <div class="flex flex-col space-y-2">
                                <label>Memahami</label>
                                <Textarea v-model="memahami" class="w-full" />
                            </div>
                            <div class="flex flex-col space-y-2">
                                <label>Mengaplikasikan</label>
                                <Textarea v-model="mengaplikasikan" class="w-full" />
                            </div>
                            <div class="flex flex-col space-y-2">
                                <label>Merefleksi</label>
                                <Textarea v-model="merefleksi" class="w-full" />
                            </div>
                        </div>
                        <div class="w-1/3 space-y-5">
                            <h1 class="mb-10">Prinsip Pembelajaran</h1>
                            <div class="flex flex-col space-y-2 ">
                                <div class="flex space-x-1 items-center">
                                    <Checkbox v-model="berkesadaranMemahami" :binary="true" inputId="pm1" />
                                    <label for="gpd8">Berkesadaran</label>
                                </div>
                                <div class="flex space-x-1 items-center">
                                    <Checkbox v-model="bermaknaMemahami" :binary="true" inputId="pm2" />
                                    <label for="gpd8">Bermakna</label>
                                </div>
                                <div class="flex space-x-1 items-center mb-2">
                                    <Checkbox v-model="menggembirakanMemahami" :binary="true" inputId="pm3" />
                                    <label for="gpd8">Menggembirakan</label>
                                </div>
                            </div>
                            <div class="flex flex-col space-y-2">
                                <div class="flex space-x-1 items-center">
                                    <Checkbox v-model="berkesadaranMengaplikasikan" :binary="true" inputId="pm4" />
                                    <label for="gpd8">Berkesadaran</label>
                                </div>
                                <div class="flex space-x-1 items-center">
                                    <Checkbox v-model="bermaknaMengaplikasikan" :binary="true" inputId="pm5" />
                                    <label for="gpd8">Bermakna</label>
                                </div>
                                <div class="flex space-x-1 items-center mb-3">
                                    <Checkbox v-model="menggembirakanMengaplikasikan" :binary="true" inputId="pm6" />
                                    <label for="gpd8">Menggembirakan</label>
                                </div>
                            </div>
                            <div class="flex flex-col space-y-2">
                                <div class="flex space-x-1 items-center">
                                    <Checkbox v-model="berkesadaranMerefleksi" :binary="true" inputId="pm7" />
                                    <label for="gpd8">Berkesadaran</label>
                                </div>
                                <div class="flex space-x-1 items-center">
                                    <Checkbox v-model="bermaknaMerefleksi" :binary="true" inputId="pm8" />
                                    <label for="gpd8">Bermakna</label>
                                </div>
                                <div class="flex space-x-1 items-center">
                                    <Checkbox v-model="menggembirakanMerefleksi" :binary="true" inputId="pm9" />
                                    <label for="gpd8">Menggembirakan</label>
                                </div>
                            </div>
                        </div>
                        <div class="w-1/3 space-y-5">
                            <h1>Asesmen</h1>
                            <div class="flex flex-col space-y-2">
                                <label>Asesmen 1</label>
                                <Textarea v-model="asesmenMemahami" class="w-full" />
                            </div>
                            <div class="flex flex-col space-y-2">
                                <label>Asesmen 2</label>
                                <Textarea v-model="asesmenMengaplikasikan" class="w-full" />
                            </div>
                            <div class="flex flex-col space-y-2">
                                <label>Asesmen 3</label>
                                <Textarea v-model="asesmenMerefleksi" class="w-full" />
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </template>

        <template #footer>
            <div class="flex justify-end">
                <Button label="Update Plan" @click="updateRPK" />
            </div>
        </template>
    </Card>
</template>
