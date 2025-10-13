<script setup>
import api from '../../services/api';
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const namaGuru = ref("")
const tanggal = ref("")
const subject = ref("")
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
const selectedSubject = ref([])

const fetchSelectedRombel = async () => {
    try {
        const res = await api.get("/kelas");
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
        const selectedRombelStudent = selectedRombel.value.find(b => b.id === rombel.value);
        const selectedInstructorRpk = selectedInstructor.value.find(b => b.id === namaGuru.value);
        const selectedSubjectRpk = selectedSubject.value.find(b => b.id === subject.value);

        if (!selectedRombelStudent || !selectedInstructorRpk || !selectedSubjectRpk) {
            toast.add({ severity: 'error', summary: 'Invalid Selection', detail: 'Please fill out all fields correctly.', life: 3000 });
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
            mapel_id: selectedSubjectRpk.id,
            rombel_id: selectedRombelStudent.id,
            hari_tanggal: tanggal.value,
            instructor: selectedInstructorRpk.id,
            waktu: studyTime.value,
            refleksi_siswa: refleksiSiswa.value,
            refleksi_guru: refleksiGuru.value,
            tngkt_pencapaian: tngktPencapaian.value,
            desk_pencapaian: deskPencapaian.value,
            follow_up: followUp.value,
            pendampingan_siswa: pendampinganSiswa.value,
            keterangan: notes.value
            // ⚡ guru_id jangan dikirim dari frontend → backend ambil dari JWT
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
        namaGuru.value = "";
        subject.value = "";

    } catch (err) {
        console.error("Submit RPK error:", err);
        toast.add({ severity: 'error', summary: 'Failed', detail: err.message, life: 3000 });
    }
};

onMounted(async () => {
    await fetchSelectedRombel()
    await fetchSelectedSubject()
    await fetchSelectedInstructor("asc")
})
</script>

<template>
    <Card>
        <template #header>
            <h1 class="m-5">Learning Reflection</h1>
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
                                    <Label> Subject </Label>
                                    <Select v-model="subject" :options="selectedSubject" option-label="nama_mapel"
                                        option-value="id" placeholder="-- Select Grade --" class="w-full" />
                                </div>
                                <div class="flex flex-col space-y-2">
                                    <Label> Class </Label>
                                    <Select v-model="rombel" :options="selectedRombel" option-label="name"
                                        option-value="id" placeholder="-- Select Class --" class="w-full" />
                                </div>
                                <div class="flex flex-col space-y-2">
                                    <Label> Study Time</Label>
                                    <InputText v-model="studyTime" placeholder="Example: 07:00 - 09:30 WIB"
                                        class="w-full" />

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
                                    <Select v-model="namaGuru" :options="selectedInstructor" option-label="name"
                                        option-value="id" placeholder="-- Select Instructor --" class="w-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Reflection-->
            <Card class="mb-10">
                <template #header>
                    <div class="m-5">
                        <h1>Reflection</h1>
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
        </template>

        <template #footer>
            <div class="flex justify-end">
                <Button label="Save Plan" @click="submitRPK" />
            </div>
        </template>
    </Card>
    <Toast />
</template>