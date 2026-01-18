<script setup>
import api from '../../services/api';
import { ref, onMounted, nextTick } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRoute, useRouter } from 'vue-router';

const toast = useToast();
const route = useRoute();
const id = route.params.id
const router = useRouter()

const kelasId = ref(null);
const rombel = ref("")
const namaGuru = ref(null)
const tanggal = ref("")
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

const fetchSelectedRombel = async () => {
    try {
        const res = await api.get("/kelas", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        selectedRombel.value = res.data.map(b => ({
            id: b.id, // ⬅️ kelas_id
            rombel_id: b.rombel_id,
            name: `${b.grade_lvl || ''} ${b.major || ''} ${b.name_rombel || ''} ${b.colab_class || ''} - ${b.nama_mapel}`
        }));
    } catch (error) {
        console.error("fetch rombel :", error)
    }
}

const fetchSelectedInstructor = async (order = "asc") => {
    try {
        const res = await api.get("/teacher");
        selectedInstructor.value = res.data.map(i => ({
            id: Number(i.id),
            name: i.name
        }))
            .sort((a, b) => order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
        // console.log("Instructor list:", selectedInstructor.value);
    } catch (error) {
        console.error("fetch instructor :", error);
    }
};

const fetchExistingLr = async () => {
    try {
        const res = await api.get(`/rpk-refleksi/${id}`);
        const data = res.data;

        kelasId.value = data.kelas_id;
        rombel.value = data.rombel_id;
        tanggal.value = data.hari_tanggal ? new Date(data.hari_tanggal) : null;
        studyTime.value = data.waktu;
        refleksiSiswa.value = data.refleksi_siswa;
        refleksiGuru.value = data.refleksi_guru;
        tngktPencapaian.value = data.tngkt_pencapaian;
        deskPencapaian.value = data.desk_pencapaian;
        followUp.value = data.follow_up;
        pendampinganSiswa.value = data.pendampingan_siswa;
        notes.value = data.keterangan;

        // 🔥 TUNGGU SAMPAI SUGGESTION SIAP
        await nextTick();

        if (data.instructor) {
            const found = selectedInstructor.value.find(
                i => i.id === Number(data.instructor)
            );

            // console.log("Found instructor:", found);

            namaGuru.value = found ?? null;
        } else {
            namaGuru.value = null;
        }

        filteredInstructor.value = [...selectedInstructor.value];

    } catch (error) {
        console.error("failed to fetch existing lr :", error);
    }
};


const updateLr = async () => {
    try {
        const selected = selectedRombel.value.find(
            r => r.id === kelasId.value
        );

        await api.put(`/rpk-refleksi/${id}`, {
            kelas_id: kelasId.value,
            rombel_id: selected?.rombel_id ?? null,
            hari_tanggal: tanggal.value
                ? new Date(tanggal.value.getTime() - tanggal.value.getTimezoneOffset() * 60000)
                    .toISOString()
                    .split('T')[0]
                : null,
            instructor: namaGuru.value?.id ?? null,
            waktu: studyTime.value,
            refleksi_siswa: refleksiSiswa.value,
            refleksi_guru: refleksiGuru.value,
            tngkt_pencapaian: tngktPencapaian.value,
            desk_pencapaian: deskPencapaian.value,
            follow_up: followUp.value,
            pendampingan_siswa: pendampinganSiswa.value,
            keterangan: notes.value
        }, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Plan updated successfully.',
            life: 3000
        });

    } catch (error) {
        console.error("failed to update rpk refleksi :", error);
        toast.add({ severity: 'error', summary: 'Failed', detail: 'Failed to update plan.', life: 3000 });
    }
};

const searchInstructor = (event) => {
    const query = event.query.toLowerCase();
    filteredInstructor.value = selectedInstructor.value.filter(i =>
        i.name.toLowerCase().includes(query)
    );
};

onMounted(async () => {
    await fetchSelectedRombel();
    await fetchSelectedInstructor("asc");
    filteredInstructor.value = [...selectedInstructor.value];
    await fetchExistingLr();

})

const back = () => router.back();
</script>

<template>

    <div class="m-5">
        <Button icon="pi pi-chevron-left" label="Back" @click="back" />
    </div>
    <Card>
        <template #header>
            <h1 class="m-5">Edit Learning Reflection</h1>
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
                                    <Select v-model="kelasId" rombel :options="selectedRombel" option-label="name"
                                        option-value="id" placeholder="-- Select Class--" class="w-full" />
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
                                    <AutoComplete v-model="namaGuru" :suggestions="filteredInstructor"
                                        optionLabel="name" dataKey="id" @complete="searchInstructor" dropdown
                                        forceSelection placeholder="-- Select Instructor --" class="w-full" />

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
                <Button label="Save Plan" @click="updateLr" />
            </div>
        </template>
    </Card>
    <Toast />
</template>