<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const profileGuru = ref([])
const filteredGuru = ref([])
const suggestions = ref([])
const searchText = ref('')
// fetch profiles
const fetchProfiles = async () => {
    try {
        const res = await api.get("/auth/teacher")
        profileGuru.value = (res.data.profiles || []).map(data => ({
            ...data,
            photo_profiles_user: data.photo_profiles_user
                ? `${import.meta.env.VITE_API_URL}${data.photo_profiles_user}`
                : null
        }));
        filteredGuru.value = profileGuru.value;
    } catch (error) {
        console.error("Error Fetching Profile :", error)
    }

}


// AutoComplete search
const searchGuru = (event) => {
    const query = event.query?.toLowerCase() || ''
    if (!query) {
        suggestions.value = profileGuru.value
        filteredGuru.value = profileGuru.value
    } else {
        const result = profileGuru.value.filter(guru =>
            guru.username.toLowerCase().includes(query) ||
            (guru.teacher_subject && guru.teacher_subject.toLowerCase().includes(query))
        )
        suggestions.value = result
        filteredGuru.value = result
    }
}

const onSelectGuru = (e) => {
    filteredGuru.value = [e.value]
}

const onClear = () => {
    filteredGuru.value = profileGuru.value
}

onMounted(async () => {
    await fetchProfiles()
})
</script>


<template>
    <div class="flex justify-between m-3">
        <h1 class="font-bold">Learning Reflection</h1>
        <InputText v-model="searchText" @complete="searchGuru" @clear="onClear" placeholder="Search teacher..." />
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-12">
        <div v-for="profile in filteredGuru" :key="profile.id">
            <RouterLink :to="{ name: 'Learning-Reflection', params: { id: profile.id } }">
                <Button class="w-64 h-32">
                    <div class="flex flex-col space-y-2">
                        <div class="flex justify-center">
                            <Avatar :image="profile.photo_profiles_user" size="large" shape="circle"
                                style="background-color: #ece9fc; color: #2a1261">
                                <i v-if="!profile.photo_profiles_user" class="pi pi-user"></i>
                            </Avatar>
                        </div>
                        <div class="flex flex-col">
                            <h1><b>{{ profile.username }}</b></h1>
                            <div>{{ profile.teacher_subject }}</div>
                        </div>
                    </div>
                </Button>
            </RouterLink>
        </div>
    </div>
</template>
