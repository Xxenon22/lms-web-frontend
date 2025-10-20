<script setup>
import api from '../../services/api';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const rpk = ref({}) // Pastikan selalu object, bukan string/null
const route = useRoute()
const router = useRouter()
const id = route.params.id



// === FETCH RPK ===
const fetchRpk = async () => {
    try {
        const res = await api.get(`/rpk/${id}`);

        if (!res || !res.data) {
            console.warn("⚠️ Response kosong:", res);
            rpk.value = {};
            return;
        }

        const item = res.data;

        // Jika item bukan object, hindari error
        if (typeof item !== "object" || Array.isArray(item)) {
            console.error("❌ Data tidak valid:", item);
            rpk.value = {};
            return;
        }

        // Pastikan properti DPL berupa boolean
        for (let i = 1; i <= 8; i++) {
            const key = `dpl_${i}`;
            item[key] = item[key] === true || item[key] === "true";
        }

        rpk.value = item;
        console.log("✅ Data berhasil diambil:", rpk.value);

    } catch (error) {
        console.error("❌ Error fetch RPK:", error);
        console.error("response status:", error.response?.status, "data:", error.response?.data);
        rpk.value = {}; // Set object kosong agar template tidak crash
    }
};

// === KEMBALI KE HALAMAN SEBELUMNYA ===
const back = () => {
    router.back();
};

// === EXPORT PDF ===
const exportPDF = () => {
    if (!rpk.value || Object.keys(rpk.value).length === 0) {
        console.warn("⚠️ Tidak ada data untuk diexport ke PDF");
        return;
    }

    const data = rpk.value;
    const doc = new jsPDF();

    // Format tanggal
    const formatDateForPDF = (hari_tanggal) => {
        if (!hari_tanggal) return "Date not available";
        return new Intl.DateTimeFormat("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "Asia/Jakarta",
        }).format(new Date(hari_tanggal));
    };

    // === Judul ===
    doc.setFontSize(16);
    doc.text("Learning Plan", 105, 15, { align: "center" });

    // === Bagian Identitas ===
    doc.setFontSize(12);
    doc.text("Identity", 14, 30);
    autoTable(doc, {
        startY: 35,
        theme: "grid",
        head: [["Field", "Value"]],
        body: [
            ["Class & Subject", `${data.name_rombel || ""} - ${data.nama_mapel || ""}`],
            ["Phase", data.phase || ""],
            ["Grade", data.grade_lvl || ""],
            ["Teacher", data.teacher_name || ""],
            ["Instructor", data.instructor_name || ""],
            ["Tutor", data.tutor || ""],
            ["Day / Date", formatDateForPDF(data.hari_tanggal)],
            ["Time", data.waktu || ""],
        ],

    });

    // === Instructional Design ===
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

    // === Dimensi Profil Lulusan ===
    const dplList = [];
    for (let i = 1; i <= 8; i++) {
        if (data[`dpl_${i}`]) {
            dplList.push(`DPL ${i}`);
        }
    }

    doc.text("Dimensi Profil Lulusan", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        theme: "grid",
        head: [["DPL"]],
        body: dplList.length ? dplList.map((d) => [d]) : [["No DPL Selected"]],
    });

    // === Pengalaman Belajar ===
    doc.text("Learning Experience", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        theme: "grid",
        head: [["Pengalaman Belajar", "Prinsip Pembelajaran", "Asesmen"]],
        body: [
            [
                "Memahami: " + (data.memahami || ""),
                getPrinsip({
                    berkesadaran: data.memahami_berkesadaran,
                    bermakna: data.memahami_bermakna,
                    menggembirakan: data.memahami_menggembirakan,
                }),
                data.asesmen_memahami || "",
            ],
            [
                "Mengaplikasikan: " + (data.mengaplikasikan || ""),
                getPrinsip({
                    berkesadaran: data.mengaplikasikan_berkesadaran,
                    bermakna: data.mengaplikasikan_bermakna,
                    menggembirakan: data.mengaplikasikan_menggembirakan,
                }),
                data.asesmen_mengaplikasikan || "",
            ],
            [
                "Merefleksi: " + (data.merefleksi || ""),
                getPrinsip({
                    berkesadaran: data.merefleksi_berkesadaran,
                    bermakna: data.merefleksi_bermakna,
                    menggembirakan: data.merefleksi_menggembirakan,
                }),
                data.asesmen_merefleksi || "",
            ],
        ],
    });

    doc.save("RPK.pdf");
};

// === Helper: Prinsip Pembelajaran ===
const getPrinsip = (obj) => {
    if (!obj) return "";
    const prinsip = [];
    if (obj.berkesadaran) prinsip.push("Berkesadaran");
    if (obj.bermakna) prinsip.push("Bermakna");
    if (obj.menggembirakan) prinsip.push("Menggembirakan");
    return prinsip.join(", ");
};

// === Helper: Format tanggal untuk tampilan ===
const formatDate = (hari_tanggal) => {
    if (!hari_tanggal) return "Date not available";
    return new Intl.DateTimeFormat("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Jakarta",
    }).format(new Date(hari_tanggal));
};

// === Lifecycle ===
onMounted(async () => {
    await fetchRpk();
});
</script>

<template>
    <div v-if="Object.keys(rpk).length">
        <div class="m-5 flex justify-between">
            <Button icon="pi pi-arrow-left" label="Back" @click="back" />
            <Button icon="pi pi-file-pdf" label="Export PDF" @click="exportPDF" />
        </div>

        <div class="flex justify-center m-5">
            <span class="text-3xl">Learning Plan</span>
        </div>

        <!-- ========== BAGIAN IDENTITAS ========== -->
        <div class="flex border-2">
            <!-- Kolom Kiri -->
            <div class="w-1/5 flex justify-center items-center bg-gray-100">
                <div class="text-3xl font-semibold text-center">Identity</div>
            </div>

            <!-- Kolom Kanan -->
            <div class="w-4/5 grid grid-cols-2 gap-x-4 gap-y-2 p-4">
                <div class="col-span-1 flex">
                    <span class="font-bold w-32">Class :</span>
                    <span>{{ rpk.name_rombel || '-' }}</span>
                </div>
                <div class="col-span-1 flex">
                    <span class="font-bold w-32">Subject :</span>
                    <span>{{ rpk.subject || '-' }}</span>
                </div>

                <div class="col-span-1 flex">
                    <span class="font-bold w-32">Phase :</span>
                    <span>{{ rpk.phase || '-' }}</span>
                </div>
                <div class="col-span-1 flex">
                    <span class="font-bold w-32">Grade :</span>
                    <span>{{ rpk.grade_lvl || '-' }}</span>
                </div>

                <div class="col-span-1 flex">
                    <span class="font-bold w-32">Teacher :</span>
                    <span>{{ rpk.teacher_name || '-' }}</span>
                </div>
                <div class="col-span-1 flex">
                    <span class="font-bold w-32">Instructor :</span>
                    <span>{{ rpk.instructor_name || '-' }}</span>
                </div>

                <div class="col-span-1 flex">
                    <span class="font-bold w-32">Tutor :</span>
                    <span>{{ rpk.tutor || '-' }}</span>
                </div>
                <div class="col-span-1 flex">
                    <span class="font-bold w-32">Day / Date :</span>
                    <span>{{ formatDate(rpk.hari_tanggal) }}</span>
                </div>

                <div class="col-span-2 flex">
                    <span class="font-bold w-32">Time :</span>
                    <span>{{ rpk.waktu || '-' }}</span>
                </div>
            </div>
        </div>

        <!-- ========== DESAIN PEMBELAJARAN ========== -->
        <div class="flex border-2 mt-5">
            <div class="w-1/5 flex justify-center items-center bg-gray-100">
                <div class="text-3xl font-semibold text-center">Instructional Design</div>
            </div>
            <div class="w-4/5 space-y-5 m-4">
                <div v-for="(val, key) in {
                    'Learning Objective': rpk.tujuan_pembelajaran,
                    'Interdisciplinery': rpk.lintas_disiplin_ilmu,
                    'Learning Partnership': rpk.kemitraan_pembelajaran,
                    'Digital Utilization': rpk.pemanfaatan_digital
                }" :key="key" class="flex items-center space-x-2">
                    <h1 class="font-bold">{{ key }} :</h1> <span>{{ val }}</span>
                </div>

                <h1 class="font-bold">Dimensi Profil Lulusan :</h1>
                <div class="flex flex-wrap gap-4">
                    <div class="flex flex-col gap-2 w-1/2">
                        <div v-for="i in 4" :key="'dpl-left-' + i" class="flex items-center gap-2">
                            <Checkbox v-model="rpk[`dpl_${i}`]" :binary="true" :inputId="`dpl${i}`" disabled />
                            <label :for="`dpl${i}`"><b>DPL {{ i }}:</b></label>
                        </div>
                    </div>
                    <div class="flex flex-col gap-2 w-1/2">
                        <div v-for="i in [5, 6, 7, 8]" :key="'dpl-right-' + i" class="flex items-center gap-2">
                            <Checkbox v-model="rpk[`dpl_${i}`]" :binary="true" :inputId="`dpl${i}`" disabled />
                            <label :for="`dpl${i}`"><b>DPL {{ i }}:</b></label>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ========== PENGALAMAN BELAJAR ========== -->
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
                    <tr v-for="(section, idx) in [
                        { key: 'Memahami', main: rpk.memahami, berkesadaran: rpk.memahami_berkesadaran, bermakna: rpk.memahami_bermakna, menggembirakan: rpk.memahami_menggembirakan, asesmen: rpk.asesmen_memahami },
                        { key: 'Mengaplikasikan', main: rpk.mengaplikasikan, berkesadaran: rpk.mengaplikasikan_berkesadaran, bermakna: rpk.mengaplikasikan_bermakna, menggembirakan: rpk.mengaplikasikan_menggembirakan, asesmen: rpk.asesmen_mengaplikasikan },
                        { key: 'Merefleksi', main: rpk.merefleksi, berkesadaran: rpk.merefleksi_berkesadaran, bermakna: rpk.merefleksi_bermakna, menggembirakan: rpk.merefleksi_menggembirakan, asesmen: rpk.asesmen_merefleksi }
                    ]" :key="idx">
                        <td class="border px-4 py-2 align-top">
                            <span class="font-bold">{{ section.key }}:</span> {{ section.main }}
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

    <div v-else class="text-center mt-10 text-gray-500">
        ⏳ Loading data or no record found...
    </div>
</template>
