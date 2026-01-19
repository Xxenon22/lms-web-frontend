<script setup>
import { onMounted, ref, computed } from "vue";
import api from "../../services/api";
// import { RouterLink } from "vue-router";
// import { useToast, Toast } from "primevue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const back = () => router.back();
const materi = ref([]);
const guru = ref([]);
const id = route.params.id

const fetchMateri = async () => {
    try {
        const res = await api.get(`/module-pembelajaran/admin/${id}`);
        materi.value = res.data
        console.log(materi.value)
    } catch (error) {
        console.error("Error retrieving teacher materials:", error);
    }
}

const fetchGuru = async () => {
    try {
        const res = await api.get(`/auth/teacher/${id}`);
        guru.value = res.data
    } catch (error) {
        console.error("Fetch teacher:", error);
    }
}

const materiUnique = computed(() => {
    const map = new Map();

    materi.value.forEach(m => {
        const key = m.materi_uuid || m.id;
        if (!map.has(key)) {
            map.set(key, m);
        }
    });

    return Array.from(map.values());
});


const getEmbedUrl = (url) => {
    if (!url) return "";
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w\-]{11})/);
    const videoId = match ? match[1] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
};

const bukaPdf = (m) => {
    if (!m.id) {
        toast.add({ severity: "warn", summary: "File Not Found", detail: "PDF tidak tersedia!", life: 3000 });
        return;
    }
    const pdfUrl = `${import.meta.env.VITE_API_URL}api/module-pembelajaran/${m.id}/pdf`;
    window.open(pdfUrl, "_blank");
};

onMounted(async () => {
    await fetchMateri();
    await fetchGuru();
});
</script>

<template>
    <section class="m-10">
        <Button label="Back" icon="pi pi-chevron-left" @click="back" />
        <div class="flex justify-end mb-5">
            <div class="flex flex-col ml-10 items-end" v-if="guru">
                <h1 class="text-3xl font-semibold">{{ guru.username }}</h1>
                <p class="text-sm text-gray-500">{{ guru.teacher_subject }}</p>
            </div>
        </div>
    </section>
    <div class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8 m-10">
        <div v-for="m in materiUnique" :key="m.id" class="mb-8 break-inside-avoid">
            <Card class="w-full overflow-hidden shadow-md">
                <template #header>
                    <div class="p-4 flex justify-center bg-gray-100">
                        <iframe class="rounded-md" width="100%" height="160" :src="getEmbedUrl(m.video_url)"
                            title="YouTube video player" frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen />
                    </div>
                </template>

                <template #title>
                    <h2 class="text-lg font-semibold line-clamp-2">
                        {{ m.judul }}
                    </h2>
                </template>

                <template #subtitle>
                    <span class="text-sm text-gray-500 truncate">
                        {{ m.link_zoom }}
                    </span>
                </template>

                <template #content>
                    <p class="text-sm text-gray-600 line-clamp-4">
                        {{ m.deskripsi }}
                    </p>
                </template>

                <template #footer>
                    <Button label="See PDF" class="w-full mt-3" @click="bukaPdf(m)" />
                </template>
            </Card>
        </div>
    </div>
</template>