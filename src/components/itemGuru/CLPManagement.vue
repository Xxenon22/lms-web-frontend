<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import api from '../../services/api';
import { useToast } from 'primevue';
import Swal from 'sweetalert2';

const toast = useToast()
const allRpk = ref([])
const userId = ref(null)
const selectedRpk = ref([])
const filteredClass = ref([])
const kelasHasilPencarian = ref(null)

const fetchUserId = async () => {
    try {
        const res = await api.get("/auth/profile")
        userId.value = res.data.id
    } catch (error) {
        console.error("error fetch user ID:", error)
    }
};

const fetchRpk = async () => {
    if (!userId.value) return console.warn("userId kosong, tidak fetch data")
    try {
        const res = await api.get(`/rpk/all-rpk/${userId.value}`)
        // console.log("Fetched RPK:", res.data)
        allRpk.value = res.data.sort((a, b) => {
            return new Date(b.hari_tanggal) - new Date(a.hari_tanggal)
        })

    } catch (error) {
        console.error("Error fetch RPK :", error)
    }
}

const deleteRpk = async (id) => {
    const confirm = await Swal.fire({
        title: "Are you sure, you want to delete this Learning Plan?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
        const res = await api.delete(`/rpk/${id}`)
        await fetchRpk()
        toast.add({ severity: 'success', summary: 'Success', detail: 'Data successfully deleted', life: 3000 })
    } catch (error) {
        console.error("Error Delete RPK :", error)
    }
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

// search engine
const search = (event) => {
    const query = event.query ? event.query.toLowerCase() : "";

    filteredClass.value = allRpk.value.filter((rpk) => {
        const grade = String(rpk.name_grade || "").toLowerCase();
        const major = String(rpk.major || "").toLowerCase();
        const rombel = String(rpk.name_rombel || "").toLowerCase();
        const colab = String(rpk.colab_class || "").toLowerCase();
        const tanggal = formatDate(rpk.hari_tanggal).toLowerCase();

        return (
            grade.includes(query) ||
            major.includes(query) ||
            rombel.includes(query) ||
            colab.includes(query) ||
            tanggal.includes(query)
        );
    })
        .map((rpk) => ({
            name: `${rpk.grade_lvl || ''} ${rpk.major || ''} ${rpk.name_rombel || ''} ${rpk.colab_class || ''} • ${formatDate(rpk.hari_tanggal)}`,
            id: rpk.id,
        }));
};

watch(selectedRpk, (newVal) => {
    if (Array.isArray(newVal) && newVal.length > 0) {
        const selectedId = newVal[0].id;
        kelasHasilPencarian.value =
            allRpk.value.find((rpk) => rpk.id === selectedId) || null;
    } else {
        kelasHasilPencarian.value = null;
    }
});


const displayedRpk = computed(() => {
    if (kelasHasilPencarian.value) {
        return [kelasHasilPencarian.value];
    }
    return allRpk.value;
});


onMounted(async () => {
    await fetchUserId()
    if (userId.value) {
        await fetchRpk()
    } else {
        console.error("⚠️ userId masih kosong, fetchRpk tidak dijalankan")
    }
})
</script>

<template>
    <DataView :value="displayedRpk">
        <template #list="slotProps">
            <div class="flex flex-col">

                <label for="multiple-ac-1" class="font-bold mb-2 block">Learning Plan</label>
                <AutoComplete v-model="selectedRpk" optionLabel="name" :suggestions="filteredClass" @complete="search"
                    inputId="multiple-ac-1" multiple fluid />

                <div v-for="rpk in slotProps.items" :key="rpk.id">
                    <div class="border-b border-surface-200 dark:border-surface-700">
                        <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4">
                            <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                                <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                                    <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{
                                        formatDate(rpk.hari_tanggal) }}</span>
                                    <div class="text-lg font-medium mt-2">
                                        <span>
                                            {{ rpk.grade_lvl || '' }}
                                            {{ rpk.major || '' }}
                                            {{ rpk.name_rombel || '' }}
                                            <span v-if="rpk.colab_class">
                                                {{ rpk.colab_class }}
                                            </span>
                                        </span>
                                    </div>

                                </div>
                                <div class="flex flex-col md:items-end gap-8">
                                    <div class="flex flex-row-reverse md:flex-row gap-2">
                                        <RouterLink :to="{ name: 'CLP-View-Teacher', params: { id: rpk.id } }">
                                            <Button icon="pi pi-eye" outlined />
                                        </RouterLink>
                                        <Button icon="pi pi-trash" variant="outlined" severity="danger"
                                            @click="deleteRpk(rpk.id)"></Button>
                                        <RouterLink :to="{ name: 'Edit-CLP', params: { id: rpk.id } }">
                                            <Button icon="pi pi-pencil" label="Edit Material"
                                                class="flex-auto md:flex-initial whitespace-nowrap"></Button>
                                        </RouterLink>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </DataView>

    <Toast />
</template>