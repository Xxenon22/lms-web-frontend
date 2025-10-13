<script setup>
import api from '../../services/api';
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRoute, useRouter } from 'vue-router';

const toast = useToast();
const route = useRoute();
const id = route.params.id
const router = useRouter()

// Form fields
const rombel = ref("")
const namaGuru = ref("")
const tutor = ref("")
const tanggal = ref("")
const subject = ref("")
const fase = ref("")
const studyTime = ref("")
const tujuanPemb = ref("")
const lintasDis = ref("")
const pemanfaatan = ref("")
const materiPemb = ref("")
const kemitraanPemb = ref("")
const dpl1 = ref(false)
const dpl2 = ref(false)
const dpl3 = ref(false)
const dpl4 = ref(false)
const dpl5 = ref(false)
const dpl6 = ref(false)
const dpl7 = ref(false)
const dpl8 = ref(false)

// Pengalaman belajar
const memahami = ref("")
const mengaplikasikan = ref("")
const merefleksi = ref("")

// Prinsip pembelajaran
const berkesadaranMemahami = ref(false)
const bermaknaMemahami = ref(false)
const menggembirakanMemahami = ref(false)

const berkesadaranMengaplikasikan = ref(false)
const bermaknaMengaplikasikan = ref(false)
const menggembirakanMengaplikasikan = ref(false)

const berkesadaranMerefleksi = ref(false)
const bermaknaMerefleksi = ref(false)
const menggembirakanMerefleksi = ref(false)

// Asesmen
const asesmenMemahami = ref("")
const asesmenMengaplikasikan = ref("")
const asesmenMerefleksi = ref("")

// Options
const selectedFase = ref([])
const selectedRombel = ref([])
const selectedInstructor = ref([])
const selectedSubject = ref([])

const currentMemahamiId = ref("")
const currentMengaplikasikanId = ref("")
const currentMerefleksiId = ref("")


const fetchSelectedFase = async () => {
    try {
        const res = await api.get("/phase")
        selectedFase.value = res.data
    } catch (error) {
        console.error("fetch Phase :", error)
    }
}

const fetchSelectedRombel = async () => {
    try {
        const res = await api.get("/rombel", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        selectedRombel.value = res.data.map(b => ({
            id: b.id,
            name: `${b.grade_name || ''} ${b.name_rombel}`
        }))
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
        const res = await api.get("/mapel")
        selectedSubject.value = res.data.map(s => ({
            id: s.id,
            nama_mapel: s.nama_mapel || "No Subject"
        }))
    } catch (error) {
        console.error("Fetch subject :", error)
    }
}

const fetchExistingRPK = async () => {
    try {
        const res = await api.get(`/rpk/${id}`);
        const data = res.data;

        rombel.value = data.rombel_id
        namaGuru.value = data.instructor ? String(data.instructor) : null
        tutor.value = data.tutor
        tanggal.value = data.hari_tanggal
        subject.value = data.mapel_id
        fase.value = data.phase_id
        studyTime.value = data.waktu
        tujuanPemb.value = data.tujuan_pembelajaran
        lintasDis.value = data.lintas_disiplin_ilmu
        pemanfaatan.value = data.pemanfaatan_digital
        materiPemb.value = data.materi_pembelajaran
        kemitraanPemb.value = data.kemitraan_pembelajaran

        dpl1.value = data.dpl_1
        dpl2.value = data.dpl_2
        dpl3.value = data.dpl_3
        dpl4.value = data.dpl_4
        dpl5.value = data.dpl_5
        dpl6.value = data.dpl_6
        dpl7.value = data.dpl_7
        dpl8.value = data.dpl_8

        // child table
        // currentMemahamiId.value = data.rpk_memahami?.id
        memahami.value = data.memahami || ""
        berkesadaranMemahami.value = data.memahami_berkesadaran
        bermaknaMemahami.value = data.memahami_bermakna
        menggembirakanMemahami.value = data.memahami_menggembirakan
        asesmenMemahami.value = data.asesmen_memahami

        // currentMengaplikasikanId.value = data.rpk_mengaplikasikan?.id
        mengaplikasikan.value = data.mengaplikasikan || ""
        berkesadaranMengaplikasikan.value = data.mengaplikasikan_berkesadaran
        bermaknaMengaplikasikan.value = data.mengaplikasikan_bermakna
        menggembirakanMengaplikasikan.value = data.mengaplikasikan_menggembirakan
        asesmenMengaplikasikan.value = data.asesmen_mengaplikasikan

        // currentMerefleksiId.value = data.rpk_merefleksi?.id
        merefleksi.value = data.merefleksi || ""
        berkesadaranMerefleksi.value = data.merefleksi_berkesadaran
        bermaknaMerefleksi.value = data.merefleksi_bermakna
        menggembirakanMerefleksi.value = data.merefleksi_menggembirakan
        asesmenMerefleksi.value = data.asesmen_merefleksi
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Failed', detail: 'Failed to load data.', life: 3000 })
    }
}

const updateRPK = async () => {
    try {
        await api.put(`/rpk/${id}`, {
            rombel_id: rombel.value,
            instructor: namaGuru.value,
            tutor: tutor.value,
            hari_tanggal: tanggal.value,
            mapel_id: subject.value,
            phase_id: fase.value,
            waktu: studyTime.value,
            tujuan_pembelajaran: tujuanPemb.value,
            lintas_disiplin_ilmu: lintasDis.value,
            pemanfaatan_digital: pemanfaatan.value,
            materi_pembelajaran: materiPemb.value,
            kemitraan_pembelajaran: kemitraanPemb.value,
            dpl_1: dpl1.value,
            dpl_2: dpl2.value,
            dpl_3: dpl3.value,
            dpl_4: dpl4.value,
            dpl_5: dpl5.value,
            dpl_6: dpl6.value,
            dpl_7: dpl7.value,
            dpl_8: dpl8.value,

            memahami: memahami.value,
            berkesadaranMemahami: berkesadaranMemahami.value,
            bermaknaMemahami: bermaknaMemahami.value,
            menggembirakanMemahami: menggembirakanMemahami.value,
            asesmenMemahami: asesmenMemahami.value,

            mengaplikasikan: mengaplikasikan.value,
            berkesadaranMengaplikasikan: berkesadaranMengaplikasikan.value,
            bermaknaMengaplikasikan: bermaknaMengaplikasikan.value,
            menggembirakanMengaplikasikan: menggembirakanMengaplikasikan.value,
            asesmenMengaplikasikan: asesmenMengaplikasikan.value,

            merefleksi: merefleksi.value,
            berkesadaranMerefleksi: berkesadaranMerefleksi.value,
            bermaknaMerefleksi: bermaknaMerefleksi.value,
            menggembirakanMerefleksi: menggembirakanMerefleksi.value,
            asesmenMerefleksi: asesmenMerefleksi.value,

            currentMemahamiId: currentMemahamiId.value,
            currentMengaplikasikanId: currentMengaplikasikanId.value,
            currentMerefleksiId: currentMerefleksiId.value
        });
        toast.add({ severity: 'success', summary: 'Success', detail: 'Plan updated successfully.', life: 3000 })
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Update Failed', detail: err.message, life: 3000 })
    }
}

const formatDate = (hari_tanggal) => {
    if (!hari_tanggal) return "Date not available";
    return new Intl.DateTimeFormat("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Jakarta",
    }).format(new Date(hari_tanggal));
};


onMounted(async () => {
    await fetchSelectedFase()
    await fetchSelectedRombel()
    await fetchSelectedInstructor("asc")
    await fetchSelectedSubject()
    await fetchExistingRPK()
})

const back = () => {
    router.back()
}
</script>

<template>
    <div class="m-5">
        <Button icon="pi pi-arrow-left" label="Back" @click="back" />
    </div>
    <Card>
        <template #header>
            <h1 class="m-5">Edit Class Learning Plan</h1>
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
                                    <Label>Subject</Label>
                                    <Select v-model="subject" :options="selectedSubject" option-label="nama_mapel"
                                        option-value="id" placeholder="-- Select Subject --" class="w-full" />
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
                                    <Select v-model="namaGuru" :options="selectedInstructor" option-label="name"
                                        option-value="id" placeholder="-- Select Instructor --" class="w-full" />
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
