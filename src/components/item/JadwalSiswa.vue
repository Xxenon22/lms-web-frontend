<script setup>
import api from '../../services/api'
import { ref, onMounted } from 'vue'

const file = ref(null)
const API_URL = import.meta.env.VITE_API_URL

const fetchFiles = async () => {
    try {
        const res = await api.get("/timetables-grade-x")
        if (res.data.length > 0) {
            file.value = res.data[0]
        }
    } catch (error) {
        console.error("Error Fetch Files timetables grade x:", error)
    }
}

onMounted(fetchFiles)
</script>

<template>
    <div>
        <div v-if="file" class="mt-6">
            <iframe :src="`${API_URL}api/timetables-grade-x/${file.id}/file`" width="100%"
                allow="fullscreen; autoplay; encrypted-media" allowfullscreen height="600px"
                style="border:none;"></iframe>
        </div>
    </div>
</template>
