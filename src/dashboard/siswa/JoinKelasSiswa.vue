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
const classroom = ref([])
const selectedAnswers = ref({});
const jawabanEssaiSiswa = ref({})
const refleksi = ref({});
const userId = ref(null);
const videoSelesai = ref({});
const pdfSelesai = ref({});
const activeSteps = ref({});
// const tugasSelesai = ref({})
const pdfContainerRefs = ref({});
// const selesaiMateri = ref([]);
const videoDurations = ref({});
const videoWatchTime = ref({});
const watchIntervalIds = ref({});
const progressMateriMap = {}; // simple map, bukan reactive (cukup untuk lookup)
const linkGrup = ref([]);
// const profileGuruMap = ref({});
const isLoading = ref(true)
// const selectedFile = ref(null);
// const fileUrl = ref(null);
// const uploaded = ref(false);

const isHistory = (materi) => materi?.status_selesai === true;

const uploadedFiles = ref({})

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
        // if (!selesaiMateri.value.includes(numericId)) {
        //     selesaiMateri.value.push(numericId);
        // }

        await simpanProgress(materiId);
        await fetchMateriById();

        // refresh ulang dari backend (optional tapi paling aman)
        await fetchMateriById();

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
        const { data } = await api.get(`/soal/soal-siswa/${bankSoalId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });

        // data adalah array soal
        const mapped = (data || []).map(s => ({
            ...s,
            gambar_url: s.gambar
                ? `data:${s.gambar_mimetype};base64,${s.gambar}`
                : null,

            gambarEssai_url: s.gambar_soal_essai
                ? `data:${s.gambar_essai_mimetype};base64,${s.gambar_soal_essai}`
                : null,
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

        // console.log(`soalList[${materiId}] loaded:`, soalList.value[materiId]);
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
        const res = await api.get(`/module-pembelajaran/siswa/${userId.value}/kelas/${kelasId}`);
        const materiRaw = res.data || [];

        // console.log("Materi Raw:", materiRaw);
        const materiData = materiRaw;


        daftarMateri.value = materiData;

        activePanel.value = materiData[0]?.id ?? null;

        // const materiData = Object.values(materiMap);

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
        // selesaiMateri.value = [];

        for (const materi of materiData) {
            const p = progressMateriMap[materi.id];

            // 🔥 FIX UTAMA
            materi.status_selesai = Boolean(materi.status_selesai);

            videoSelesai.value[materi.id] = p?.video_selesai ?? false;
            pdfSelesai.value[materi.id] = p?.pdf_selesai ?? false;
            activeSteps.value[materi.id] = p?.langkah_aktif ?? "1";
            refleksi.value[materi.id] = p?.refleksi ?? "";

            materi.pdf_url = `${import.meta.env.VITE_API_URL}api/module-pembelajaran/${materi.id}/pdf`;

            if (materi.guru_id) {
                materi.guru_foto = `${import.meta.env.VITE_API_URL}api/uploads/photo-profile/${materi.guru_id}`;
            } else {
                materi.guru_foto = null;
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
            await fetchUploadedFiles(materi);

            newDaftar.push(materi);
        }

        daftarMateri.value = newDaftar;
        if (daftarMateri.value.length > 0) {
            activePanel.value = daftarMateri.value[0].id;
        }

        isLoading.value = false;
        // console.log("Daftar Materi:", daftarMateri.value);
    } catch (err) {
        isLoading.value = false;
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

// // Materi yang belum selesai -> filter dari daftarMateri
// const materiBelumSelesai = computed(() => {
//     return daftarMateri.value.filter(m => !selesaiMateri.value.includes(Number(m.id)));
// });

// Materi yang sudah selesai -> kalau mau dipisahkan juga
// const materiSelesai = computed(() => {
//     return daftarMateri.value.filter(m => selesaiMateri.value.includes(Number(m.id)));
// });

const onAdvancedUpload = async (event, materiId) => {
    try {
        const formData = new FormData();

        event.files.forEach(file => {
            formData.append("files", file);
        });

        formData.append("materi_id", materiId);
        formData.append(
            "bank_soal_id",
            daftarMateri.value.find(m => m.id === materiId)?.bank_soal_id || null
        );

        const res = await api.post(
            "/jawaban-siswa/upload-multiple",
            formData,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "multipart/form-data"
                }
            }
        );

        // Backend HARUS return array file
        uploadedFiles.value[materiId] = res.data.files.map(f => ({
            id: f.id,
            file_mime: f.mime,   // ⚠️ backend pakai "mime"
            url: f.url           // ⚠️ backend sudah kasih URL stream
        }));


        toast.add({
            severity: "success",
            summary: "Upload Success",
            life: 3000
        });

    } catch (err) {
        console.error("Upload error:", err);
        toast.add({
            severity: "error",
            summary: "Upload Failed",
            detail: err.response?.data?.message || err.message,
            life: 3000
        });
    }
};


const ensureUploadedFiles = (materiId) => {
    if (!uploadedFiles.value[materiId]) {
        uploadedFiles.value[materiId] = [];
    }

};

const fetchClassroom = async () => {
    try {
        const res = await api.get(`/kelas/${kelasId}`);
        classroom.value = res.data;
        // console.log("Classroom data:", classroom.value);
        if (!res) {
            toast.add({ severity: "error", summary: "Classroom not found!", life: 3000 });
            return;
        }

    } catch (err) {
        console.error('fetchClassroom', err);
    }
}

// const createFileUrl = (file) => {
//     try {
//         const binary = atob(file.file_data);
//         const bytes = new Uint8Array(binary.length);

//         for (let i = 0; i < binary.length; i++) {
//             bytes[i] = binary.charCodeAt(i);
//         }

//         const blob = new Blob([bytes], { type: file.file_mime });
//         return URL.createObjectURL(blob);
//     } catch (err) {
//         console.error("Create file URL failed", err);
//         return null;
//     }
// };

const fetchUploadedFiles = async (materi) => {
    try {
        ensureUploadedFiles(materi.id);

        if (!materi.bank_soal_id) return;

        const { data } = await api.get(
            `/jawaban-siswa/files-by-bank-siswa/${materi.bank_soal_id}`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        uploadedFiles.value[materi.id] = data || [];
    } catch (err) {
        console.error("fetchUploadedFiles error:", err);
        uploadedFiles.value[materi.id] = [];
    }
};

const downloadFile = async (downloadUrl, fileName = "file") => {
    try {
        const response = await fetch(downloadUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (!response.ok) {
            throw new Error("Download failed");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = fileName; // nama file
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error(err);
        alert("Gagal mengunduh file");
    }
};



const openFile = (url) => {
    window.open(url, "_blank");
};

const deleteFile = async (fileId, materiId) => {
    try {
        await api.delete(`/jawaban-siswa/file/${fileId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        uploadedFiles.value[materiId] =
            uploadedFiles.value[materiId].filter(f => f.id !== fileId);

        toast.add({
            severity: "success",
            summary: "File deleted",
            life: 2000
        });
    } catch (err) {
        console.error(err);
        toast.add({
            severity: "error",
            summary: "Failed to delete file",
            life: 3000
        });
    }
};

// const editFile = async (fileId, newFile, materiId) => {
//     try {
//         const formData = new FormData();
//         formData.append("file", newFile);

//         const res = await api.put(
//             `/jawaban-siswa/file/${fileId}`,
//             formData,
//             {
//                 headers: {
//                     Authorization: `Bearer ${localStorage.getItem("token")}`,
//                     "Content-Type": "multipart/form-data"
//                 }
//             }
//         );

//         const updated = res.data.file;

//         uploadedFiles.value[materiId] =
//             uploadedFiles.value[materiId].map(f =>
//                 f.id === fileId ? updated : f
//             );

//         toast.add({
//             severity: "success",
//             summary: "File updated",
//             life: 2000
//         });
//     } catch (err) {
//         console.error(err);
//         toast.add({
//             severity: "error",
//             summary: "Failed to update file",
//             life: 3000
//         });
//     }
// };


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
        await fetchClassroom();
        await fetchMateriById();
        // for (const materi of daftarMateri.value) {
        //     await fetchUploadedFiles(materi);
        // }
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
    <section v-if="classroom"
        class="relative w-full h-[285px] rounded-b-3xl overflow-hidden flex items-center text-black mb-5 shadow-2xl">
        <!-- Wallpaper -->
        <div class="absolute inset-0 bg-cover bg-center">
            <img :src="classroom.link_wallpaper_kelas" alt="" />
        </div>

        <!-- Overlay gradient + blur -->
        <div class=" absolute inset-0 backdrop-blur-[5px]" style="background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 1) 20%,    /* kiri: putih 60% */
            rgba(20, 107, 107,0.40) 50%,   /* tengah kiri */
            rgba(20, 107, 107, 0.71) 60%,   /* tengah */
            rgba(255, 255, 255, 0.00) 90%    /* kanan bening */
        );">
        </div>

        <!-- Content -->
        <div class="relative z-10 space-y-8 pl-10">
            <div class="flex flex-col">
                <h1 class="text-2xl font-semibold">{{ classroom.nama_mapel }}</h1>
                <h2 class="text-lg">{{ classroom.grade_lvl }} {{ classroom.major }} {{ classroom.name_rombel }}</h2>
            </div>
            <p>{{ classroom.guru_name }}</p>
        </div>
    </section>

    <div class="space-y-4 mb-5 m-5">
        <Card v-for="forum in linkGrup" :key="forum.id">
            <template #header>
                <div class="text-xl font-bold flex items-center space-x-2 mx-5 my-2 mt-3">
                    <h1>Whatsapp Group Links</h1>
                </div>
            </template>

            <template #content>
                <div class="flex items-center">
                    <div class="flex space-x-2 items-center">
                        <Icon icon="heroicons:user-group-20-solid" width="28" height="28" />
                        <h2 class="font-semibold">{{ forum.nama_grup }}</h2> - <div
                            class="text-sm px-2 py-2 text-blue-400 break-all">
                            <a :href="forum.link_grup" target="_blank">{{ forum.link_grup }}</a>
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    </div>

    <div class="card">
        <div v-if="isLoading" class="flex justify-center py-10">
            <ProgressSpinner />
        </div>

        <div v-else-if="daftarMateri.length === 0" class="text-gray-500 text-center py-10">
            No materials are available yet.
        </div>

        <div v-else class="m-5">
            <Panel toggleable v-for="materi in daftarMateri" :collapsed="activePanel !== materi.id"
                @toggle="() => activePanel = activePanel === materi.id ? null : materi.id" :key="materi.id">

                <template #header>
                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-2">
                            <Avatar :image="materi.guru_foto || null" shape="circle">
                                <i v-if="!materi.guru_foto" class="pi pi-user"></i>
                            </Avatar>
                            <span class="font-bold">Educational Objectives: {{ materi.judul }}</span>
                            <Tag v-if="materi.status_selesai === true" severity="success" value="Finished"
                                class="ml-2" />

                        </div>

                        <Button label="Join Meeting" @click="bukaLinkZoom(materi)" />
                    </div>
                </template>

                <template #footer>
                    <!-- UPLOAD GAMBAR / PDF JAWABAN SISWA -->
                    <FileUpload mode="advanced" customUpload multiple accept="image/*,application/pdf"
                        :maxFileSize="5000000" :showCancelButton="false" :showFileList="false"
                        @uploader="e => onAdvancedUpload(e, materi.id)">
                        <template #empty>
                            <span>Drag & drop image or PDF here</span>
                        </template>
                    </FileUpload>

                    <!-- LIST FILE JAWABAN SISWA -->


                    <div v-if="uploadedFiles[materi.id]?.length" class="space-y-3 mt-4">
                        <div v-for="file in uploadedFiles[materi.id]" :key="file.id"
                            class="flex items-center justify-between p-4 border rounded-lg bg-surface-50 hover:shadow transition">

                            <!-- LEFT -->
                            <div class="flex items-center gap-4">
                                <!-- ICON -->
                                <div class="w-12 h-12 flex items-center justify-center rounded-lg bg-primary-100">
                                    <i v-if="file.file_mime === 'application/pdf'"
                                        class="pi pi-file-pdf text-red-500 text-xl"></i>

                                    <i v-else-if="file.file_mime?.startsWith('image/')"
                                        class="pi pi-image text-blue-500 text-xl"></i>

                                    <i v-else class="pi pi-file text-gray-500 text-xl"></i>
                                </div>

                                <!-- FILE INFO -->
                                <div class="flex flex-col">
                                    <span class="font-semibold break-all">
                                        {{ file.file_name }}
                                    </span>

                                    <span class="text-sm text-gray-500">
                                        {{ formatDate(file.created_at) }}
                                    </span>
                                </div>
                            </div>

                            <!-- ACTION -->
                            <div class="flex gap-2">
                                <Button icon="pi pi-download" severity="secondary" size="small"
                                    @click="downloadFile(file.download_url, file.file_name)" />

                                <Button icon="pi pi-external-link" size="small" @click="openFile(file.url)" />
                                <Button icon="pi pi-trash" size="small" severity="danger"
                                    @click="deleteFile(file.id, materi.id)" />
                            </div>
                        </div>
                    </div>

                    <!-- EMPTY STATE -->
                    <div v-else class="text-gray-400 text-sm mt-4 italic">
                        No uploaded files yet.
                    </div>


                    <div class="flex justify-end mt-3">
                        <span class="text-surface-500 dark:text-surface-400">
                            Updated On {{ formatDate(materi.created_at) }}
                        </span>
                    </div>

                </template>

                <div class="card">
                    <Stepper v-if="daftarMateri.length > 0" :value="activeSteps[materi.id]" linear
                        :readonly="materi.status_selesai === true">
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
                                <span>Learning Unit 2</span>
                                <i v-if="pdfSelesai[materi.id]" class="pi pi-check-circle text-green-500"></i>
                            </Step>
                            <StepPanel v-if="activeSteps[materi.id] === '2'">
                                <div class="flex flex-col h-full">

                                    <div :ref="el => pdfContainerRefs[materi.id] = el"
                                        @scroll="() => handleScroll(materi.id)"
                                        class="overflow-y-scroll h-[500px] border rounded bg-white">
                                        <iframe v-if="materi.pdf_url" :src="materi.pdf_url" class="w-full h-[800px]"
                                            frameborder="0" allowfullscreen />

                                        <div v-else class="text-center text-gray-500 py-6">
                                            PDF not available.
                                        </div>
                                    </div>

                                    <div class="flex py-6 gap-2">
                                        <Button label="Back" severity="secondary"
                                            @click="() => activeSteps[materi.id] = '1'" />

                                        <Button label="Next" @click="() => {
                                            activeSteps[materi.id] = '3';
                                            simpanProgress(materi.id);
                                        }" :disabled="!canActivateNextStep(materi.id, '3')" />
                                    </div>

                                </div>
                            </StepPanel>

                        </StepItem>

                        <StepItem value="3">
                            <Step>Learning Unit 3</Step>
                            <StepPanel v-if="activeSteps[materi.id] === '3'">
                                <div v-if="soalList[materi.id]">

                                    <div class="flex flex-col h-full space-y-5">
                                        <h1 class="font-bold">{{ materi.judul_penugasan }}</h1>
                                        <div v-for="(soal, index) in soalList[materi.id].pg || []" :key="soal.id"
                                            class="mb-6">
                                            <Card class="space-y-2">
                                                <template #header>
                                                    <div class="ml-2 font-semibold w-full max-w-full overflow-hidden">
                                                        <div class="flex items-center m-3">
                                                            <Tag severity="info" :value="`${index + 1}`" />
                                                            <div class="ml-2 soal-html whitespace-normal font-semibold overflow-auto break-words"
                                                                v-html="soal.pertanyaan"></div>
                                                        </div>
                                                    </div>
                                                </template>
                                                <template #content>
                                                    <div class="flex flex-col gap-4">
                                                        <div class="flex justify-center items-center">
                                                            <img v-if="soal.gambar_url" :src="soal.gambar_url"
                                                                alt="Gambar Soal" class="w-64 rounded" />
                                                        </div>
                                                        <div v-for="(opsi, key) in { A: soal.pg_a, B: soal.pg_b, C: soal.pg_c, D: soal.pg_d, E: soal.pg_e }"
                                                            :key="key" class="flex items-center gap-2" :class="{
                                                                'bg-green-100': isHistory(materi) && key === soal.kunci_jawaban,
                                                                'bg-red-100': isHistory(materi) && key === selectedAnswers[materi.id][soal.id] && key !== soal.kunci_jawaban
                                                            }">
                                                            <RadioButton :inputId="`${soal.id}-${key}`"
                                                                v-model="selectedAnswers[materi.id][soal.id]"
                                                                :value="key" :name="`soal-${soal.id}`"
                                                                :disabled="isHistory(materi)" />
                                                            <label :for="`${soal.id}-${key}`">{{ key }}. {{ opsi
                                                            }}</label>
                                                        </div>
                                                    </div>


                                                </template>
                                            </Card>
                                        </div>

                                        <div v-for="(soal, index) in soalList[materi.id].essai || []" :key="soal.id"
                                            class="mb-6">
                                            <Card class="space-y-2">
                                                <template #header>
                                                    <div class="flex flex-col">
                                                        <div
                                                            class="ml-2 font-semibold w-full max-w-full overflow-hidden">
                                                            <div class="flex items-center m-3">
                                                                <Tag severity="info" :value="`${index + 1}`" />
                                                                <div class="ml-2 soal-html whitespace-norma font-semibold overflow-auto break-words"
                                                                    v-html="soal.pertanyaan_essai">
                                                                </div>
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
                                                            :disabled="isHistory(materi)"
                                                            :readonly="isHistory(materi)" />
                                                    </div>
                                                </template>
                                            </Card>
                                        </div>
                                        <div class="flex py-6 gap-2">
                                            <Button label="Back" severity="secondary"
                                                @click="() => activeSteps[materi.id] = '2'" />
                                            <Button label="Next"
                                                @click="() => { activeSteps[materi.id] = '4'; simpanProgress(materi.id); }" />
                                        </div>
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
                                        :readonly="materi.status_selesai === true" />
                                    <div class="flex py-6 gap-2">
                                        <Button label="Back" severity="secondary"
                                            @click="() => activeSteps[materi.id] = '3'" />
                                        <Button label="Submit" @click="kirimSemuaData(materi.id)"
                                            :disabled="isHistory(materi)" />

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

<style scoped>
.background {
    background: linear-gradient(90deg, rgba(20, 107, 107, 0.1)7%, rgba(244, 244, 244, 0.1)68%);
    backdrop-filter: blur(8px)
}


.soal-html {
    max-width: 100%;
    overflow-wrap: break-word;
    word-break: break-word;
}

/* Semua elemen HTML di dalam soal */
.soal-html * {
    max-width: 100%;
    box-sizing: border-box;
}

/* Gambar */
.soal-html img {
    max-width: 100%;
    height: auto;
    display: block;
}

/* Table (penyebab utama tembus kanan) */
.soal-html table {
    width: 100%;
    border-collapse: collapse;
    display: block;
    overflow-x: auto;
}

/* Paragraf & list */
.soal-html p,
.soal-html ol,
.soal-html ul,
.soal-html li {
    white-space: normal;
}
</style>