<script setup>
import api from "../../services/api";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const route = useRoute();
const router = useRouter();

const id = route.params.id;
const rpk = ref(null);
const loading = ref(true);
const errorMsg = ref("");

// === FETCH DATA ===
const fetchRpk = async () => {
    try {
        console.log("📡 Fetching RPK ID:", id);
        const res = await api.get(`/rpk/${id}`);

        if (!res || !res.data) {
            errorMsg.value = "Data tidak ditemukan.";
            rpk.value = null;
            return;
        }

        const data = res.data;

        // Pastikan DPL menjadi boolean
        for (let i = 1; i <= 8; i++) {
            const key = `dpl_${i}`;
            data[key] = data[key] === true || data[key] === "true";
        }

        rpk.value = data;
        console.log("✅ RPK Data:", data);
        console.log("fetchRpk -> id:", id);
    } catch (error) {
        console.error("❌ Fetch RPK Error:", error);
        errorMsg.value =
            error.response?.status === 404
                ? "Data tidak ditemukan (404)"
                : "Terjadi kesalahan saat mengambil data.";
    } finally {
        loading.value = false;
    }
};

// === BACK ===
const back = () => router.back();

// === EXPORT PDF ===
const exportPDF = () => {
    if (!rpk.value) {
        alert("Tidak ada data untuk diexport.");
        return;
    }

    const data = rpk.value;
    const doc = new jsPDF();

    const formatDateForPDF = (tanggal) => {
        if (!tanggal) return "Date not available";
        return new Intl.DateTimeFormat("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "Asia/Jakarta",
        }).format(new Date(tanggal));
    };

    // Judul
    doc.setFontSize(16);
    doc.text("Learning Plan", 105, 15, { align: "center" });

    // Identitas
    doc.setFontSize(12);
    doc.text("Identity", 14, 30);
    autoTable(doc, {
        startY: 35,
        theme: "grid",
        head: [["Field", "Value"]],
        body: [
            ["Class", data.name_rombel || ""],
            ["Subject", data.nama_mapel || ""],
            ["Phase", data.phase || ""],
            ["Grade", data.grade_lvl || ""],
            ["Teacher", data.teacher_name || ""],
            ["Instructor", data.instructor_name || ""],
            ["Tutor", data.tutor || ""],
            ["Day / Date", formatDateForPDF(data.hari_tanggal)],
            ["Time", data.waktu || ""],
        ],
    });

    // Instructional Design
    doc.text("Instructional Design", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        theme: "grid",
        head: [["Field", "Value"]],
        body: [
            ["Learning Objective", data.tujuan_pembelajaran || ""],
            ["Interdisciplinery", data.lintas_disiplin_ilmu || ""],
            ["Learning Partnership", data.kemitraan_pembelajaran || ""],
            ["Digital Utilization", data.pemanfaatan_digital || ""],
        ],
    });

    // Dimensi Profil Lulusan
    const dplList = [];
    for (let i = 1; i <= 8; i++) {
        if (data[`dpl_${i}`]) dplList.push(`DPL ${i}`);
    }

    doc.text("Dimensi Profil Lulusan", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        theme: "grid",
        head: [["DPL"]],
        body: dplList.length ? dplList.map((d) => [d]) : [["No DPL Selected"]],
    });

    doc.save("RPK.pdf");
};

// === Format tanggal ===
const formatDate = (date) => {
    if (!date) return "Date not available";
    return new Intl.DateTimeFormat("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Jakarta",
    }).format(new Date(date));
};

onMounted(fetchRpk);
</script>

<template>
    <div class="p-5">
        <div v-if="loading" class="text-center text-gray-500 text-lg mt-10">
            ⏳ Loading data...
        </div>

        <div v-else-if="errorMsg" class="text-center text-red-500 text-lg mt-10">
            ⚠️ {{ errorMsg }}
        </div>

        <div v-else-if="rpk" class="space-y-5">
            <div class="flex justify-between">
                <Button icon="pi pi-arrow-left" label="Back" @click="back" />
                <Button icon="pi pi-file-pdf" label="Export PDF" @click="exportPDF" />
            </div>

            <div class="text-center text-3xl my-4">Learning Plan</div>

            <!-- BAGIAN IDENTITAS -->
            <div class="flex border-2">
                <div class="w-1/5 flex justify-center items-center bg-gray-100">
                    <div class="text-3xl">Identity</div>
                </div>
                <div class="w-4/5 space-y-3 m-4">
                    <div v-for="(val, key) in {
                        'Class': rpk.name_rombel,
                        'Subject': rpk.nama_mapel,
                        'Phase': rpk.phase,
                        'Grade': rpk.grade_lvl,
                        'Teacher': rpk.teacher_name,
                        'Instructor': rpk.instructor_name,
                        'Tutor': rpk.tutor,
                        'Day / Date': formatDate(rpk.hari_tanggal),
                        'Time': rpk.waktu,
                    }" :key="key" class="flex items-center gap-2">
                        <b>{{ key }}:</b> <span>{{ val }}</span>
                    </div>
                </div>
            </div>

            <!-- DESAIN PEMBELAJARAN -->
            <div class="flex border-2 mt-5">
                <div class="w-1/5 flex justify-center items-center bg-gray-100">
                    <div class="text-3xl text-center">Instructional Design</div>
                </div>
                <div class="w-4/5 space-y-3 m-4">
                    <div v-for="(val, key) in {
                        'Learning Objective': rpk.tujuan_pembelajaran,
                        'Interdisciplinery': rpk.lintas_disiplin_ilmu,
                        'Learning Partnership': rpk.kemitraan_pembelajaran,
                        'Digital Utilization': rpk.pemanfaatan_digital,
                    }" :key="key" class="flex items-center gap-2">
                        <b>{{ key }}:</b> <span>{{ val }}</span>
                    </div>

                    <h1 class="font-bold mt-3">Dimensi Profil Lulusan :</h1>
                    <div class="flex flex-wrap gap-4">
                        <div v-for="i in 8" :key="i" class="flex items-center gap-2 w-1/4">
                            <Checkbox v-model="rpk[`dpl_${i}`]" :binary="true" disabled />
                            <label><b>DPL {{ i }}</b></label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PENGALAMAN BELAJAR -->
            <div class="border mt-5">
                <table class="w-full border text-left">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border px-4 py-2 w-1/3">Pengalaman Belajar</th>
                            <th class="border px-4 py-2 w-1/3">Prinsip Pembelajaran</th>
                            <th class="border px-4 py-2 w-1/3">Asesmen</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="section in [
                            { key: 'Memahami', main: rpk.memahami, berkesadaran: rpk.memahami_berkesadaran, bermakna: rpk.memahami_bermakna, menggembirakan: rpk.memahami_menggembirakan, asesmen: rpk.asesmen_memahami },
                            { key: 'Mengaplikasikan', main: rpk.mengaplikasikan, berkesadaran: rpk.mengaplikasikan_berkesadaran, bermakna: rpk.mengaplikasikan_bermakna, menggembirakan: rpk.mengaplikasikan_menggembirakan, asesmen: rpk.asesmen_mengaplikasikan },
                            { key: 'Merefleksi', main: rpk.merefleksi, berkesadaran: rpk.merefleksi_berkesadaran, bermakna: rpk.merefleksi_bermakna, menggembirakan: rpk.merefleksi_menggembirakan, asesmen: rpk.asesmen_merefleksi },
                        ]" :key="section.key">
                            <td class="border px-4 py-2 align-top">
                                <b>{{ section.key }}:</b> {{ section.main }}
                            </td>
                            <td class="border px-4 py-2 align-top">
                                <div><span v-if="section.berkesadaran">√</span> Berkesadaran</div>
                                <div><span v-if="section.bermakna">√</span> Bermakna</div>
                                <div><span v-if="section.menggembirakan">√</span> Menggembirakan</div>
                            </td>
                            <td class="border px-4 py-2 align-top">
                                {{ section.asesmen }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-else class="text-center text-gray-500 mt-10">
            Tidak ada data yang bisa ditampilkan.
        </div>
    </div>
</template>
