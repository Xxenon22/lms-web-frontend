<script setup>
import api from '../../services/api';
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const namaGuru = ref(null)
const tanggal = ref("")
const rombel = ref("")
const studyTime = ref("")
const refleksiSiswa = ref("")
const refleksiGuru = ref("")
const tngktPencapaian = ref("")
const deskPencapaian = ref("")
const followUp = ref("")
const pendampinganSiswa = ref("")
const notes = ref("")

const selectedRombel = ref([])
const selectedInstructor = ref([])
const filteredInstructor = ref([])
const selectedKelas = ref(null)


const fetchSelectedRombel = async () => {
    try {
        const res = await api.get("/kelas");
        selectedRombel.value = res.data.map(b => ({
            id: b.id,
            rombel_id: b.rombel_id,
            nama_mapel: b.nama_mapel,
            name: `${b.grade_lvl || ''} ${b.major} ${b.name_rombel || ''} - ${b.nama_mapel}`
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

const submitRPK = async () => {
    try {

        if (!selectedKelas.value) {
            toast.add({
                severity: 'error',
                summary: 'Class Required',
                detail: 'Please select a class.',
                life: 3000
            });
            return;
        }

        // Validasi field wajib
        const requiredFields = [
            { field: tanggal.value, label: 'Day / Date' },
            { field: studyTime.value, label: 'Study Time' },
            { field: refleksiSiswa.value, label: "Student's Reflection" },
            { field: refleksiGuru.value, label: "Teacher's Reflection" },
            { field: tngktPencapaian.value, label: 'Level of Achievement' },
            { field: deskPencapaian.value, label: 'Description of Achievement' },
            { field: followUp.value, label: 'Follow Up' },
            { field: pendampinganSiswa.value, label: 'Students in need of guidance' },
            { field: notes.value, label: 'Notes' }
        ];

        for (const item of requiredFields) {
            if (!item.field || item.field.toString().trim() === '') {
                toast.add({
                    severity: 'error',
                    summary: 'Field Required',
                    detail: `${item.label} must be filled out.`,
                    life: 3000
                });
                return;
            }
        }

        // Data yang akan dikirim ke backend
        const insertData = {
            kelas_id: selectedKelas.value.id,
            rombel_id: selectedKelas.value.rombel_id,
            hari_tanggal: formatDateOnly(tanggal.value),
            instructor: namaGuru.value.id,
            waktu: studyTime.value,
            refleksi_siswa: refleksiSiswa.value,
            refleksi_guru: refleksiGuru.value,
            tngkt_pencapaian: tngktPencapaian.value,
            desk_pencapaian: deskPencapaian.value,
            follow_up: followUp.value,
            pendampingan_siswa: pendampinganSiswa.value,
            keterangan: notes.value
        };

        await api.post("/rpk-refleksi", insertData);

        toast.add({ severity: 'success', summary: 'Success', detail: 'Plan has been successfully saved', life: 3000 });

        // Reset form
        tanggal.value = "";
        studyTime.value = "";
        refleksiGuru.value = "";
        refleksiSiswa.value = "";
        tngktPencapaian.value = "";
        deskPencapaian.value = "";
        followUp.value = "";
        pendampinganSiswa.value = "";
        notes.value = "";
        rombel.value = "";
        namaGuru.value = null;
        selectedKelas.value = null;

    } catch (err) {
        console.error("Submit RPK error:", err);
        toast.add({ severity: 'error', summary: 'Failed', detail: err.message, life: 3000 });
    }
};

const searchInstructor = (event) => {
    const query = event.query.toLowerCase();
    filteredInstructor.value = selectedInstructor.value.filter(i =>
        i.name.toLowerCase().includes(query)
    );
};

const formatDateOnly = (date) => {
    if (!date) return null
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

onMounted(async () => {
    await fetchSelectedRombel()
    await fetchSelectedInstructor("asc")
})
</script>

<template>
    <h1 class="m-5 text-2xl">Learning Reflection</h1>

    <!-- Identity Section -->
    <Card class="mb-10 m-5">
        <template #content>
            <div class="space-y-5">
                <h1 class="text-lg font-semibold">Identity</h1>
                <div class="flex flex-row space-x-5">
                    <div class="w-1/2 space-y-5">
                        <div class="flex flex-col space-y-2">
                            <Label> Class </Label>
                            <Select v-model="selectedKelas" :options="selectedRombel" option-label="name"
                                placeholder="-- Select Class --" class="w-full" />
                        </div>
                        <div class="flex flex-col space-y-2">
                            <Label> Study Time</Label>
                            <InputText v-model="studyTime" placeholder="Example: 07:00 - 09:30 WIB" class="w-full" />

                        </div>
                    </div>
                    <div class="w-1/2 space-y-5">
                        <div class="flex flex-col space-y-2">
                            <Label> Day / Date</Label>
                            <DatePicker v-model="tanggal" showIcon fluid iconDisplay="input"
                                placeholder="-- Day / Date --" class="w-full" />
                        </div>
                        <div class="flex flex-col space-y-2">
                            <Label> Instructor</Label>
                            <AutoComplete v-model="namaGuru" :suggestions="filteredInstructor" optionLabel="name"
                                dropdown @complete="searchInstructor" placeholder="-- Select Instructor --"
                                class="w-full" />


                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Card>

    <!-- Reflection-->
    <Card class="mb-10 m-5">
        <template #header>
            <div class="m-5">
                <h1 class="text-lg font-semibold">Reflection</h1>
            </div>
        </template>

        <template #content>
            <div class="flex flex-col space-x-5">
                <div class="w-full space-y-5">
                    <div class="flex flex-col space-y-2">
                        <label>Student's Reflection</label>
                        <Textarea v-model="refleksiSiswa" class="w-full" />
                    </div>
                    <div class="flex flex-col space-y-2">
                        <label>Teacher's Reflection</label>
                        <Textarea v-model="refleksiGuru" class="w-full" />
                    </div>
                    <div class="flex flex-col space-y-2">
                        <label>Level of Achievement</label>
                        <Textarea v-model="tngktPencapaian" class="w-full" />
                    </div>
                    <div class="flex flex-col space-y-2">
                        <label>Description of Achievement</label>
                        <Textarea v-model="deskPencapaian" class="w-full" />
                    </div>
                    <div class="flex flex-col space-y-2">
                        <label>Follow Up</label>
                        <Textarea v-model="followUp" class="w-full" />
                    </div>
                    <div class="flex flex-col space-y-2">
                        <label>Students in need of guidance</label>
                        <Textarea v-model="pendampinganSiswa" class="w-full" />
                    </div>
                    <div class="flex flex-col space-y-2">
                        <label>Notes</label>
                        <Textarea v-model="notes" class="w-full" />
                    </div>
                </div>
            </div>
        </template>
    </Card>

    <div class="flex justify-end m-5">
        <Button label="Submit" @click="submitRPK" class="!bg-[#008C95]" />
    </div>
    <Toast />
</template>