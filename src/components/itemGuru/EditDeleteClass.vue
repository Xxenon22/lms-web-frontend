<script setup>
import { useToast } from "primevue/usetoast";
import { ref, onMounted, watch } from "vue";
import api from "../../services/api";
import Swal from "sweetalert2";


const isLoading = ref(true);
const toast = useToast();
const dataKelas = ref([]);
const mapel = ref([]);
const rombel = ref([]);
const visible = ref(false);
const selectedKelas = ref({
    id: null,
    rombel_id: "",
    id_mapel: "",
    link_wallpaper_kelas: "",
});
const userId = ref(null)
const images = ref([]);
const activeIndex = ref(0);
const fetchUserId = async () => {
    try {
        const res = await api.get("/auth/profile")
        userId.value = res.data.id
    } catch (err) {
        console.error("Gagal decode JWT:", err);
    }
};

// Ambil data kelas dari Supabase
const fetchDataKelas = async () => {
    try {
        const res = await api.get("/kelas")
        dataKelas.value = res.data
    } catch (error) {
        console.error("error fetch data kelas :", error)
    }
};

// Ambil data grade level (jika belum ada)
const fetchRombel = async () => {
    try {
        const res = await api.get("/rombel")
        rombel.value = res.data.map(b => ({
            id: b.id,
            name: `${b.grade_name || ''} ${b.major} ${b.name_rombel || ''} `, // tampilkan gabungan
        }));
    } catch (error) {
        console.error("error fetching rombel :", error)
    }
};

const fetchMapel = async () => {
    try {
        const res = await api.get("/mapel")
        mapel.value = res.data;
    } catch (error) {
        console.error("error fetch mapel :", error)
    }
};

onMounted(async () => {
    images.value = [
        { itemImageSrc: '/wallpapers/w1.jpg', thumbnailImageSrc: '/wallpapers/w1.jpg' },
        { itemImageSrc: '/wallpapers/w2.jpg', thumbnailImageSrc: '/wallpapers/w2.jpg' },
        { itemImageSrc: '/wallpapers/w3.jpg', thumbnailImageSrc: '/wallpapers/w3.jpg' },
        { itemImageSrc: '/wallpapers/w4.jpg', thumbnailImageSrc: '/wallpapers/w4.jpg' },
        { itemImageSrc: '/wallpapers/w5.jpg', thumbnailImageSrc: '/wallpapers/w5.jpg' },
        { itemImageSrc: '/wallpapers/w6.jpg', thumbnailImageSrc: '/wallpapers/w6.jpg' },
        { itemImageSrc: '/wallpapers/w7.jpg', thumbnailImageSrc: '/wallpapers/w7.jpg' },
    ];
    await fetchUserId();
    await fetchRombel();
    await fetchMapel();
    await fetchDataKelas();
    isLoading.value = false;
});

watch(activeIndex, (newIndex) => {
    selectedKelas.value.link_wallpaper_kelas = images.value[newIndex].itemImageSrc;
});


// Simpan perubahan
const updateKelas = async () => {
    try {
        await api.put(`/kelas/${selectedKelas.value.id}`, {
            rombel_id: selectedKelas.value.rombel_id,
            id_mapel: selectedKelas.value.id_mapel,
            link_wallpaper_kelas: selectedKelas.value.link_wallpaper_kelas,
        });

        toast.add({
            severity: "success",
            summary: "Success",
            detail: "Class updated successfully.",
            life: 2000,
        });

        visible.value = false;
        await fetchDataKelas();
    } catch (error) {
        console.error("failed to update the data :", error)
    }
};

// Saat tombol edit ditekan
const openEditDialog = (kelas) => {
    selectedKelas.value = {
        id: kelas.id,
        id_mapel: kelas.id_mapel,
        rombel_id: kelas.rombel_id,
        link_wallpaper_kelas: kelas.link_wallpaper_kelas
    };
    const idx = images.value.findIndex(img => img.itemImageSrc === kelas.link_wallpaper_kelas);
    activeIndex.value = idx !== -1 ? idx : 0;

    visible.value = true;
};

// Hapus Kelas 
const deleteKelas = async (id) => {
    const confirm = await Swal.fire({
        title: "Are you sure?",
        text: "If you delete this class, all related data (like discussions, assignments, etc.) will also be deleted!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
        await api.delete(`/kelas/${id}`);
        Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "The class and its related data have been deleted.",
            timer: 2000,
            showConfirmButton: false,
        });

        await fetchDataKelas();
    } catch (err) {
        console.error("Failed to delete:", err);
        Swal.fire({
            icon: "error",
            title: "Failed!",
            text: "This class cannot be deleted because it is still linked to other data — such as learning modules, students, or assignments.",
        });
    }
};
</script>

<template>
    <div class="card">
        <DataView :value="dataKelas">
            <template #list>
                <div class="flex flex-col">
                    <div v-for="kelas in dataKelas" :key="kelas.id">
                        <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4" :class="{
                            'border-b border-surface-200 dark:border-surface-700':
                                index !== 0,
                        }">
                            <div class="md:w-40 relative">
                                <img class="block xl:block mx-auto rounded w-full"
                                    :src="kelas.link_wallpaper_kelas || 'https://primefaces.org/cdn/primevue/images/usercard.png'"
                                    style="width: 200px; height: 120px;" />
                                <div class="absolute bg-black/70 rounded-border" style="left: 4px; top: 4px">

                                </div>
                            </div>
                            <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                                <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                                    <div>
                                        <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{
                                            kelas.nama_mapel }}</span>
                                        <div class="text-lg font-medium mt-2">
                                            {{ kelas.grade_lvl }} {{ kelas.major }} {{ kelas.name_rombel }}
                                        </div>
                                    </div>
                                </div>
                                <div class="flex flex-col md:items-end gap-8">
                                    <!-- <span class="text-xl font-semibold">${{ item.price }}</span> -->
                                    <div class="flex flex-row-reverse md:flex-row gap-2">
                                        <Button icon="pi pi-trash" severity="danger" outlined
                                            class="flex-auto md:flex-initial whitespace-nowrap"
                                            @click="deleteKelas(kelas.id)"></Button>
                                    </div>
                                </div>
                            </div>
                            <Button icon="pi pi-pencil" label="Edit Class" @click="openEditDialog(kelas)" />
                        </div>
                    </div>

                    <Drawer v-model:visible="visible" :responsiveOptions="responsiveOptions" modal
                        header="Edit Classroom" position="bottom" style="height: auto">
                        <div class="flex justify-center items-center">
                            <div class="flex justify-center items-center w-1/2">
                                <div class="">
                                    <Galleria :value="images.slice(0)" :numVisible="5" v-model:activeIndex="activeIndex"
                                        containerStyle="max-width: 640px; margin: auto">
                                        <!-- Gambar utama -->
                                        <template #item="slotProps">
                                            <img :src="slotProps.item.itemImageSrc"
                                                style="width: 100%; height: 300px; object-fit: cover;" />
                                        </template>

                                        <!-- Thumbnail -->
                                        <template #thumbnail="slotProps">
                                            <img :src="slotProps.item.thumbnailImageSrc"
                                                style="width: 80px; height: 60px; object-fit: cover;" />
                                        </template>
                                    </Galleria>
                                </div>
                            </div>

                            <div class="flex flex-col justify-center items-center  w-1/2">
                                <div class="flex items-center gap-4 mb-4">
                                    <label for="mata pelajaran" class="font-semibold w-24">Subject</label>
                                    <Select v-model="selectedKelas.id_mapel" :options="mapel" option-value="id"
                                        option-label="nama_mapel" placeholder="Enter the Subject"
                                        class="w-full md:w-56" />
                                </div>
                                <div class="flex items-center gap-4 mb-8">
                                    <label for="rombel" class="font-semibold w-24">Class</label>
                                    <Select v-model="selectedKelas.rombel_id" :options="rombel" option-value="id"
                                        option-label="name" placeholder="Enter the Class" class="w-full md:w-56" />
                                </div>
                                <div class="flex justify-end gap-2">
                                    <Button type="button" label="Cancel" severity="secondary"
                                        @click="visible = false"></Button>
                                    <Button label="Save" @click="updateKelas" />
                                </div>
                            </div>
                        </div>
                    </Drawer>
                </div>
            </template>
        </DataView>
    </div>
    <Toast />
</template>
