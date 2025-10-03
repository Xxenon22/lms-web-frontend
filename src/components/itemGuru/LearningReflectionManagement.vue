<script setup>
import { onMounted, ref } from 'vue';
import api from '../../services/api';
import { useToast } from 'primevue';

const toast = useToast()
const allLr = ref([])
const userId = ref(null)

const fetchUserId = async () => {
    try {
        const res = await api.get("/auth/profile")
        userId.value = res.data.id
    } catch (error) {
        console.error("error fetch user ID:", error)
    }
};

const fetchLr = async () => {
    try {
        const res = await api.get("/rpk-refleksi")
        allLr.value = res.data
    } catch (error) {
        console.error("Error Fetch Lr :", error)
    }
}

const deleteLr = async (id) => {
    try {
        const res = await api.delete(`/rpk-refleksi/${id}`)
        await fetchLr()
        toast.add({ severity: 'success', summary: 'Success', detail: 'Data successfully deleted', life: 3000 })
    } catch (error) {
        console.error("Failed to delete data :", error)
    }
}

onMounted(async () => {
    await fetchUserId()
    await fetchLr()
})
</script>

<template>
    <DataView :value="allLr">
        <template #list="slotProps">
            <div class="flex flex-col">
                <div v-for="lr in slotProps.items" :key="lr.id">
                    <div class="border-b border-surface-200 dark:border-surface-700">
                        <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4">
                            <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6">
                                <div class="flex flex-row md:flex-col justify-between items-start gap-2">
                                    <div>
                                        <span class="font-medium text-surface-500 dark:text-surface-400 text-sm">{{
                                            lr.hari_tanggal }}</span>
                                        <div class="text-lg font-medium mt-2"><span>{{ lr.name_grade
                                        }} {{
                                                    lr.name_rombel }}</span></div>
                                    </div>
                                </div>
                                <div class="flex flex-col md:items-end gap-8">
                                    <div class="flex flex-row-reverse md:flex-row gap-2">
                                        <RouterLink :to="{ name: 'CLP-Reflection', params: { id: lr.id } }">
                                            <Button icon="pi pi-eye" outlined />
                                        </RouterLink>
                                        <Button icon="pi pi-trash" variant="outlined" severity="danger"
                                            @click="deleteLr(lr.id)"></Button>
                                        <RouterLink :to="{ name: 'Edit-Learning-Reflection', params: { id: lr.id } }">
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