<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../../services/api';
import { useToast } from 'primevue/usetoast';

const visible = ref(false);
const namaGrup = ref('');
const linkGrup = ref('');
const forumList = ref([]);
const toast = useToast();
const value = ref('');
const items = ref([]);
const daftarKelas = ref([]);
const selectedKelas = ref([]);
const isLoading = ref(true);
const userId = ref(null);

const fetchUserId = async () => {
    try {
        const res = await api.get("/auth/profile")
        userId.value = res.data.id
    } catch (err) {
        console.error("JWT decode Failed:", err);
    }
};

// Ambil daftar kelas
const fetchDaftarKelas = async () => {
    try {
        const res = await api.get("/kelas");
        daftarKelas.value = res.data.map(k => ({
            id: k.id,
            name: `${k.grade_lvl || ''} ${k.major || ''} ${k.name_rombel || ''} - ${k.nama_mapel || ''}`
        }));
    } catch (error) {
        console.error("Fetch Kelas:", error);
    }
};

// Ambil semua forum diskusi
const fetchForumList = async () => {
    try {
        const res = await api.get("/forum-discuss");
        // console.log("forum data :", res.data)
        forumList.value = res.data;
    } catch (error) {
        console.error("Fetch discuss forum :", error);
    }
};

// Simpan forum baru
const saveForum = async () => {
    if (!namaGrup.value || !linkGrup.value || selectedKelas.value.length === 0) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please complete all fields', life: 3000 });
        return;
    }

    const inserts = selectedKelas.value.map((kelasId) => ({
        nama_grup: namaGrup.value,
        link_grup: linkGrup.value,
        kelas_id: kelasId,
        guru_id: userId.value
    }));

    try {
        await api.post("/forum-discuss", inserts);
        toast.add({ severity: 'success', summary: 'Success', detail: 'The link has been successfully saved.', life: 3000 });

        // reset
        visible.value = false;
        namaGrup.value = '';
        linkGrup.value = '';
        selectedKelas.value = [];

        await fetchForumList();
    } catch (error) {
        console.error("Save forum:", error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save Data', life: 3000 });
    }
};

// Hapus data forum
const deleteForum = async (id) => {
    try {
        // console.log("Deleting forum with ID:", id); // Debug
        await api.delete(`/forum-discuss/${id}`);
        toast.add({ severity: "success", summary: "Deleted", detail: "Forum deleted sucessfully" });
        await fetchForumList()
    } catch (error) {
        console.error("error delete interactive forum:", error)
    }
};

const normalizedForumList = computed(() =>
    forumList.value.map(f => ({
        ...f,
        searchableText: `
      ${f.nama_grup}
      ${f.grade_lvl}
      ${f.major}
      ${f.name_rombel}
    `.toLowerCase()
    }))
);


/* AutoComplete suggestion */
const search = (event) => {
    const query = event.query.toLowerCase();

    if (!query) {
        items.value = [];
        return;
    }

    items.value = normalizedForumList.value
        .filter(f => f.searchableText.includes(query))
        .map(f => ({
            label: `${f.nama_grup} – ${f.grade_lvl} ${f.major} ${f.name_rombel}`,
            value: f.nama_grup
        }));
};

// Filtered list berdasarkan search
const filteredForumList = computed(() => {
    if (!value.value) return forumList.value;

    const q = value.value.toLowerCase();
    return normalizedForumList.value.filter(f =>
        f.searchableText.includes(q)
    );
});

onMounted(async () => {
    await fetchUserId();
    await fetchForumList();
    await fetchDaftarKelas();
    isLoading.value = false;
});
</script>

<template>
    <div class="m-5 flex justify-between">
        <div>
            <Button icon="pi pi-plus" outlined rounded v-tooltip="'Share Link Whatsapp Group'"
                @click="visible = true" />
        </div>
        <div>
            <AutoComplete v-model="value" :suggestions="items" optionLabel="label" optionValue="value"
                placeholder="Search group or class..." @complete="search" />
        </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-10">
        <ProgressSpinner />
    </div>

    <div v-else-if="filteredForumList.length === 0" class="text-center text-gray-400 mb-8">
        There are currently no class groups.
    </div>


    <!-- Daftar Forum -->
    <div v-else class="space-y-4 m-4">
        <Card v-for="forum in filteredForumList" :key="forum.id">
            <template #header>
                <div class="flex items-center justify-between">
                    <div class="flex flex-col">
                        <div class="flex m-5 space-x-2 items-center">
                            <Icon icon="heroicons:user-group-20-solid" width="20" height="20" />
                            <h2 class="font-semibold">{{ forum.nama_grup }}</h2>
                        </div>
                        <div class="ml-13">
                            <p> {{ forum.grade_lvl }} {{ forum.major }} {{ forum.name_rombel }}
                            </p>
                        </div>
                    </div>
                    <div class="mr-5">
                        <Button icon="pi pi-times" outlined rounded severity="danger" @click="deleteForum(forum.id)" />
                    </div>
                </div>
            </template>

            <template #content>
                <div class="text-sm px-5 py-2 text-blue-400 break-all">
                    <a :href="forum.link_grup" target="_blank">{{ forum.link_grup }}</a>
                </div>
            </template>
        </Card>
    </div>

    <!-- Dialog Insert -->
    <Dialog v-model:visible="visible" modal header="Share Whatsapp Link" :style="{ width: '35rem' }">
        <span class="text-surface-500 dark:text-surface-400 block mb-8">Share your Link Whatsapp Group.</span>
        <div class="flex items-center gap-4 mb-4">
            <label for="namaGrup" class="font-semibold w-24">Group Name</label>
            <InputText v-model="namaGrup" id="grupName" class="flex-auto" autocomplete="off" />
        </div>
        <div class="flex items-center gap-4 mb-8">
            <label for="linkGrup" class="font-semibold w-32">Link Group</label>
            <InputText v-model="linkGrup" id="linkGrup" class="w-full" autocomplete="off" />
        </div>
        <div class="flex items-center gap-4 mb-8">
            <span for="linkGrup" class="font-semibold w-32">Select Class</span>
            <MultiSelect v-model="selectedKelas" display="chip" :options="daftarKelas" optionLabel="name" filter
                option-value="id" class="flex w-full overflow-auto break-all" autocomplete="off" />
        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="visible = false" />
            <Button type="button" label="Save" @click="saveForum" />
        </div>
    </Dialog>
</template>
