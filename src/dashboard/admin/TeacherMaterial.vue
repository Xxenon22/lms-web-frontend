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
    <div class="m-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-12">
        <div class="" v-for="m in materiUnique" :key="m.id">
            <Card style="width: 25rem; overflow: hidden">
                <template #header>
                    <div class="m-5 flex justify-center">
                        <iframe width="160" height="80" :src="getEmbedUrl(m.video_url)" title="YouTube video player"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
                        </iframe>
                    </div>
                </template>
                <template #title>{{ m.judul }}</template>
                <template #subtitle>{{ m.link_zoom }}</template>
                <template #content>
                    <p class="m-0">
                        {{ m.deskripsi }}
                    </p>
                </template>
                <template #footer>
                    <div class="flex gap-4 mt-1">
                        <!-- <router-link :to="{ name: 'Teacher-Assignment', params: { id: m.bank_soal_id } }">
                            <Button label="See Assignment" severity="secondary" variant="outlined" class="w-full" />
                        </router-link> -->
                        <Button label="See Pdf" class="w-full" @click="bukaPdf(m)" />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>