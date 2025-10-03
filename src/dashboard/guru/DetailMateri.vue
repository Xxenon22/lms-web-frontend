<script setup>
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import api from '../../services/api';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const materiId = route.params.id;
const modulePembelajaran = ref(null);
const toast = useToast();

const fetchModulePembelajaran = async () => {
    console.log("Fetching module by ID:", materiId);

    try {
        const res = await api.get(`/module-pembelajaran/${materiId}`);
        modulePembelajaran.value = res.data;
        console.log("Data ditemukan:", res.data);
    } catch (error) {
        console.error("Gagal mengambil data:", error);
        toast.add({
            severity: "error",
            summary: "Warning",
            detail: "Failed to Retrieve Learning Module.",
            life: 3000,
        });
    }
};

const kembali = () => {
    router.back();
};

const getEmbedUrl = (url) => {
    if (!url) return "";
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w\-]{11})/);
    const videoId = match ? match[1] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
};

const bukaPdf = () => {
    if (modulePembelajaran.value?.file_url) {
        const pdfUrl = `${import.meta.env.VITE_API_URL}${modulePembelajaran.value.file_url}`;
        window.open(pdfUrl, "_blank");
    } else {
        toast.add({
            severity: "warn",
            summary: "File Not Found",
            detail: "PDF file URL is not available.",
            life: 3000,
        });
    }
};

const bukaLinkZoom = () => {
    if (modulePembelajaran.link_zoom) {
        window.open(modulePembelajaran.link_zoom, "_blank");
    } else {
        toast.add({
            severity: "warn",
            summary: "link Zoom is Not Found",
            detail: "The link Zoom is not Available.",
            life: 3000,
        });
    }
}

onMounted(() => {
    fetchModulePembelajaran();
});
</script>

<template>
    <div class="space-y-5" v-if="modulePembelajaran">
        <div class="flex justify-between">
            <Button icon="pi pi-arrow-left" label="Back" @click="kembali" />
            <Button label="Join Meeting" @click="bukaLinkZoom(modulePembelajaran)" rounded />
        </div>

        <Card>
            <template #header>
                <h1 class="m-5">Learning Material: {{ modulePembelajaran.judul }}</h1>
            </template>

            <template #content>
                <div class="flex flex-col space-y-5">
                    <div class="flex justify-center">
                        <iframe width="560" height="315" :src="getEmbedUrl(modulePembelajaran.video_url)"
                            title="YouTube video player" frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
                        </iframe>
                    </div>

                    <div>
                        <div class="overflow-auto break-all" v-html="modulePembelajaran.deskripsi"></div>
                    </div>

                    <div class="footer">
                        <Button icon="pi pi-file-pdf" label="PDF File" @click="bukaPdf" />
                    </div>
                </div>
            </template>
        </Card>
    </div>

    <div v-else class="text-center text-gray-500 py-10">
        🔍 Material Not Found...
    </div>

    <Toast />
</template>
