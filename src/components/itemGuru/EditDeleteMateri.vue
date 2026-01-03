<script setup>
import { ref, onMounted, computed } from "vue";
import api from "../../services/api";
import { useToast } from "primevue";
import Swal from "sweetalert2";
const toast = useToast();
const materiPembelajaran = ref([]);
const visible = ref(false);
const loading = ref(false);
const newFile = ref(null);
const userId = ref(null);
const daftarKelas = ref([]);
const selectedKelas = ref([]);
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
const isSaving = ref(false);
const originalMateri = ref(null);
const originalKelas = ref([]);


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
    loading.value = true;
    try {
        const res = await api.get("/module-pembelajaran", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        materiPembelajaran.value = res.data;
    } catch (error) {
        if (error.code === "ECONNABORTED") {
            toast.add({ severity: "error", summary: "Timeout", detail: "Server terlalu lambat merespon", life: 3000 });
        } else {
            toast.add({ severity: "error", summary: "Error", detail: error.message, life: 3000 });
        }
        console.error("fetchModulePembelajaran:", error);
    } finally {
        loading.value = false;
    }
};

const materiUnique = computed(() => {
    const map = new Map();

    materiPembelajaran.value.forEach(m => {
        // ganti key kalau punya materi_parent_id / materi_uuid
        const key = m.materi_uuid || m.id;
        if (!map.has(key)) {
            map.set(key, {
                ...m,
                kelas_ids: [m.kelas_id],
                kelas_list: [m.kelas_nama]
            });
        } else {
            map.get(key).kelas_ids.push(m.kelas_id);
            map.get(key).kelas_list.push(m.kelas_nama);
        }
    });

    return Array.from(map.values());
});

// watch(materiUnique, (v) => {
//     console.log("MATERI UNIQUE:", v);
// }, { immediate: true });

const fetchKelas = async () => {
    const res = await api.get("/kelas");
    daftarKelas.value = res.data;
    // console.log("Daftar Kelas:", daftarKelas.value);
};

const kelasOptions = computed(() => {
    return daftarKelas.value.map(k => ({
        id: k.id,
        label: `${k.grade_lvl} ${k.major} ${k.name_rombel || ''} - ${k.nama_mapel}`
    }));
});


// Pilih file → simpan di frontend
const handleFileSelect = (event) => {
    const file = event.files?.[0];
    if (file) {
        newFile.value = file;
        toast.add({ severity: "info", summary: "File Selected", detail: file.name, life: 2000 });
    }
};

const isEditFormValid = computed(() => {
    const m = selectedMateri.value;

    if (!m) return false;

    // WAJIB (link_zoom OPTIONAL)
    if (!m.judul?.trim()) return false;
    if (!m.video_url?.trim()) return false;
    if (!m.deskripsi?.trim()) return false;

    // minimal 1 kelas harus dipilih
    if (!selectedKelas.value || selectedKelas.value.length === 0) return false;

    return true;
});


const updateMateri = async () => {
    if (!isEditFormValid.value) {
        toast.add({
            severity: "warn",
            summary: "Form Incomplete",
            detail: "All fields are required except Zoom Link",
            life: 3000,
        });
        return;
    }
    try {
        isSaving.value = true;
        const materi = selectedMateri.value;

        const res = await api.put(`/module-pembelajaran/${materi.id}`, {
            judul: materi.judul,
            video_url: materi.video_url,
            deskripsi: materi.deskripsi,
            link_zoom: materi.link_zoom,
            pass_code: materi.pass_code,
        });

        await api.put(`/module-pembelajaran/${materi.id}/kelas`, {
            kelas_ids: selectedKelas.value
        });

        // UPDATE DATA DI ARRAY TANPA FETCH ULANG
        const index = materiPembelajaran.value.findIndex(
            m => m.id === materi.id
        );

        if (index !== -1) {
            materiPembelajaran.value[index] = {
                ...materiPembelajaran.value[index],
                ...res.data
            };
        }

        // upload PDF di background
        if (newFile.value) {
            uploadPdf(materi.id);
        }

        toast.add({
            severity: "success",
            summary: "Updated",
            detail: "Material successfully updated",
            life: 1500,
        });

        visible.value = false;
        newFile.value = null;

    } catch (error) {
        if (error.code === "ECONNABORTED") return;

        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to update material",
            life: 3000,
        });
    } finally {
        isSaving.value = false;
    }
};

const uploadPdf = async (materiId) => {
    try {
        const fd = new FormData();
        fd.append("file", newFile.value);

        await api.put(
            `/module-pembelajaran/${materiId}/pdf`,
            fd,
            { headers: { "Content-Type": "multipart/form-data" } }
        );

        toast.add({
            severity: "info",
            summary: "PDF Updated",
            detail: "PDF file uploaded successfully",
            life: 2000,
        });

    } catch (err) {
        toast.add({
            severity: "warn",
            summary: "PDF Error",
            detail: "Failed to upload PDF",
            life: 3000,
        });
    }
};

// Buka dialog edit
const openEditDialog = (materi) => {
    // console.log("KELAS IDS:", materi.kelas_ids);
    // console.log("OPTIONS:", kelasOptions.value);
    selectedMateri.value = { ...materi }; // copy data lama
    selectedKelas.value = [...materi.kelas_ids]; // isi kelas lama

    // SIMPAN DATA AWAL
    originalMateri.value = JSON.parse(JSON.stringify(materi));
    originalKelas.value = [...materi.kelas_ids];

    selectedKelas.value = materi.kelas_ids
        .filter(id => kelasOptions.value.some(k => k.id === id));
    newFile.value = null;
    visible.value = true;
};

const isFormChanged = computed(() => {
    if (!originalMateri.value) return false;

    const m = selectedMateri.value;
    const o = originalMateri.value;

    const materiChanged =
        m.judul !== o.judul ||
        m.video_url !== o.video_url ||
        m.deskripsi !== o.deskripsi ||
        m.link_zoom !== o.link_zoom ||
        m.pass_code !== o.pass_code;

    const kelasChanged =
        JSON.stringify(selectedKelas.value.sort()) !==
        JSON.stringify(originalKelas.value.sort());

    const fileChanged = !!newFile.value;

    return materiChanged || kelasChanged || fileChanged;
});

// Hapus materi
const deleteMateri = async (materiUuid) => {
    const confirm = await Swal.fire({
        title: "Delete this material?",
        text: "Material will be removed from all classes",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Yes, delete all",
        cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
        await api.delete(`/module-pembelajaran/uuid/${materiUuid}`);

        toast.add({
            severity: "success",
            summary: "Deleted",
            detail: "Material successfully removed from all classes",
            life: 2000
        });

        // HAPUS LANGSUNG DI FRONTEND (tanpa fetch ulang)
        materiPembelajaran.value = materiPembelajaran.value.filter(
            m => m.materi_uuid !== materiUuid
        );

    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Failed",
            detail: "failed to delete material",
            life: 3000
        });
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
    await fetchKelas();
});
</script>

<template>
    <div class="card">
        <DataView :value="materiUnique">
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

                                        <div class="text-sm text-gray-500">
                                            Sent To Class:
                                            <span v-for="(k, i) in materi.kelas_list || []"
                                                :key="`${materi.materi_uuid}-${i}`">
                                                {{ k || 'Kelas tidak terdefinisi' }}
                                                <span v-if="i < materi.kelas_list.length - 1">, </span>
                                            </span>
                                        </div>

                                        <div class="footer flex justify-between items-center">
                                            <Button icon="pi pi-file-pdf" label="File PDF" @click="bukaPdf(materi)" />

                                            <div class="space-x-2">
                                                <Button icon="pi pi-trash" severity="danger" outlined
                                                    class="flex-auto md:flex-initial whitespace-nowrap"
                                                    @click="deleteMateri(materi.materi_uuid)"></Button>

                                                <Button icon="pi pi-pencil" label="Edit Material"
                                                    @click="openEditDialog(materi)" />

                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <!-- <div
                                    class="flex flex-col max-w-fit md:flex-row justify-between md:items-center flex-1 gap-6">
                                    <div class="text-sm text-gray-500">
                                        Sent To Class:
                                        <p v-for="(k, i) in materi.kelas_list" :key="i">
                                            {{ k }}<span v-if="i < materi.kelas_list.length - 1">, </span>
                                        </p>
                                    </div>
                                </div> -->

                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col md:items-end gap-8">
                    <div class="flex flex-row-reverse md:flex-row gap-2">

                        <Dialog v-model:visible="visible" modal header="Edit Material" :style="{ width: '50rem' }"
                            :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" v-if="selectedMateri">
                            <span class="text-surface-500 dark:text-surface-400 block mb-8">
                                Updating Material.
                            </span>

                            <div class="flex items-center gap-4 mb-4">
                                <label class="font-semibold w-50">Target Class</label>
                                <MultiSelect v-model="selectedKelas" :options="kelasOptions" optionLabel="label"
                                    optionValue="id" placeholder="Select Class"
                                    class="flex w-full overflow-auto break-all" display="chip" />
                            </div>


                            <div class="flex items-center gap-4 mb-4">
                                <label class="font-semibold w-50">Material Title</label>
                                <InputText v-model="selectedMateri.judul" class="w-full"
                                    placeholder="Enter Material Title" />
                            </div>

                            <div class="flex items-center gap-4 mb-4">
                                <label class="font-semibold w-50">Video URL</label>
                                <InputText v-model="selectedMateri.video_url" placeholder="Enter Youtube link"
                                    class="w-full" />
                            </div>

                            <div class="flex items-center gap-4 mb-4">
                                <label class="font-semibold w-50">PDF File</label>
                                <div class="flex flex-col w-full">
                                    <FileUpload mode="basic" name="file" accept=".pdf" chooseLabel="Select File"
                                        :customUpload="true" class="w-full mb-2" @select="handleFileSelect" />

                                    <!-- File lama -->
                                    <div v-if="selectedMateri.file_url && !newFile" class="text-sm text-gray-500 mt-1">
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
                                <Textarea v-model="selectedMateri.deskripsi" placeholder="Enter Description"
                                    class="w-full" />
                            </div>

                            <div class="flex items-center gap-4 mb-8">
                                <label class="font-semibold w-50">Link Zoom (optional)</label>
                                <InputText v-model="selectedMateri.link_zoom" class="w-full" />
                            </div>

                            <div class="flex items-center gap-4 mb-8">
                                <label class="font-semibold w-50">Passcode Zoom (optional)</label>
                                <InputText v-model="selectedMateri.pass_code" class="w-full" />
                            </div>

                            <div class="flex justify-end gap-2">
                                <Button type="button" label="Cancel" severity="secondary"
                                    @click="visible = false"></Button>
                                <Button label="Save" :loading="isSaving"
                                    :disabled="!isEditFormValid || isSaving || !isFormChanged" @click="updateMateri" />
                            </div>
                        </Dialog>

                    </div>
                </div>
            </template>
        </DataView>
    </div>
</template>
