<script setup>
import { onMounted, ref, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue';
import api from '../../services/api';

const toast = useToast();
const route = useRoute();
const kelasId = route.params.id;

const activePanel = ref(null);
const daftarMateri = ref([]);
const soalList = ref({});
const selectedAnswers = ref({});
const jawabanEssaiSiswa = ref({})
const refleksi = ref({});
const userId = ref(null);
const videoSelesai = ref({});
const pdfSelesai = ref({});
const activeSteps = ref({});
const tugasSelesai = ref({})
const pdfContainerRefs = ref({});
const selesaiMateri = ref([]);
const videoDurations = ref({});
const videoWatchTime = ref({});
const watchIntervalIds = ref({});
const progressMateriMap = {}; // simple map, bukan reactive (cukup untuk lookup)
const linkGrup = ref([]);
const profileGuruMap = ref({});
const isLoading = ref(true)
const selectedFile = ref(null);
const fileUrl = ref(null);
const uploaded = ref(false);


// map soal_id -> jawaban (dari jawaban_siswa) untuk user ini
const existingJawabanPGMap = {};
const existingJawabanEssayMap = {};

// computed: cek setiap materi apakah semua soal telah terjawab (mengandalkan selectedAnswers)
const semuaSoalTerjawabPerMateri = computed(() => {
    const result = {};
    for (const materiId in soalList.value) {
        const soalArray = soalList.value[materiId] || [];
        const jawabanMateri = selectedAnswers.value[materiId] || {};
        result[materiId] = soalArray.length > 0 && soalArray.length === Object.keys(jawabanMateri).length;
    }
    return result;
});

const getEmbedUrl = (url) => {
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w\-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?enablejsapi=1` : "";
};

const fetchProgressMateri = async () => {
    try {
        const { data } = await api.get(`/progress-materi/${userId.value}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        data?.forEach(item => {
            progressMateriMap[item.materi_id] = item;

            if (item.langkah_aktif === "4") {
                const materiId = Number(item.materi_id); // pastikan number
                if (!selesaiMateri.value.includes(materiId)) {
                    selesaiMateri.value.push(materiId);
                }
            }

        });
    } catch (err) {
        console.error("fetchProgressMateri error:", err);
    }
};

/** Kirim semua jawaban + refleksi; validasi lengkap, lalu upsert jawaban dan simpan progress */
const kirimSemuaData = async (materiId) => {

    try {
        const materi = daftarMateri.value.find(m => Number(m.id) === Number(materiId));
        if (!materi) return;

        const soalPG = soalList.value[materiId]?.pg || [];
        const soalEssai = soalList.value[materiId]?.essai || [];
        const soalArray = [...soalPG, ...soalEssai];

        const jawabanObj = selectedAnswers.value[materiId] || {};
        const essaiObj = jawabanEssaiSiswa.value[materiId] || {};
        const refleksiText = String(refleksi.value[materiId] || "").trim();

        const jawabanArray = soalArray.map(s => ({
            soal_id: s.id,
            jawaban: String(jawabanObj[s.id] || ""),
            jawaban_essai: String(essaiObj[s.id] || ""),
            user_id: userId.value,
            bank_soal_id: materi.bank_soal_id || null,
            refleksi_siswa: refleksiText
        }));

        // Hilangkan duplikat
        const uniqueJawaban = Object.values(
            jawabanArray.reduce((acc, curr) => {
                const key = `${curr.user_id}-${curr.soal_id}`;
                acc[key] = curr;
                return acc;
            }, {})
        );

        // 🔹 Kirim ke backend
        const { data } = await api.post("/jawaban-siswa", uniqueJawaban, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        // console.log("Jawaban tersimpan:", data);

        activeSteps.value[materiId] = '4';
        await simpanProgress(materiId);

        const numericId = Number(materiId);
        if (!selesaiMateri.value.includes(numericId)) {
            selesaiMateri.value.push(numericId);
        }

        toast.add({ severity: 'success', summary: 'The answer has been successfully saved!', life: 3000 });
        // console.log("selesaiMateri setelah kirimSemuaData:", selesaiMateri.value);
    } catch (err) {
        console.error('All Data', err);
        toast.add({
            severity: 'error',
            summary: 'Failed to save answer',
            detail: err.response?.data?.message || err.message,
            life: 3000
        });
    }
};

const fetchSoalByBankSoalId = async (bankSoalId, materiId) => {
    try {
        const { data } = await api.get(`/soal/${bankSoalId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });

        // data adalah array soal
        const mapped = (data || []).map(s => ({
            ...s,
            gambar_url: s.gambar ? `${import.meta.env.VITE_API_URL}/uploads/gambar-soal/${s.gambar}` : null,
            gambarEssai_url: s.gambar_soal_essai ? `${import.meta.env.VITE_API_URL}/uploads/gambar-soal/${s.gambar_soal_essai}` : null,
        }));

        const soalPG = mapped.filter(s => s.pertanyaan && String(s.pertanyaan).trim() !== '');
        const soalEssai = mapped.filter(s => (s.pertanyaan_essai && String(s.pertanyaan_essai).trim() !== '') || s.gambar_soal_essai);

        // set reactive state
        soalList.value[materiId] = { pg: soalPG, essai: soalEssai };

        // ensure selectedAnswers and jawabanEssai exist as objects so v-model has target
        selectedAnswers.value[materiId] = selectedAnswers.value[materiId] || {};
        jawabanEssaiSiswa.value[materiId] = jawabanEssaiSiswa.value[materiId] || {};

        // populate existing answers if any
        mapped.forEach(s => {
            if (existingJawabanPGMap[s.id] !== undefined) {
                selectedAnswers.value[materiId][s.id] = existingJawabanPGMap[s.id];
            }
            if (existingJawabanEssayMap[s.id] !== undefined) {
                jawabanEssaiSiswa.value[materiId][s.id] = existingJawabanEssayMap[s.id];
            }
        });

        console.log(`soalList[${materiId}] loaded:`, soalList.value[materiId]);
    } catch (err) {
        console.error('fetchSoalByBankSoalId error', err);
        // fallback agar template tetap aman
        soalList.value[materiId] = { pg: [], essai: [] };
        selectedAnswers.value[materiId] = selectedAnswers.value[materiId] || {};
        jawabanEssaiSiswa.value[materiId] = jawabanEssaiSiswa.value[materiId] || {};
    }
};

const fetchMateriById = async () => {
    try {
        const res = await api.get(`/module-pembelajaran/kelas/${kelasId}`);
        const materiData = res.data || [];

        // ambil jawaban siswa dulu
        const jawabanRes = await api.get("/jawaban-siswa", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const jawaban = jawabanRes.data || [];
        (jawaban || []).forEach(j => {
            if (j.jawaban != null && String(j.jawaban).trim() !== '') existingJawabanPGMap[j.soal_id] = j.jawaban;
            if (j.jawaban_essai != null && String(j.jawaban_essai).trim() !== '') existingJawabanEssayMap[j.soal_id] = j.jawaban_essai;
        });

        const newDaftar = [];
        selesaiMateri.value = [];

        for (const materi of materiData) {
            // inisialisasi progress-related state
            const p = progressMateriMap[materi.id];
            videoSelesai.value[materi.id] = p?.video_selesai ?? false;
            pdfSelesai.value[materi.id] = p?.pdf_selesai ?? false;
            activeSteps.value[materi.id] = p?.langkah_aktif ?? "1";
            refleksi.value[materi.id] = p?.refleksi ?? "";

            // prefix foto guru kalau ada path
            if (materi.guru_foto) {
                // jika sudah full URL, skip; jika path like '/uploads/photo-profile/xxx' tambahkan base
                if (!materi.guru_foto.startsWith('http')) {
                    materi.guru_foto = `${import.meta.env.VITE_API_URL}${materi.guru_foto}`;
                }
            }

            // jika backend module tidak include soal, tapi punya bank_soal_id -> fetch dari /soal/:id
            // check both shapes: materi.bank_soal_id or materi.bank_soal?.id or materi.bank_soal_id
            const bankSoalId = materi.bank_soal_id ?? (materi.bank_soal && materi.bank_soal.id) ?? null;

            if (Array.isArray(materi.soal) && materi.soal.length > 0) {
                // jika backend sudah menyertakan soal di response module
                const mapped = materi.soal.map(s => ({
                    ...s,
                    gambar_url: s.gambar ? `${import.meta.env.VITE_API_URL}/uploads/gambar-soal/${s.gambar}` : null,
                    gambarEssai_url: s.gambar_soal_essai ? `${import.meta.env.VITE_API_URL}/uploads/gambar-soal/${s.gambar_soal_essai}` : null,
                }));

                soalList.value[materi.id] = {
                    pg: mapped.filter(s => s.pertanyaan?.trim() !== ''),
                    essai: mapped.filter(s => s.pertanyaan_essai?.trim() !== '')
                };

                selectedAnswers.value[materi.id] = selectedAnswers.value[materi.id] || {};
                jawabanEssaiSiswa.value[materi.id] = jawabanEssaiSiswa.value[materi.id] || {};

                mapped.forEach(s => {
                    if (existingJawabanPGMap[s.id] !== undefined) {
                        selectedAnswers.value[materi.id][s.id] = existingJawabanPGMap[s.id];
                    }
                    if (existingJawabanEssayMap[s.id] !== undefined) {
                        jawabanEssaiSiswa.value[materi.id][s.id] = existingJawabanEssayMap[s.id];
                    }
                });
            } else if (bankSoalId) {
                await fetchSoalByBankSoalId(bankSoalId, materi.id);
            } else {
                // tidak ada soal
                soalList.value[materi.id] = { pg: [], essai: [] };
                selectedAnswers.value[materi.id] = selectedAnswers.value[materi.id] || {};
                jawabanEssaiSiswa.value[materi.id] = jawabanEssaiSiswa.value[materi.id] || {};
            }

            newDaftar.push(materi);
        }

        daftarMateri.value = newDaftar;
        if (daftarMateri.value.length > 0) {
            activePanel.value = daftarMateri.value[0].id;
        }
    } catch (err) {
        console.error('fetchMateriById', err);
        toast.add({ severity: 'error', summary: 'Failed to retrieve Material', detail: err.message || err, life: 4000 });
    }
};

const fetchLinkGroupById = async () => {
    try {
        const res = await api.get(`/forum-discuss/${kelasId}`)
        linkGrup.value = res.data || []   // kalau kosong, isi []
    } catch (err) {
        console.error('fetchLinkGroupById', err);
        linkGrup.value = []
    } finally {
        isLoading.value = false
    }

};

const simpanProgress = async (materiId) => {
    try {
        const payload = {
            user_id: userId.value,
            materi_id: materiId,
            video_selesai: Boolean(videoSelesai.value[materiId]),
            pdf_selesai: Boolean(pdfSelesai.value[materiId]),
            langkah_aktif: activeSteps.value[materiId] ?? "1",
            refleksi: refleksi.value[materiId] ?? "",
            updated_at: new Date().toISOString(),
        };

        const { data } = await api.post("/progress-materi", payload, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

    } catch (err) {
        console.error("Saved progress", err);
        toast.add({
            severity: "error",
            summary: "Failed to save progress",
            detail: err.response?.data?.message || err.message,
            life: 3000,
        });
    }
};

/** Setup YouTube API players (dipanggil LEBIH AWAL setelah daftarMateri dirender) */
const setupYouTubePlayers = () => {
    const initializePlayers = () => {
        (daftarMateri.value || []).forEach((materi) => {
            const iframe = document.getElementById(`ytplayer-${materi.id}`);

            // Validasi iframe YouTube
            if (
                iframe &&
                iframe.tagName === "IFRAME" &&
                iframe.src.includes("youtube.com/embed") &&
                !iframe.dataset.playerInitialized &&
                window.YT &&
                window.YT.Player
            ) {
                try {
                    const player = new YT.Player(iframe, {
                        events: {
                            onReady: (event) => {
                                videoDurations.value[materi.id] = event.target.getDuration();
                            },
                            onStateChange: (event) => {
                                if (event.data === YT.PlayerState.PLAYING) {
                                    if (!watchIntervalIds.value[materi.id]) {
                                        watchIntervalIds.value[materi.id] = setInterval(() => {
                                            videoWatchTime.value[materi.id] =
                                                (videoWatchTime.value[materi.id] || 0) + 1;

                                            const watched = videoWatchTime.value[materi.id] || 0;
                                            const duration = videoDurations.value[materi.id] || 0;

                                            if (
                                                duration &&
                                                watched >= duration * 0.9 &&
                                                !videoSelesai.value[materi.id]
                                            ) {
                                                videoSelesai.value[materi.id] = true;
                                                clearInterval(watchIntervalIds.value[materi.id]);
                                                watchIntervalIds.value[materi.id] = null;

                                                simpanProgress(materi.id);
                                                toast.add({
                                                    severity: "success",
                                                    summary: "You’ve finished watching the video.",
                                                    detail: "Progress saved automatically.",
                                                    life: 2000,
                                                });
                                            }
                                        }, 1000);
                                    }
                                }

                                if (
                                    event.data === YT.PlayerState.PAUSED ||
                                    event.data === YT.PlayerState.ENDED
                                ) {
                                    clearInterval(watchIntervalIds.value[materi.id]);
                                    watchIntervalIds.value[materi.id] = null;
                                }
                            },
                        },
                    });

                    // Tandai supaya tidak re-init
                    iframe.dataset.playerInitialized = "true";
                } catch (err) {
                    console.error("YT Player init error", err);
                }
            }
        });
    };

    // Load YouTube API hanya sekali
    if (window.YT && window.YT.Player) {
        initializePlayers();
    } else {
        const tagId = "youtube-iframe-api";
        if (!document.getElementById(tagId)) {
            const tag = document.createElement("script");
            tag.id = tagId;
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag?.parentNode.insertBefore(tag, firstScriptTag);
        }
        window.onYouTubeIframeAPIReady = () => {
            initializePlayers();
        };
    }

    // Tambahkan listener postMessage aman (supaya warning ga spam)
    if (!window._ytMessageListenerAdded) {
        window.addEventListener("message", (event) => {
            // filter hanya untuk pesan dari youtube
            if (event.origin.includes("youtube.com")) {
                // console.log("YT message:", event.data); // debug opsional
            }
        });
        window._ytMessageListenerAdded = true;
    }
};

const handleScroll = (materiId) => {
    const el = pdfContainerRefs.value[materiId];
    if (!el) return;

    const bottomReached = el.scrollTop + el.clientHeight >= el.scrollHeight - 5;

    if (bottomReached && !pdfSelesai.value[materiId]) {
        pdfSelesai.value[materiId] = true;
        simpanProgress(materiId);
        toast.add({
            severity: "success",
            summary: "PDF viewed",
            detail: "Progress successfully saved",
            life: 3000,
        });
    }
};

/** Kontrol enabling step next: kalau materi tidak punya video/pdf/soal maka biarkan lanjut */
// pastikan ini ada di <script setup>
const canActivateNextStep = (materiId, targetStep) => {
    // Step 1 -> 2: pastikan video selesai
    if (targetStep === '2') {
        return !!(videoSelesai.value?.[materiId]);
    }

    // Step 2 -> 3: pastikan PDF selesai
    if (targetStep === '3') {
        return !!(pdfSelesai.value?.[materiId]);
    }

    // Step 3 -> 4: pastikan semua PG terjawab & semua essai terisi (jika ada)
    if (targetStep === '4') {
        const pg = soalList.value?.[materiId]?.pg ?? [];
        const essai = soalList.value?.[materiId]?.essai ?? [];

        const selPG = selectedAnswers.value?.[materiId] ?? {};
        const selEss = jawabanEssaiSiswa.value?.[materiId] ?? {};

        const allPGAnswered = pg.length === 0 || pg.every(s => {
            const ans = selPG[s.id];
            // cukup cek terisi; sesuaikan kalau kamu hanya terima A–E, mis. ['A','B','C','D','E'].includes(ans)
            return typeof ans === 'string' && ans.trim() !== '';
        });

        const allEssaiFilled = essai.length === 0 || essai.every(s => {
            const ans = selEss[s.id];
            return typeof ans === 'string' && ans.trim() !== '';
        });

        return allPGAnswered && allEssaiFilled;
    }

    return true;
};


const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

const bukaLinkZoom = (materi) => {
    if (materi.link_zoom) {
        window.open(materi.link_zoom, "_blank");
    } else {
        toast.add({
            severity: "warn",
            summary: "link Zoom is Not Found",
            detail: "The link Zoom is not Available.",
            life: 3000,
        });
    }
}

// Materi yang belum selesai -> filter dari daftarMateri
const materiBelumSelesai = computed(() => {
    return daftarMateri.value.filter(m => !selesaiMateri.value.includes(Number(m.id)));
});

// Materi yang sudah selesai -> kalau mau dipisahkan juga
const materiSelesai = computed(() => {
    return daftarMateri.value.filter(m => selesaiMateri.value.includes(Number(m.id)));
});

const onAdvancedUpload = async (event, materiId) => {
    try {
        const formData = new FormData();
        for (const file of event.files) {
            formData.append("files", file);
        }

        // data tambahan
        formData.append("bank_soal_id", daftarMateri.value.find(m => m.id === materiId)?.bank_soal_id || null);
        formData.append("materi_id", materiId);

        const { data } = await api.post("/jawaban-siswa/upload-multiple", formData, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "multipart/form-data"
            }
        });

        console.log("Upload success:", data);
        toast.add({ severity: "success", summary: "Upload successful!", life: 3000 });

    } catch (err) {
        console.error("Upload error:", err);
        toast.add({ severity: "error", summary: "Upload failed!", detail: err.message, life: 3000 });
    }
};



onMounted(async () => {
    try {
        const res = await api.get("/auth/profile", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}` // token disimpan di FE
            }

        });

        if (!res) {
            toast.add({ severity: "error", summary: "User not found!", life: 3000 });
            return;
        }

        userId.value = res.data.id;

        await fetchProgressMateri();
        await fetchMateriById();
        await fetchLinkGroupById();
        await nextTick();
        setupYouTubePlayers();
        isLoading.value = false
    } catch (err) {
        console.error('onMounted', err);
    }
});
</script>

<template>
    <div class="space-y-4 mb-5">
        <Card v-for="forum in linkGrup" :key="forum.id">
            <template #header>
                <div class="flex items-center justify-between">
                    <div class="flex m-5 space-x-2 items-center">
                        <Icon icon="heroicons:user-group-20-solid" width="20" height="20" />
                        <h2 class="font-semibold">{{ forum.nama_grup }}</h2>
                    </div>
                </div>
            </template>

            <template #content>
                <div class="text-sm px-5 py-2 text-blue-400 break-all">
                    <a :href="forum.link_grup" target="_blank">{{ forum.link_grup }}</a>
                </div>
            </template>
        </Card>
    </div>

    <div class="card">
        <div v-if="isLoading" class="flex justify-center py-10">
            <ProgressSpinner />
        </div>

        <div v-else-if="materiBelumSelesai.length === 0" class="text-gray-500 text-center py-10">
            No materials are available yet.
        </div>

        <div v-else>
            <Panel toggleable v-for="materi in materiBelumSelesai" :collapsed="activePanel !== materi.id"
                @toggle="() => activePanel = activePanel === materi.id ? null : materi.id" :key="materi.id">
                <template #header>
                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-2">
                            <Avatar :image="materi.guru_foto || null" shape="circle">
                                <i v-if="!materi.guru_foto" class="pi pi-user"></i>
                            </Avatar>
                            <span class="font-bold">Educational Objectives: {{ materi.judul }}</span>
                            <Tag v-if="selesaiMateri[materi.id]" severity="success" value="Selesai" class="ml-2" />
                        </div>

                        <Button label="Join Meeting" @click="bukaLinkZoom(materi)" />
                    </div>
                </template>

                <template #footer>
                    <!-- UPLOAD GAMBAR/PDF DARI JAWABAN SISWA -->
                    <FileUpload ref="fileUpload" mode="advanced" name="files" customUpload
                        @uploader="(e) => onAdvancedUpload(e, materi.id)" :multiple="true"
                        accept="image/*, application/pdf" :maxFileSize="5000000">
                        <template #empty>
                            <span>Drag and drop files to here to upload.</span>
                        </template>
                    </FileUpload>

                    <div class="flex justify-end mt-3">
                        <span class="text-surface-500 dark:text-surface-400">
                            Updated On {{ formatDate(materi.created_at) }}
                        </span>
                    </div>

                </template>

                <div class="card">
                    <Stepper v-if="daftarMateri.length > 0" :value="activeSteps[materi.id]" linear
                        :readonly="selesaiMateri.includes(materi.id)">
                        <StepItem value="1">
                            <Step class="flex justify-between">
                                <span>Learning Unit 1</span>
                                <i v-if="videoSelesai[materi.id]" class="pi pi-check-circle text-green-500"></i>
                            </Step>
                            <StepPanel v-if="activeSteps[materi.id] === '1'">
                                <div class="flex flex-col h-full">
                                    <div v-if="materi.video_url" class="flex justify-center items-center">
                                        <iframe class="w-full h-72" :id="`ytplayer-${materi.id}`"
                                            :src="getEmbedUrl(materi.video_url)" allowfullscreen frameborder="0" />
                                    </div>
                                    <div class="py-6">
                                        <Button label="Next"
                                            @click="() => { activeSteps[materi.id] = '2'; simpanProgress(materi.id); }"
                                            :disabled="!canActivateNextStep(materi.id, '2')" />
                                    </div>
                                </div>
                            </StepPanel>
                        </StepItem>

                        <StepItem value="2">
                            <Step>
                                <span>Learnin Unit 2</span>
                                <i v-if="pdfSelesai[materi.id]" class="pi pi-check-circle text-green-500"></i>
                            </Step>
                            <StepPanel v-if="activeSteps[materi.id] === '2'">
                                <div class="flex flex-col h-full">
                                    <div :ref="el => pdfContainerRefs[materi.id] = el"
                                        @scroll="() => handleScroll(materi.id)"
                                        class="overflow-y-scroll h-[500px] border rounded bg-white">
                                        <iframe v-if="materi.file_url"
                                            :src="`https://metschoo-ils.my.id/${materi.file_url}`"
                                            class="w-full h-[800px]" allow="fullscreen" allowfullscreen
                                            frameborder="0" />
                                    </div>
                                    <div class="flex py-6 gap-2">
                                        <Button label="Back" severity="secondary"
                                            @click="() => activeSteps[materi.id] = '1'" />
                                        <Button label="Next"
                                            @click="() => { activeSteps[materi.id] = '3'; simpanProgress(materi.id); }"
                                            :disabled="!canActivateNextStep(materi.id, '3')" />
                                    </div>
                                </div>
                            </StepPanel>
                        </StepItem>

                        <StepItem value="3">
                            <Step>Learning Unit 3</Step>
                            <StepPanel v-if="activeSteps[materi.id] === '3'">
                                <div class="flex flex-col h-full space-y-5">
                                    <h1 class="font-bold">{{ materi.judul_penugasan }}</h1>
                                    <div v-for="(soal, index) in soalList[materi.id]?.pg || []" :key="soal.id"
                                        class="mb-6">
                                        <Card class="space-y-2">
                                            <template #header>
                                                <div class="flex items-center m-3">
                                                    <Tag severity="info" :value="`${index + 1}`" />
                                                    <div class="ml-2 font-semibold overflow-auto break-all"
                                                        v-html="soal.pertanyaan"></div>
                                                </div>
                                            </template>
                                            <template #content>
                                                <div class="flex flex-col gap-4">
                                                    <div class="flex justify-center items-center">
                                                        <img v-if="soal.gambar_url" :src="soal.gambar_url"
                                                            alt="Gambar Soal" class="w-64 rounded" />
                                                    </div>
                                                    <div v-for="(opsi, key) in { A: soal.pg_a, B: soal.pg_b, C: soal.pg_c, D: soal.pg_d, E: soal.pg_e }"
                                                        :key="key" class="flex items-center gap-2">
                                                        <RadioButton :inputId="`${soal.id}-${key}`"
                                                            v-model="selectedAnswers[materi.id][soal.id]" :value="key"
                                                            :name="`soal-${soal.id}`" />
                                                        <label :for="`${soal.id}-${key}`">{{ key }}. {{ opsi }}</label>
                                                    </div>
                                                </div>
                                            </template>
                                        </Card>
                                    </div>

                                    <div v-for="(soal, index) in soalList[materi.id]?.essai || []" :key="soal.id"
                                        class="mb-6">
                                        <Card class="space-y-2">
                                            <template #header>
                                                <div class="flex flex-col">
                                                    <div class="flex items-center m-3">
                                                        <Tag severity="info" :value="`${index + 1}`" />
                                                        <div class="ml-2 font-semibold flex overflow-auto break-all"
                                                            v-html="soal.pertanyaan_essai">
                                                        </div>
                                                    </div>
                                                    <div class="flex justify-center">
                                                        <img v-if="soal.gambarEssai_url" :src="soal.gambarEssai_url"
                                                            alt="Gambar Soal" class="w-64 rounded" />
                                                    </div>
                                                </div>
                                            </template>
                                            <template #content>
                                                <div class="flex flex-col gap-4">
                                                    <Textarea v-model="jawabanEssaiSiswa[materi.id][soal.id]"
                                                        placeholder="Submit your Answer"
                                                        :disabled="selesaiMateri.includes(materi.id)" />
                                                </div>
                                            </template>
                                        </Card>
                                    </div>
                                    <div class="flex py-6 gap-2">
                                        <Button label="Back" severity="secondary"
                                            @click="() => activeSteps[materi.id] = '2'" />
                                        <Button label="Next"
                                            @click="() => { activeSteps[materi.id] = '4'; simpanProgress(materi.id); }"
                                            :disabled="!canActivateNextStep(materi.id, '4')" />
                                    </div>
                                </div>
                            </StepPanel>
                        </StepItem>

                        <StepItem value="4">
                            <Step>Reflection</Step>
                            <StepPanel>
                                <div class="flex flex-col h-full">
                                    <Textarea v-model="refleksi[materi.id]" rows="5" class="w-full"
                                        placeholder="Submit Your Reflection..." @blur="() => simpanProgress(materi.id)"
                                        :readonly="selesaiMateri.includes(materi.id)" />
                                    <div class="flex py-6 gap-2">
                                        <Button label="Back" severity="secondary"
                                            @click="() => activeSteps[materi.id] = '3'" />
                                        <Button label="Finished" @click="() => kirimSemuaData(materi.id)"
                                            :disabled="selesaiMateri.includes(materi.id)" />
                                    </div>
                                </div>
                            </StepPanel>
                        </StepItem>
                    </Stepper>
                </div>
            </Panel>
        </div>
    </div>
    <Toast />

</template>