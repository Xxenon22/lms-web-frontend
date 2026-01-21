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

            const { data: materiArray } = await api.get(
                `/module-pembelajaran/siswa/${userId.value}`
            );

            const { data: semuaJawaban } = await api.get("/jawaban-siswa");
            const { data: progressList } = await api.get(`/progress-materi/${userId.value}`);

            materiList.value = materiArray.map((m) => {
                const progress = progressList.find(p =>
                    Number(p.materi_id) === Number(m.id) &&
                    Number(p.user_id) === Number(userId.value)
                );

                const jawabanMatch = semuaJawaban.find(j =>
                    // Number(j.user_id) === Number(userId.value) &&
                    Number(j.bank_soal_id) === Number(m.bank_soal_id)
                );

                return {
                    ...m,
                    progress_materi: progress ? [progress] : [],
                    nilai: jawabanMatch?.nilai ? Number(jawabanMatch.nilai) : 0,
                    guru_foto: m.guru_foto
                        ? `${import.meta.env.VITE_API_URL}${m.guru_foto}?v=${Date.now()}`
                        : null
                };

            });

            isLoading.value = false;
        } catch (err) {
            console.error("Fetch Materi Error:", err);
            isLoading.value = false;
        }
    };

    const formatRombel = (rombel) => {
        // if (!rombel) return "Kelas Umum";

        if (rombel.type === "collab") {
            return rombel.colab_class || "Collab Class";
        }

        return `${rombel.grade_lvl || ""} ${rombel.major || ""} ${rombel.name_rombel || ""}`.trim();
    };


    const isCompleted = (m) => {
        return !!m.progress_materi?.[0]?.is_submitted;
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
                        <Avatar v-if="m.guru_foto" :image="m.guru_foto" class="mr-2 object-cover"
                            style="background-color: #ece9fc; color: #2a1261" shape="circle" size="large" />
                        <Avatar v-else icon="pi pi-user" class="mr-2" style="background-color: #ece9fc; color: #2a1261"
                            shape="circle" size="large" />
                        <div>
                            <h1 class="font-bold">{{ m.judul }} </h1>
                            <p>
                                {{ m.nama_mapel ?? 'No Subject' }} -
                                {{ formatRombel(m.rombel) }}
                            </p>
                        </div>
                    </div>
                    <div class="space-x-2">
                        <Tag severity="secondary" :value="`${m.nilai} / 100`" />
                        <Tag :value="isCompleted(m) ? 'Task Completed' : 'Not Completed'"
                            :severity="isCompleted(m) ? 'success' : 'danger'" @click="goToMateri(m.kelas_id)"
                            class="cursor-pointer" />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
