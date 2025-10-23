<script setup>
import { onMounted, ref } from 'vue';
import api from '../../services/api';
import Swal from 'sweetalert2';

const allMateri = ref([])
const userId = ref(null)

const fetchUserId = async () => {
    try {
        const res = await api.get("/auth/profile")
        userId.value = res.data
    } catch (error) {
        console.error("Error fetch user id :", error)
    }
};

const formatDate = (created_at) => {
    if (!created_at) return "Date not available";
    return new Intl.DateTimeFormat("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Jakarta",
    }).format(new Date(created_at));
};


const fetchAllMateri = async () => {
    try {
        const res = await api.get("/bank-soal")
        allMateri.value = res.data
    } catch (error) {
        console.error("error fetch allMateri :", error)
    }
}

const deleteAssignment = async (bankSoalId) => {
    const confirm = await Swal.fire({
        title: "Are you sure, you want to delete this Assignment?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
        const res = await api.delete(`/bank-soal/${bankSoalId}`)
        await fetchAllMateri()
    } catch (error) {
        console.error("failed to delete data assignment :", error)
    }
}

onMounted(async () => {
    await fetchUserId();
    await fetchAllMateri();
});

</script>

<template>
    <DataView :value="allMateri">
        <template #list="slotProps">
            <div class="flex flex-col">
                <div v-for="materi in slotProps.items" :key="materi.id">
                    <div class="border-b border-surface-200 dark:border-surface-700">
                        <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4">
                            <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                                <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                                    <div>
                                        <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{
                                            formatDate(materi.created_at) }}
                                        </span>
                                        <div class="text-lg font-medium mt-2">{{ materi.judul_penugasan }}
                                        </div>
                                    </div>
                                </div>
                                <div class="flex flex-col md:items-end gap-8">
                                    <div class="flex flex-row-reverse md:flex-row gap-2">
                                        <Button icon="pi pi-trash" variant="outlined" severity="danger"
                                            @click="deleteAssignment(materi.id)"></Button>
                                        <!-- <div v-if="allSoal.find(s => s.bank_soal_id === materi.id)"> -->
                                        <RouterLink :to="{ name: 'edit-assignment', params: { id: materi.id } }">
                                            <Button icon="pi pi-pencil" label="Edit Material"
                                                class="flex-auto md:flex-initial whitespace-nowrap"></Button>
                                        </RouterLink>
                                        <!-- </div> -->
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