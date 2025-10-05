<script setup>
import api from "../../services/api";
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const fileUrl = ref("");
const selectedFile = ref(null);
const loading = ref(false);
const uploaded = ref(false);

const files = ref([]); // daftar semua file dari db

// pilih file PDF
const handleFileSelect = (event) => {
    const file = event.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
        toast.add({ severity: "warn", summary: "Invalid File", detail: "Only PDF allowed", life: 3000 });
        return;
    }

    selectedFile.value = file;
    uploaded.value = false;
};

// upload ke Express
const uploadFile = async () => {
    if (!selectedFile.value) {
        toast.add({ severity: "warn", summary: "No File", detail: "Please select a file first.", life: 3000 });
        return;
    }

    loading.value = true;
    try {
        const formData = new FormData();
        formData.append("jadwal", selectedFile.value);

        const res = await api.post("/timetables-grade-xi", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        fileUrl.value = `${import.meta.env.VITE_API_URL}/uploads/timetables-grade-xi/${res.data.file_name}`;
        uploaded.value = true;

        toast.add({ severity: "success", summary: "Success", detail: "File Uploaded Successfully.", life: 3000 });

        await fetchFiles(); // refresh daftar
    } catch (err) {
        toast.add({ severity: "error", summary: "Upload Failed", detail: err.message, life: 3000 });
    } finally {
        loading.value = false;
    }
};

// ambil semua file dari db
const fetchFiles = async () => {
    try {
        const res = await api.get("/timetables-grade-xi");
        files.value = res.data.map((file) => ({
            id: file.id,
            name: file.file_name,
            url: `${import.meta.env.VITE_API_URL}/uploads/timetables-grade-xi/${file.file_name}`,
        }));
    } catch (err) {
        toast.add({ severity: "error", summary: "Error", detail: err.message, life: 3000 });
    }
};

// hapus file
const deleteFile = async (id) => {
    try {
        await api.delete(`/timetables-grade-xi/${id}`);
        toast.add({ severity: "success", summary: "Deleted", detail: "File deleted successfully.", life: 3000 });
        await fetchFiles();
    } catch (err) {
        toast.add({ severity: "error", summary: "Delete Failed", detail: err.message, life: 3000 });
    }
};

onMounted(() => {
    fetchFiles();
});
</script>

<template>
    <div>
        <Card>
            <template #header>
                <h1 class="m-5">Upload File</h1>
                <div class="m-5 flex flex-col justify-center">
                    <FileUpload mode="basic" name="file" accept=".pdf" chooseLabel="Choose File" :customUpload="true"
                        class="w-full mb-2" @select="handleFileSelect" />
                    <p v-if="fileUrl" class="text-sm text-green-500">File Uploaded Successfully</p>
                </div>
                <div class="flex justify-end">
                    <Button label="Submit" :loading="loading" :disabled="!selectedFile || uploaded"
                        @click="uploadFile" />
                </div>
            </template>

            <template #content>
                <h1>Timetable List</h1>
                <div class="m-5">
                    <DataTable :value="files" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20, 50]"
                        tableStyle="min-width: 50rem">
                        <Column field="name" header="File Name" />
                        <Column header="Action">
                            <template #body="{ data }">
                                <div class="space-x-3">
                                    <a :href="data.url" target="_blank" class="text-blue-500 underline">View</a>
                                    <Button icon="pi pi-trash" outlined severity="danger"
                                        @click="deleteFile(data.id)" />
                                </div>
                            </template>
                        </Column>
                        <template
                            #paginatorcontainer="{ first, last, page, pageCount, prevPageCallback, nextPageCallback, totalRecords }">
                            <div
                                class="flex items-center gap-4 border border-primary bg-transparent rounded-full w-full py-1 px-2 justify-between">
                                <Button icon="pi pi-chevron-left" rounded text @click="prevPageCallback"
                                    :disabled="page === 0" />
                                <div class="text-color font-medium">
                                    <span class="hidden sm:block">Showing {{ first }} to {{ last }} of
                                        {{ totalRecords }}</span>
                                    <span class="block sm:hidden">Page {{ page + 1 }} of {{ pageCount }}</span>
                                </div>
                                <Button icon="pi pi-chevron-right" rounded text @click="nextPageCallback"
                                    :disabled="page === pageCount - 1" />
                            </div>
                        </template>
                    </DataTable>
                </div>
            </template>
        </Card>
    </div>
    <Toast />
</template>
