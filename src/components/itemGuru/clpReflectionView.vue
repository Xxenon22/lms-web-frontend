<script setup>
import api from '../../services/api';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const clpRefleksi = ref({})
const route = useRoute()
const router = useRouter()
const id = route.params.id

const fetchRpkReflection = async () => {
    try {
        const res = await api.get(`/rpk-refleksi/${id}`)
        if (!res || !res.data) {
            // console.warn("⚠️ Response kosong:", res);
            clpRefleksi.value = {};
            return;
        }
        const item = res.data;
        // console.log("Fetched RPK Data:", item);
        if (typeof item !== "object" || Array.isArray(item)) {
            console.error("Invalid Data:", item);
            clpRefleksi.value = {};
            return;
        }

        clpRefleksi.value = item;
    } catch (error) {
        console.error("Error Fetch RPK Reflection :", error)
    }
}

// === Fungsi Export PDF ===
const exportPDF = () => {
    if (!clpRefleksi.value || Object.keys(clpRefleksi.value).length === 0) {
        console.warn("⚠️ Tidak ada data untuk diekspor.");
        return;
    }

    const data = clpRefleksi.value;
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

    // Judul
    doc.setFontSize(16);
    doc.text("Learning Reflection", 105, 15, { align: "center" });

    // Data utama dalam bentuk tabel
    autoTable(doc, {
        startY: 30,
        theme: "grid",
        // head: [["Field", "Value"]],
        body: [
            ["Subject", data.subject || ""],
            ["Teacher", data.teacher_name || ""],
            ["Instructor", data.instructor_name || ""],
            ["Grade", `${data.name_grade || ""} ${data.major || ''} ${data.name_rombel || ""} ${data.colab_class || ''}`],
            ["Day / Date", formatDateForPDF(data.hari_tanggal)],
            ["Time", data.waktu || ""],
            ["Student's Reflection", data.refleksi_siswa || ""],
            ["Teacher's Reflection", data.refleksi_guru || ""],
            ["Level of Achievement", data.tngkt_pencapaian || ""],
            ["Description of Achievement", data.desk_pencapaian || ""],
            ["Follow Up", data.follow_up || ""],
            ["Students guidance", data.pendampingan_siswa || ""],
            ["Notes", data.keterangan || ""],
        ],
        styles: {
            valign: "middle",
        },
        headStyles: {
            fillColor: [200, 200, 200], // abu-abu header
        },
        columnStyles: {
            0: { cellWidth: 60, fontStyle: "bold" }, // kolom label
            1: { cellWidth: 120 }, // kolom value
        },
    });

    doc.save("Learning_Reflection.pdf");
};

const back = () => {
    router.back()
}

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
    await fetchRpkReflection()
})
</script>

<template>
    <div class="m-5" v-if="Object.keys(clpRefleksi).length">
        <div class="m-5 flex justify-between">
            <Button icon="pi pi-chevron-left" label="Back" @click="back" />
            <Button icon="pi pi-file-pdf" label="Export PDF" @click="exportPDF" />
        </div>

        <div>
            <div class="flex justify-center m-5">
                <span class="text-3xl"> Learning Reflection</span>
            </div>

            <!-- SUBJECT -->
            <div class="flex border-2">
                <div class="w-1/3 flex items-center bg-gray-100">
                    <div class="font-bold m-2">
                        <h1>Subject</h1>
                    </div>
                </div>
                <div class="w-2/3 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <span>{{ clpRefleksi.subject }}</span>
                    </div>
                </div>
            </div>

            <!-- TEACHER -->
            <div class="flex border-2">
                <div class="w-1/3 flex items-center bg-gray-100">
                    <div class="font-bold m-2">
                        <h1>Teacher</h1>
                    </div>
                </div>
                <div class="w-2/3 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <span>{{ clpRefleksi.teacher_name }}</span>
                    </div>
                </div>
            </div>

            <!-- INSTRUCTOR -->
            <div class="flex border-2">
                <div class="w-1/3 flex items-center bg-gray-100">
                    <div class="font-bold m-2">
                        <h1>Instructor</h1>
                    </div>
                </div>
                <div class="w-2/3 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <span>{{ clpRefleksi.instructor_name }}</span>
                    </div>
                </div>
            </div>

            <!-- GRADE -->
            <div class="flex border-2">
                <div class="w-1/3 flex items-center bg-gray-100">
                    <div class="font-bold m-2">
                        <h1>Grade</h1>
                    </div>
                </div>
                <div class="w-2/3 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <span>{{ clpRefleksi.name_grade || '' }} {{ clpRefleksi.major || '' }} {{
                            clpRefleksi.name_rombel || '' }} {{ clpRefleksi.colab_class || '' }}</span>
                    </div>
                </div>
            </div>

            <!-- Day / Date -->
            <div class="flex border-2">
                <div class="w-1/3 flex items-center bg-gray-100">
                    <div class="font-bold m-2">
                        <h1>Day / Date</h1>
                    </div>
                </div>
                <div class="w-2/3 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <span>{{ formatDate(clpRefleksi.hari_tanggal) }}</span>
                    </div>
                </div>
            </div>

            <!-- TIME -->
            <div class="flex border-2">
                <div class="w-1/3 flex items-center bg-gray-100">
                    <div class="font-bold m-2">
                        <h1>Time</h1>
                    </div>
                </div>
                <div class="w-2/3 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <span>{{ clpRefleksi.waktu }}</span>
                    </div>
                </div>
            </div>

            <!-- STUDENT REFLECTION -->
            <div class="flex border-2">
                <div class="w-1/3 flex items-center bg-gray-100">
                    <div class="font-bold m-2">
                        <h1>Student's Reflection</h1>
                    </div>
                </div>
                <div class="w-2/3 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <span>{{ clpRefleksi.refleksi_siswa }}</span>
                    </div>
                </div>
            </div>

            <!-- TEACHER REFLECTION -->
            <div class="flex border-2">
                <div class="w-1/3 flex items-center bg-gray-100">
                    <div class="font-bold m-2">
                        <h1>Teacher's Reflection</h1>
                    </div>
                </div>
                <div class="w-2/3 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <span>{{ clpRefleksi.refleksi_guru }}</span>
                    </div>
                </div>
            </div>

            <!-- Level of Achievement -->
            <div class="flex border-2">
                <div class="w-1/3 flex items-center bg-gray-100">
                    <div class="font-bold m-2">
                        <h1>Level of Achievement</h1>
                    </div>
                </div>
                <div class="w-2/3 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <span>{{ clpRefleksi.tngkt_pencapaian }}</span>
                    </div>
                </div>
            </div>

            <!-- Description of Achievement -->
            <div class="flex border-2">
                <div class="w-1/3 flex items-center bg-gray-100">
                    <div class="font-bold m-2">
                        <h1>Description of Achievement</h1>
                    </div>
                </div>
                <div class="w-2/3 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <span>{{ clpRefleksi.desk_pencapaian }}</span>
                    </div>
                </div>
            </div>

            <!-- Follow Up -->
            <div class="flex border-2">
                <div class="w-1/3 flex items-center bg-gray-100">
                    <div class="font-bold m-2">
                        <h1>Follow Up</h1>
                    </div>
                </div>
                <div class="w-2/3 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <span>{{ clpRefleksi.follow_up }}</span>
                    </div>
                </div>
            </div>

            <!-- Students in need of guidance -->
            <div class="flex border-2">
                <div class="w-1/3 flex items-center bg-gray-100">
                    <div class="font-bold m-2">
                        <h1>Students guidance</h1>
                    </div>
                </div>
                <div class="w-2/3 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <span>{{ clpRefleksi.pendampingan_siswa }}</span>
                    </div>
                </div>
            </div>

            <!-- Notes -->
            <div class="flex border-2">
                <div class="w-1/3 flex items-center bg-gray-100">
                    <div class="font-bold m-2">
                        <h1>Notes</h1>
                    </div>
                </div>
                <div class="w-2/3 space-y-5 m-4">
                    <div class="flex items-center space-x-2">
                        <span>{{ clpRefleksi.keterangan }}</span>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>