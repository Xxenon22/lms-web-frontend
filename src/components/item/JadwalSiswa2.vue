<script setup>
import api from '../../services/api'
import { ref, onMounted } from 'vue'

const file = ref(null)

const fetchFiles = async () => {
    try {
        const res = await api.get("/timetables-grade-xi")
        if (res.data.length > 0) {
            file.value = res.data[0]
        }
    } catch (error) {
        console.error("Error Fetch Files timetables grade xi:", error)
    }
}

onMounted(fetchFiles)
</script>

<template>
    <div>
        <div v-if="file" class="mt-6">
            <iframe :src="`https://metschoo-ils.my.id//uploads/timetables-grade-xi/${file.file_name}`" width="100%"
                allow="fullscreen; autoplay; encrypted-media" allowfullscreen height="600px"
                style="border:none;"></iframe>
        </div>
    </div>
</template>
