<script setup>
import api from '../../../services/api';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter()
const route = useRoute()
const id = route.params.id
const rpkData = ref([])
const isLoading = ref(true)
const suggestions = ref([])
const searchText = ref('')

const fetchRpkData = async () => {
    try {
        const res = await api.get(`/rpk/all-rpk/${id}`)
        rpkData.value = res.data.map(k => ({
            id: k.id,
            hari_tanggal: k.hari_tanggal,
            kelas: `${k.name_grade || '-'} ${k.name_rombel || ''}`,
            name: `${k.name_grade || '-'} ${k.name_rombel || ''} - ${k.hari_tanggal}`
        }))
    } catch (error) {
        console.error("Error rpk Data :", error)
    }

}


const searchClp = (event) => {
    const query = event.query?.toLowerCase() || ''
    if (!query) {
        suggestions.value = rpkData.value
    } else {
        const result = rpkData.value.filter(rpk =>
            rpk.name.toLowerCase().includes(query)
        )
        suggestions.value = result
    }
}

const onSelectClass = (e) => {
    rpkData.value = [e.value]
}

const onClear = () => {
    suggestions.value = rpkData.value
}

const back = () => {
    router.back()
}

onMounted(async () => {
    await fetchRpkData()
    isLoading.value = false;
})

</script>

<template>
    <div class="flex justify-between">
        <Button label="Back" icon="pi pi-arrow-left" @click="back" />
        <AutoComplete v-model="searchText" optionLabel="name" :suggestions="suggestions" @complete="searchClp"
            @item-select="onSelectClass" @clear="onClear" placeholder="Search CLP..." />
    </div>

    <div v-if="isLoading" class="flex justify-center py-10">
        <ProgressSpinner />
    </div>

    <div v-else-if="rpkData.length === 0" class="text-center text-gray-400 mb-8">
        No CLP has been created at this time.
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 m-5">
        <Card v-for="rpk in rpkData" :key="rpk.id" class="w-80">
            <template #header>
                <div class="flex items-center m-5">
                    <Icon icon="material-symbols:assignment" width="24" height="24" class="mr-2" />
                    <span>{{ rpk.kelas }}</span>
                </div>
                <div class="m-5">
                    <p>{{ rpk.hari_tanggal }}</p>
                </div>
            </template>
            <template #content>
                <div class="flex justify-center items-center ">
                    <RouterLink class="w-full" :to="{ name: 'CLP-View', params: { id: rpk.id } }">
                        <Button label="View CLP" class="w-full" />
                    </RouterLink>
                </div>
            </template>
        </Card>
    </div>
</template>