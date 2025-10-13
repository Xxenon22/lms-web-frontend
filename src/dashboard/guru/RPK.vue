<script setup>
import api from '../../services/api';
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const guruId = ref(localStorage.getItem("id"));
const rombel = ref("")
const namaGuru = ref("")
const tutor = ref("")
const tanggal = ref("")
const subject = ref("")
const fase = ref("")
// const instructor = ref("")
const studyTime = ref("")
const tujuanPemb = ref("")
const lintasDis = ref("")
const pemanfaatan = ref("")
// const materiPemb = ref("")
const kemitraanPemb = ref("")
const dpl1 = ref(false)
const dpl2 = ref(false)
const dpl3 = ref(false)
const dpl4 = ref(false)
const dpl5 = ref(false)
const dpl6 = ref(false)
const dpl7 = ref(false)
const dpl8 = ref(false)
const memahami = ref("")
const mengaplikasikan = ref("")
const merefleksi = ref("")
const berkesadaranMemahami = ref(false)
const bermaknaMemahami = ref(false)
const menggembirakanMemahami = ref(false)

const berkesadaranMengaplikasikan = ref(false)
const bermaknaMengaplikasikan = ref(false)
const menggembirakanMengaplikasikan = ref(false)

const berkesadaranMerefleksi = ref(false)
const bermaknaMerefleksi = ref(false)
const menggembirakanMerefleksi = ref(false)

const asesmenMemahami = ref("")
const asesmenMengaplikasikan = ref("")
const asesmenMerefleksi = ref("")

const selectedFase = ref([])
const selectedRombel = ref([])
const selectedInstructor = ref([])
const selectedSubject = ref([])


// fungsi resetForm
const resetForm = () => {
    rombel.value = ""
    namaGuru.value = ""
    tutor.value = ""
    tanggal.value = ""
    subject.value = ""
    fase.value = ""
    // instructor.value = ""
    studyTime.value = ""
    tujuanPemb.value = ""
    lintasDis.value = ""
    pemanfaatan.value = ""
    kemitraanPemb.value = ""

    dpl1.value = false
    dpl2.value = false
    dpl3.value = false
    dpl4.value = false
    dpl5.value = false
    dpl6.value = false
    dpl7.value = false
    dpl8.value = false

    memahami.value = ""
    mengaplikasikan.value = ""
    merefleksi.value = ""

    berkesadaranMemahami.value = false
    bermaknaMemahami.value = false
    menggembirakanMemahami.value = false

    berkesadaranMengaplikasikan.value = false
    bermaknaMengaplikasikan.value = false
    menggembirakanMengaplikasikan.value = false

    berkesadaranMerefleksi.value = false
    bermaknaMerefleksi.value = false
    menggembirakanMerefleksi.value = false

    asesmenMemahami.value = ""
    asesmenMengaplikasikan.value = ""
    asesmenMerefleksi.value = ""
}

const fetchSelectedFase = async (order = "asc") => {
    try {
        const res = await api.get("/phase")
        selectedFase.value = res.data
            .sort((a, b) => {
                if (order === "asc") {
                    return a.phase.localeCompare(b.phase)
                } else {
                    return b.phase.localeCompare(a.phase)
                }
            })
    } catch (error) {
        console.error("fetch Phase :", error)
    }
}

const fetchSelectedRombel = async () => {
    try {
        const res = await api.get("/kelas", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        selectedRombel.value = res.data.map(b => ({
            id: b.rombel_id,
            name: `${b.grade_lvl || ''} ${b.name_rombel}`
        }));
    } catch (error) {
        console.error("fetch rombel :", error)
    }
}

const fetchSelectedInstructor = async (order = "asc") => {
    try {
        const res = await api.get("/teacher")
        selectedInstructor.value = res.data.map(t => ({
            id: t.id,
            name: t.name || "No Name"
        }))
            .sort((a, b) => {
                if (order === "asc") {
                    return a.name.localeCompare(b.name) // A-Z
                } else {
                    return b.name.localeCompare(a.name) // Z-A
                }
            })
    } catch (error) {
        console.error("fetch instructor :", error)
    }
}

const fetchSelectedSubject = async () => {
    try {
        const res = await api.get('/mapel')
        selectedSubject.value = res.data
    } catch (error) {
        console.error("Fetch subject :", error)
    }
}

const submitRPK = async () => {
    try {
        // --- 1. Insert ke rpk_memahami ---
        const { data: memahamiRes } = await api.post("/rpk-memahami", {
            memahami: memahami.value,
            berkesadaran: berkesadaranMemahami.value,
            bermakna: bermaknaMemahami.value,
            menggembirakan: menggembirakanMemahami.value,
            asesmen_memahami: asesmenMemahami.value
        });
        const memahamiId = memahamiRes.id;

        // --- 2. Insert ke rpk_mengaplikasikan ---
        const { data: mengaplikasikanRes } = await api.post("/rpk-mengaplikasikan", {
            mengaplikasikan: mengaplikasikan.value,
            berkesadaran: berkesadaranMengaplikasikan.value,
            bermakna: bermaknaMengaplikasikan.value,
            menggembirakan: menggembirakanMengaplikasikan.value,
            asesmen_mengaplikasikan: asesmenMengaplikasikan.value
        });
        const mengaplikasikanId = mengaplikasikanRes.id;

        // --- 3. Insert ke rpk_merefleksi ---
        const { data: merefleksiRes } = await api.post("/rpk-merefleksi", {
            merefleksi: merefleksi.value,
            berkesadaran: berkesadaranMerefleksi.value,
            bermakna: bermaknaMerefleksi.value,
            menggembirakan: menggembirakanMerefleksi.value,
            asesmen_merefleksi: asesmenMerefleksi.value
        });
        const merefleksiId = merefleksiRes.id;

        // --- 4. Insert ke rpk_db (hubungkan semuanya) ---
        // Catatan: `guru_id` nanti ambil dari token JWT
        const { data: rpkRes } = await api.post("/rpk", {
            rombel_id: rombel.value,
            tutor: tutor.value,
            hari_tanggal: tanggal.value,
            mapel_id: subject.value,
            phase_id: fase.value,
            instructor: namaGuru.value,
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
            guru_id: parseInt(guruId.value)

        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        toast.add({
            severity: "success",
            summary: "Success",
            detail: "Plan has been successfully saved",
            life: 3000,
        });

        resetForm();
    } catch (err) {
        console.error(err);
        toast.add({
            severity: "error",
            summary: "Failed",
            detail: err.response?.data?.message || err.message,
            life: 3000,
        });
    }
};
// const submitRpk2 = async

onMounted(() => {
    guruId.value = localStorage.getItem("id");
    fetchSelectedFase("asc")
    fetchSelectedRombel()
    fetchSelectedInstructor("asc")
    fetchSelectedSubject()
})
</script>

<template>
    <Card>
        <template #header>
            <h1 class="m-5">Learning Plan</h1>
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
                                    <Label> Day / Date</Label>
                                    <DatePicker v-model="tanggal" showIcon fluid iconDisplay="input"
                                        placeholder="Example: Monday, 14 July 2025" class="w-full" />
                                </div>
                                <div class="flex flex-col space-y-2">
                                    <Label> Subject </Label>
                                    <Select v-model="subject" :options="selectedSubject" option-label="nama_mapel"
                                        option-value="id" placeholder="-- Select Subject --" class="w-full" />
                                </div>
                                <div class="flex flex-col space-y-2">
                                    <Label> Study Time</Label>
                                    <DatePicker v-model="studyTime" showIcon fluid iconDisplay="input" timeOnly
                                        placeholder="Example: 07:00 - 09:30 WIB" class="w-full">
                                        <template #inputicon="slotProps">
                                            <i class="pi pi-clock" @click="slotProps.clickCallback" />
                                        </template>
                                    </DatePicker>
                                </div>
                            </div>
                            <div class="w-1/2 space-y-5">
                                <div class="flex flex-col space-y-2">
                                    <Label> Instructor</Label>
                                    <Select v-model="namaGuru" :options="selectedInstructor" option-label="name"
                                        option-value="id" placeholder="-- Select Instructor --" class="w-full" />
                                </div>
                                <div class="flex flex-col space-y-2">
                                    <Label> Tutor (optional)</Label>
                                    <InputText v-model="tutor" class="w-full" />
                                </div>
                                <div class="flex flex-col space-y-2">
                                    <Label> Phase </Label>
                                    <Select v-model="fase" :options="selectedFase" option-label="phase"
                                        option-value="id" placeholder="-- Select Learning Phase --" class="w-full" />
                                </div>
                                <!-- <div class="flex flex-col space-y-2">
                                    <Label> Instructor (optional)</Label>
                                    <InputText v-model="instructor" class="w-full" />
                                </div> -->
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
                            <!-- <div class="flex flex-col space-y-2">
                                <label>Learning Material</label>
                                <Textarea v-model="materiPemb" class="w-full" />
                            </div> -->
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
                            <label for="gpd1"><b>DPL 1:</b> Keimanan dan ketakwaan terhadap Tuhan YME </label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="dpl2" :binary="true" inputId="gpd2" />
                            <label for="gpd2"><b>DPL 2:</b> Kewargaan </label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="dpl3" :binary="true" inputId="gpd3" />
                            <label for="gpd3"><b>DPL 3:</b> Penalaran Kritis </label>
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
                                    <Checkbox v-model="berkesadaranMemahami" :binary="true" inputId="gpd8" />
                                    <label for="gpd8">Berkesadaran</label>
                                </div>
                                <div class="flex space-x-1 items-center">
                                    <Checkbox v-model="bermaknaMemahami" :binary="true" inputId="gpd8" />
                                    <label for="gpd8">Bermakna</label>
                                </div>
                                <div class="flex space-x-1 items-center mb-2">
                                    <Checkbox v-model="menggembirakanMemahami" :binary="true" inputId="gpd8" />
                                    <label for="gpd8">Menggembirakan</label>
                                </div>
                            </div>
                            <div class="flex flex-col space-y-2">
                                <div class="flex space-x-1 items-center">
                                    <Checkbox v-model="berkesadaranMengaplikasikan" :binary="true" inputId="gpd8" />
                                    <label for="gpd8">Berkesadaran</label>
                                </div>
                                <div class="flex space-x-1 items-center">
                                    <Checkbox v-model="bermaknaMengaplikasikan" :binary="true" inputId="gpd8" />
                                    <label for="gpd8">Bermakna</label>
                                </div>
                                <div class="flex space-x-1 items-center mb-3">
                                    <Checkbox v-model="menggembirakanMengaplikasikan" :binary="true" inputId="gpd8" />
                                    <label for="gpd8">Menggembirakan</label>
                                </div>
                            </div>
                            <div class="flex flex-col space-y-2">
                                <div class="flex space-x-1 items-center">
                                    <Checkbox v-model="berkesadaranMerefleksi" :binary="true" inputId="gpd8" />
                                    <label for="gpd8">Berkesadaran</label>
                                </div>
                                <div class="flex space-x-1 items-center">
                                    <Checkbox v-model="bermaknaMerefleksi" :binary="true" inputId="gpd8" />
                                    <label for="gpd8">Bermakna</label>
                                </div>
                                <div class="flex space-x-1 items-center">
                                    <Checkbox v-model="menggembirakanMerefleksi" :binary="true" inputId="gpd8" />
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
                <Button label="Save Plan" @click="submitRPK" />
            </div>
        </template>
    </Card>
</template>
