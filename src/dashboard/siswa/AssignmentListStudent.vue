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

        const uniqueMateri = new Map();

        for (let m of materiArray) {
            const jawabanMatch = semuaJawaban.find(j =>
                Number(j.user_id) === Number(userId.value) &&
                m.bank_soal_id &&
                j.bank_soal_id &&
                Number(m.bank_soal_id) === Number(j.bank_soal_id)
            );


            m.nilai = jawabanMatch?.nilai ? Number(jawabanMatch.nilai) : 0;

            if (typeof m.guru_foto === "string" && m.guru_foto.length > 0) {
                if (!m.guru_foto.startsWith("http")) {
                    m.guru_foto = `${import.meta.env.VITE_API_URL}api/uploads/photo-profile/${m.guru_foto}`;
                }
            } else {
                m.guru_foto = null;
            }


            const key = `${m.kelas_id}-${m.judul_penugasan}`;
            if (!uniqueMateri.has(key)) {
                uniqueMateri.set(key, m);
            }
        }

        materiList.value = Array.from(uniqueMateri.values());
        isLoading.value = false;

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

    <div v-else-if="materiList.length === 0" class="text-center text-gray-400 mb-8 m-15">
        You have not enrolled in any classes yet.
    </div>
    <div v-else>
        <Card v-for="m in materiList" :key="m.id" class="m-5">
            <template #content>
                <div class="flex justify-between items-center">
                    <div class="flex items-center">
                        <Avatar v-if="m.guru_foto" :image="m.guru_foto" class="mr-2"
                            style="background-color: #ece9fc; color: #2a1261" shape="circle" size="large" />
                        <Avatar v-else icon="pi pi-user" class="mr-2" style="background-color: #ece9fc; color: #2a1261"
                            shape="circle" size="large" />
                        <div>
                            <h1 class="font-bold">{{ m.nama_mapel ?? 'No Subject' }}</h1>
                            <p>{{ m.judul_penugasan }}</p>
                        </div>
                    </div>
                    <div class="space-x-2">
                        <Tag severity="secondary" :value="`${m.nilai} / 100`" />
                        <Tag :value="isCompleted(m) ? 'Task Completed' : 'Not Completed'"
                            :severity="isCompleted(m) ? 'success' : 'danger'"
                            @click="!isCompleted(m) && goToMateri(m.kelas_id)" class="cursor-pointer" />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
