<script setup>
import api from '../../services/api'
import { ref, onMounted } from 'vue'

const file = ref(null)

const fetchFiles = async () => {
    try {
        const res = await api.get("/timetables")
        if (res.data.length > 0) {
            file.value = res.data[0]
        }
    } catch (error) {
        console.error("Error Fetch Files timetables Teacher:", error)
    }
}

onMounted(fetchFiles)
</script>

<template>
    <div>
        <div v-if="file" class="mt-6">
            <iframe :src="`https://metschoo-ils.my.id//uploads/timetables/${file.file_name}`" width="100%"
                height="600px" allow="fullscreen; autoplay; encrypted-media" allowfullscreen
                style="border:none;"></iframe>
        </div>
    </div>
</template>
