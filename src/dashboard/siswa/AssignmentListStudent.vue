<script setup>
import { ref, onMounted } from "vue";
import api from "../../services/api";
import { useRouter } from "vue-router";

const router = useRouter();
const materiList = ref([]);
const userId = ref(null);
const isLoading = ref(true);

// Ambil materi berdasarkan user login
const fetchMateriByUserClass = async () => {
    try {
        const { data: userData } = await api.get("/auth/profile");
        userId.value = userData?.id;

        const { data: materiArray } = await api.get(`/module-pembelajaran/siswa/${userId.value}`);
        const { data: semuaJawaban } = await api.get("/jawaban-siswa");

        // pakai Map untuk simpan materi unik berdasarkan kelas+penugasan
        const uniqueMateri = new Map();


        for (let m of materiArray) {
            let jawabanMatch = semuaJawaban.find(j =>
                Number(j.user_id) === Number(userId.value) &&
                (
                    (j.bank_soal_id && m.bank_soal_id && Number(j.bank_soal_id) === Number(m.bank_soal_id)) ||
                    (j.soal_id && m.soal_id && Number(j.soal_id) === Number(m.soal_id)) // fallback kalau pakai soal_id
                )
            );
            // console.log("Materi:", m.bank_soal_id, "Jawaban ketemu:", jawabanMatch);

            m.nilai = jawabanMatch ? Number(jawabanMatch.nilai) : null;

            if (m.guru_foto && !m.guru_foto.startsWith("http")) {
                m.guru_foto = `${import.meta.env.VITE_API_URL}${m.guru_foto}`;
            }

            const key = `${m.kelas_id}-${m.judul_penugasan}`;
            if (!uniqueMateri.has(key)) {
                uniqueMateri.set(key, m);
            }
        }

        materiList.value = Array.from(uniqueMateri.values());
        isLoading.value = false;

        // console.log("semua jawaban :", semuaJawaban)
        // console.log("Materi unik:", materiList.value);
    } catch (err) {
        console.error("Fetch Materi Error:", err);
        isLoading.value = false;
    }
};

const isCompleted = (m) => {
    const pdf = m.pdf_selesai ?? m.progress_materi?.[0]?.pdf_selesai;
    const vid = m.video_selesai ?? m.progress_materi?.[0]?.video_selesai;
    return pdf === true && vid === true;
};

const goToMateri = (kelasId) => {
    router.push({ name: "Join-Class", params: { id: kelasId } });
};

onMounted(() => {
    fetchMateriByUserClass();
});
</script>

<template>
    <div v-if="isLoading" class="flex justify-center py-10">
        <ProgressSpinner />
    </div>

    <div v-else-if="materiList.length === 0" class="text-center text-gray-400 mb-8">
        You have not enrolled in any classes yet.
    </div>
    <div v-else>
        <Card v-for="m in materiList" :key="m.id" class="mb-3">
            <template #content>
                <div class="flex justify-between items-center">
                    <div class="flex items-center">
                        <Avatar v-if="m.guru_foto" :image="m.guru_foto" class="mr-2"
                            style="background-color: #ece9fc; color: #2a1261" shape="circle" />
                        <Avatar v-else label="G" class="mr-2" style="background-color: #ece9fc; color: #2a1261"
                            shape="circle" />
                        <div>
                            <h1 class="font-bold">{{ m.nama_mapel ?? 'No Subject' }}</h1>
                            <p>{{ m.judul_penugasan }}</p>
                        </div>
                    </div>
                    <div class="space-x-2">
                        <!-- <Tag :severity="m.nilai !== null ? 'info' : 'secondary'"
                            :value="m.nilai !== null ? m.nilai : 'Pending evaluation'" /> -->
                        <Tag :value="isCompleted(m) ? 'Completed' : 'Not Completed'"
                            :severity="isCompleted(m) ? 'success' : 'danger'"
                            @click="!isCompleted(m) && goToMateri(m.kelas_id)" class="cursor-pointer" />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
