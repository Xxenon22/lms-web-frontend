<script setup>
import api from '../../services/api';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const rpk = ref({})
const route = useRoute()
const router = useRouter()
const id = route.params.id

const fetchRpk = async () => {
    try {
        console.log("fetchRpk -> id:", id);
        console.log("fetchRpk -> url:", `/rpk/${id}`);
        const res = await api.get(`/rpk/${id}`) // ambil sesuai ID
        const item = res.data

        // convert string "true"/"false" ke boolean
        for (let i = 1; i <= 8; i++) {
            const key = `dpl_${i}`;
            item[key] = item[key] === true || item[key] === "true"
        }
        rpk.value = item
    } catch (error) {
        console.error('fetching rpk :', error)
        console.error('response status:', error.response?.status, 'data:', error.response?.data);
    }
}


const back = () => {
    router.back()
}

// === Fungsi Export ke PDF ===
const exportPDF = () => {
    if (!rpk.value || Object.keys(rpk.value).length === 0) return;
    const data = rpk.value;
    const doc = new jsPDF();

    // === Format tanggal (untuk PDF) ===
    const formatDateForPDF = (hari_tanggal) => {
        if (!hari_tanggal) return "Date not available";
        return new Intl.DateTimeFormat("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "Asia/Jakarta",
        }).format(new Date(hari_tanggal));
    };

    // Judul
    doc.setFontSize(16);
    doc.text("Learning Plan", 105, 15, { align: "center" });

    // Bagian Identitas
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
            ["Day / Date", formatDateForPDF(data.hari_tanggal)], // formatted date
            ["Time", data.waktu || ""],
        ],
    });

    // Bagian Instructional Design
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

    // Bagian Dimensi Profil Lulusan
    const dplList = [];
    if (data.dpl_1) dplList.push("DPL 1: Keimanan dan ketakwaan terhadap Tuhan YME");
    if (data.dpl_2) dplList.push("DPL 2: Kewargaan");
    if (data.dpl_3) dplList.push("DPL 3: Penalaran Kritis");
    if (data.dpl_4) dplList.push("DPL 4: Kreativitas");
    if (data.dpl_5) dplList.push("DPL 5: Kolaborasi");
    if (data.dpl_6) dplList.push("DPL 6: Kemandirian");
    if (data.dpl_7) dplList.push("DPL 7: Kesehatan");
    if (data.dpl_8) dplList.push("DPL 8: Komunikasi");

    doc.text("Dimensi Profil Lulusan", 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        theme: "grid",
        head: [["DPL"]],
        body: dplList.map(item => [item]),
    });

    // Bagian Pengalaman Belajar
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
                    menggembirakan: data.memahami_menggembirakan
                }),
                data.asesmen_memahami || ""
            ],
            [
                "Mengaplikasikan: " + (data.mengaplikasikan || ""),
                getPrinsip({
                    berkesadaran: data.mengaplikasikan_berkesadaran,
                    bermakna: data.mengaplikasikan_bermakna,
                    menggembirakan: data.mengaplikasikan_menggembirakan
                }),
                data.asesmen_mengaplikasikan || ""
            ],
            [
                "Merefleksi: " + (data.merefleksi || ""),
                getPrinsip({
                    berkesadaran: data.merefleksi_berkesadaran,
                    bermakna: data.merefleksi_bermakna,
                    menggembirakan: data.merefleksi_menggembirakan
                }),
                data.asesmen_merefleksi || ""
            ],
        ],
    });

    doc.save("RPK.pdf");
};

// Helper: ambil prinsip pembelajaran (centang yg true)
const getPrinsip = (obj) => {
    if (!obj) return "";
    let prinsip = [];
    if (obj.berkesadaran) prinsip.push("Berkesadaran");
    if (obj.bermakna) prinsip.push("Bermakna");
    if (obj.menggembirakan) prinsip.push("Menggembirakan");
    return prinsip.join(", ");
};

const formatDate = (hari_tanggal) => {
    if (!hari_tanggal) return "Date not available";
    return new Intl.DateTimeFormat("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Jakarta",
    }).format(new Date(hari_tanggal));
};

onMounted(async () => {
    await fetchRpk()
})
</script>

<template>
    <div v-if="rpk">
        <div class="m-5 flex justify-between">
            <Button icon="pi pi-arrow-left" label="Back" @click="back" />
            <Button icon="pi pi-file-pdf" label="Export PDF" @click="exportPDF" />
        </div>
        <div class="">
            <div class="flex justify-center m-5">
                <span class="text-3xl">Learning Plan</span>
            </div>

            <!-- IDENTITAS -->
            <div class="flex border-2">
                <div class="w-1/5 flex justify-center items-center bg-gray-100">
                    <div class="text-3xl">Identity</div>
                </div>
                <div class="w-4/5 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <h1 class="font-bold">Class :</h1> <span>{{ rpk.name_rombel }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <h1 class="font-bold">Subject :</h1> <span>{{ rpk.nama_mapel }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <h1 class="font-bold">Phase :</h1> <span>{{ rpk.phase }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <h1 class="font-bold">Grade :</h1> <span>{{ rpk.grade_lvl }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <h1 class="font-bold">Teacher :</h1> <span>{{ rpk.teacher_name }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <h1 class="font-bold">Instructor :</h1> <span>{{ rpk.instructor_name }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <h1 class="font-bold">Tutor :</h1> <span>{{ rpk.tutor }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <h1 class="font-bold">Day / Date :</h1> <span>{{ formatDate(rpk.hari_tanggal) }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <h1 class="font-bold">Time :</h1> <span>{{ rpk.waktu }}</span>
                    </div>
                </div>
            </div>

            <!-- DESAIN PEMBELAJARAN -->
            <div class="flex border-2">
                <div class="w-1/5 flex justify-center items-center bg-gray-100">
                    <div class="text-3xl">Instructional Design</div>
                </div>
                <div class="w-4/5 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <h1 class="font-bold">Learning Objective :</h1> <span>{{ rpk.tujuan_pembelajaran }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <h1 class="font-bold">Interdisciplinery :</h1> <span>{{ rpk.lintas_disiplin_ilmu }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <h1 class="font-bold">Learning Partnership :</h1> <span>{{
                            rpk.kemitraan_pembelajaran }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <h1 class="font-bold">Digital Utilization :</h1> <span>{{
                            rpk.pemanfaatan_digital }}</span>
                    </div>
                    <h1 class="font-bold">Dimensi Profil Lulusan :</h1>
                    <div class="flex felx-col gap-4">
                        <div class="w-1/2">
                            <div class="flex items-center gap-2">
                                <Checkbox v-model="rpk.dpl_1" :binary="true" inputId="gpd1" disabled />
                                <label for="gpd1"><b>DPL 1:</b> Keimanan dan ketakwaan Terhadap Tuhan YME</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <Checkbox v-model="rpk.dpl_2" :binary="true" inputId="gpd2" disabled />
                                <label for="gpd2"><b>DPL 2:</b> Kewargaan</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <Checkbox v-model="rpk.dpl_3" :binary="true" inputId="gpd3" disabled />
                                <label for="gpd3"><b>DPL 3:</b> Penalaran Kritis</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <Checkbox v-model="rpk.dpl_4" :binary="true" inputId="gpd4" disabled />
                                <label for="gpd4"><b>DPL 4:</b> Kreativitas</label>
                            </div>
                        </div>
                        <div class="w-1/2">
                            <div class="flex items-center gap-2">
                                <Checkbox v-model="rpk.dpl_5" :binary="true" inputId="gpd5" disabled />
                                <label for="gpd5"><b>DPL 5:</b> Kolaborasi</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <Checkbox v-model="rpk.dpl_6" :binary="true" inputId="gpd6" disabled />
                                <label for="gpd6"><b>DPL 6:</b> Kemandirian</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <Checkbox v-model="rpk.dpl_7" :binary="true" inputId="gpd7" disabled />
                                <label for="gpd7"><b>DPL 7:</b> Kesehatan</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <Checkbox v-model="rpk.dpl_8" :binary="true" inputId="gpd8" disabled />
                                <label for="gpd8"><b>DPL 8:</b> Komunikasi</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PENGALAMAN BELAJAR, PRINSIP PEMBELAJARAN, ASESMEN -->
            <div class="border">
                <table class="w-full border text-left">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border px-4 py-2 w-1/3">Pengalaman Belajar</th>
                            <th class="border px-4 py-2 w-1/3">Prinsip Pembelajaran</th>
                            <th class="border px-4 py-2 w-1/3">Asesmen</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- MEMAHAMI -->
                        <tr>
                            <td class="border px-4 py-2 align-top">
                                <span class="font-bold">Memahami:</span>
                                {{ rpk.memahami }}
                            </td>
                            <td class="border px-4 py-2 align-top">
                                <div><span v-if="rpk.memahami_berkesadaran">√</span> Berkesadaran</div>
                                <div><span v-if="rpk.memahami_bermakna">√</span> Bermakna</div>
                                <div><span v-if="rpk.memahami_menggembirakan">√</span> Menggembirakan</div>
                            </td>
                            <td class="border px-4 py-2 align-top">
                                {{ rpk.asesmen_memahami }}
                            </td>
                        </tr>

                        <!-- MENGAPLIKASIKAN -->
                        <tr>
                            <td class="border px-4 py-2 align-top">
                                <span class="font-bold">Mengaplikasikan:</span>
                                {{ rpk.mengaplikasikan }}
                            </td>
                            <td class="border px-4 py-2 align-top">
                                <div><span v-if="rpk.mengaplikasikan_berkesadaran">√</span> Berkesadaran</div>
                                <div><span v-if="rpk.mengaplikasikan_bermakna">√</span> Bermakna</div>
                                <div><span v-if="rpk.mengaplikasikan_menggembirakan">√</span> Menggembirakan
                                </div>
                            </td>
                            <td class="border px-4 py-2 align-top">
                                {{ rpk.asesmen_mengaplikasikan }}
                            </td>
                        </tr>

                        <!-- MEREFLEKSI -->
                        <tr>
                            <td class="border px-4 py-2 align-top">
                                <span class="font-bold">Merefleksi:</span>
                                {{ rpk.merefleksi }}
                            </td>
                            <td class="border px-4 py-2 align-top">
                                <div><span v-if="rpk.merefleksi_berkesadaran">√</span> Berkesadaran</div>
                                <div><span v-if="rpk.merefleksi_bermakna">√</span> Bermakna</div>
                                <div><span v-if="rpk.merefleksi_menggembirakan">√</span> Menggembirakan</div>
                            </td>
                            <td class="border px-4 py-2 align-top">
                                {{ rpk.asesmen_merefleksi }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>