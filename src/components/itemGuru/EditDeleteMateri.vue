<script setup>
import { ref, onMounted } from "vue";
import api from "../../services/api";
import { useToast } from "primevue";
import Swal from "sweetalert2";

const toast = useToast();
const materiPembelajaran = ref([]);
const visible = ref(false);
const loading = ref(false);
const newFile = ref(null);
const userId = ref(null);
const selectedMateri = ref({
    id: null,
    guru_id: null,
    judul: "",
    video_url: "",
    file_url: "",
    link_zoom: "",
    pass_code: "",
    deskripsi: "",
});

// Ambil user ID
const fetchUserId = async () => {
    try {
        const res = await api.get("/auth/profile");
        userId.value = res.data.id;
    } catch (error) {
        console.error("Error fetch user ID :", error);
    }
};

// Ambil data materi
const fetchModulePembelajaran = async () => {
    try {
        const res = await api.get("/module-pembelajaran");
        materiPembelajaran.value = res.data;
    } catch (error) {
        console.error("fetchModulePembelajaran:", error);
    }
};

// Pilih file → simpan di frontend
const handleFileSelect = (event) => {
    const file = event.files?.[0];
    if (file) {
        newFile.value = file;
        toast.add({ severity: "info", summary: "File Selected", detail: file.name, life: 2000 });
    }
};

const updateMateri = async () => {
    try {
        const materi = selectedMateri.value;
        let fileToSave = materi.file_url;

        if (newFile.value) {
            const formData = new FormData();
            formData.append("file", newFile.value);
            formData.append("judul", materi.judul);
            formData.append("video_url", materi.video_url);
            formData.append("deskripsi", materi.deskripsi);
            formData.append("guru_id", userId.value); // <= wajib dikirim

            const res = await api.post("/uploads", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            fileToSave = res.data.url;
        }

        await api.put(`/module-pembelajaran/${materi.id}`, {
            judul: materi.judul,
            video_url: materi.video_url,
            file_url: fileToSave,
            deskripsi: materi.deskripsi,
            link_zoom: materi.link_zoom,
            pass_code: materi.pass_code,
            guru_id: userId.value // <= wajib juga dikirim saat update
        });

    } catch (error) {
        console.error("UPLOAD PDF ERROR:", error);
    }
};

// Buka dialog edit
const openEditDialog = (materi) => {
    selectedMateri.value = { ...materi }; // copy data lama
    newFile.value = null;
    visible.value = true;
};

// Hapus materi
const deleteMateri = async (id) => {
    const confirm = await Swal.fire({
        title: "Are you sure, you want to delete this Material?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
        await api.delete(`/module-pembelajaran/${id}`);
        toast.add({ severity: "success", summary: "Berhasil Dihapus", detail: "Materi berhasil dihapus", life: 2000 });
        await fetchModulePembelajaran();
    } catch (error) {
        toast.add({ severity: "error", summary: "Gagal Hapus", detail: error.message, life: 3000 });
    }
};

// Embed YouTube
const getEmbedUrl = (url) => {
    if (!url) return "";
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w\-]{11})/);
    const videoId = match ? match[1] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
};

// Buka PDF
const bukaPdf = (materi) => {
    if (!materi.id) {
        toast.add({
            severity: "warn",
            summary: "File Not Found",
            detail: "PDF tidak tersedia",
            life: 3000,
        });
        return;
    }

    const pdfUrl = `${import.meta.env.VITE_API_URL}api/module-pembelajaran/${materi.id}/pdf`;
    window.open(pdfUrl, "_blank");
};

onMounted(async () => {
    await fetchUserId();
    await fetchModulePembelajaran();
});
</script>

<template>
    <div class="card">
        <DataView :value="materiPembelajaran">
            <template #list="slotProps">
                <div class="flex flex-col">
                    <div v-for="materi in slotProps.items" :key="materi.id">
                        <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4"
                            :class="{ 'border-b border-surface-200 dark:border-surface-700': index !== 0 }">
                            <div class="md:w-40 relative">
                                <iframe width="160" height="80" :src="getEmbedUrl(materi.video_url)"
                                    title="YouTube video player" frameborder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
                                </iframe>
                            </div>
                            <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                                <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                                    <div class="grid gap-3">
                                        <span class="text-xl text-surface-500 dark:text-surface-400">{{ materi.judul
                                            }}</span>
                                        <div class="flex space-x-3 text-lg max-h-40 overflow-auto break-words">
                                            <span v-tooltip.bottom="'Link Meeting'">{{ materi.link_zoom }}</span>
                                        </div>
                                        <div class="flex space-x-3 text-lg max-h-40 overflow-auto break-words">
                                            <i v-tooltip.bottom="'Passcode Meeting'">{{ materi.pass_code }}</i>
                                        </div>
                                        <div class="text-sm max-h-40 overflow-auto break-words"
                                            v-html="materi.deskripsi"></div>

                                        <div class="footer">
                                            <Button icon="pi pi-file-pdf" label="File PDF" @click="bukaPdf(materi)" />
                                        </div>
                                    </div>
                                </div>

                                <div class="flex flex-col md:items-end gap-8">
                                    <div class="flex flex-row-reverse md:flex-row gap-2">
                                        <Button icon="pi pi-trash" severity="danger" outlined
                                            class="flex-auto md:flex-initial whitespace-nowrap"
                                            @click="deleteMateri(materi.id)"></Button>

                                        <Dialog v-model:visible="visible" modal header="Edit Material"
                                            :style="{ width: '50rem' }"
                                            :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" v-if="selectedMateri">
                                            <span class="text-surface-500 dark:text-surface-400 block mb-8">
                                                Updating Material.
                                            </span>

                                            <div class="flex items-center gap-4 mb-4">
                                                <label class="font-semibold w-50">Material Title</label>
                                                <InputText v-model="selectedMateri.judul" class="w-full"
                                                    placeholder="Enter Material Title" />
                                            </div>

                                            <div class="flex items-center gap-4 mb-4">
                                                <label class="font-semibold w-50">Video URL</label>
                                                <InputText v-model="selectedMateri.video_url"
                                                    placeholder="Enter Youtube link" class="w-full" />
                                            </div>

                                            <div class="flex items-center gap-4 mb-4">
                                                <label class="font-semibold w-50">PDF File</label>
                                                <div class="flex flex-col w-full">
                                                    <FileUpload mode="basic" name="file" accept=".pdf"
                                                        chooseLabel="Select File" :customUpload="true"
                                                        class="w-full mb-2" @select="handleFileSelect" />

                                                    <!-- File lama -->
                                                    <div v-if="selectedMateri.file_url && !newFile"
                                                        class="text-sm text-gray-500 mt-1">
                                                        Current File:
                                                        <a :href="selectedMateri.file_url" target="_blank"
                                                            class="text-blue-500 underline">Open File</a>
                                                    </div>

                                                    <!-- File baru -->
                                                    <div v-if="newFile" class="text-sm text-green-600 mt-1">
                                                        New File Selected: {{ newFile?.name }}
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="flex items-center gap-4 mb-8">
                                                <label class="font-semibold w-50">Description</label>
                                                <Textarea v-model="selectedMateri.deskripsi"
                                                    placeholder="Enter Description" class="w-full" />
                                            </div>

                                            <div class="flex items-center gap-4 mb-8">
                                                <label class="font-semibold w-50">Link Zoom</label>
                                                <InputText v-model="selectedMateri.link_zoom" class="w-full" />
                                            </div>

                                            <div class="flex items-center gap-4 mb-8">
                                                <label class="font-semibold w-50">Passcode Zoom</label>
                                                <InputText v-model="selectedMateri.pass_code" class="w-full" />
                                            </div>

                                            <div class="flex justify-end gap-2">
                                                <Button type="button" label="Cancel" severity="secondary"
                                                    @click="visible = false"></Button>
                                                <Button label="Save" @click="updateMateri" />
                                            </div>
                                        </Dialog>

                                        <Button icon="pi pi-pencil" label="Edit Material"
                                            @click="openEditDialog(materi)" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </DataView>
    </div>
</template>
