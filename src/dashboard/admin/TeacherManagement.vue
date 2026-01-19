<script setup>
import api from '../../services/api';
import { ref, onMounted } from 'vue';

const profileGuru = ref([])
const guru = ref([])
const API_URL = import.meta.env.VITE_API_URL

const fetchDataGuru = async () => {
    try {
        const res = await api.get("/auth/teacher")
        profileGuru.value = (res.data.profiles || []).map(data => ({
            ...data,
            photo_profile: data.photo_url
                ? `${API_URL}${data.photo_url}?v=${Date.now()}`
                : null
        }));
        // console.log(profileGuru.value);
        guru.value = profileGuru.value;
    } catch (error) {
        console.error("Error Fetch profile :", error)
    }
}

onMounted(async () => {
    await fetchDataGuru()
})
</script>


<template>
    <div class="header">
        <h1 class="font-bold m-5 text-2xl">Teacher Management</h1>
    </div>
    <div class="m-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 space-x-10 gap-6">
        <div class="" v-for="dataGuru in guru" :key="dataGuru.id">
            <Card style="width: 25rem; overflow: hidden; height: 15rem;">
                <template #title>
                    <div class="flex items-center justify-between">
                        <h1>{{ dataGuru.username }}</h1>
                        <Avatar class="mr-2 object-cover items-center" size="xlarge" v-if="dataGuru.photo_profile"
                            :image="(dataGuru.photo_profile)" style="background-color: #ece9fc; color: #2a1261"
                            shape="circle" />
                        <Avatar icon="pi pi-user" class="mr-2" size="xlarge" v-else
                            style="background-color: #ece9fc; color: #2a1261" shape="circle" />

                    </div>
                </template>
                <template #subtitle>{{ dataGuru.phone_number }}</template>
                <template #content>
                    <p class="m-0">
                        {{ dataGuru.teacher_subject || 'No Subject Assigned' }}
                    </p>
                </template>
                <template #footer>
                    <div class="flex gap-4 mt-1">
                        <router-link :to="{ name: 'Teacher-Class', params: { kelasId: dataGuru.id } }" class="w-full">
                            <Button label="See Class" severity="secondary" variant="outlined" class="w-full" />
                        </router-link>
                        <router-link :to="{ name: 'Teacher-Material', params: { id: dataGuru.id } }" class="w-full">
                            <Button label="See Material" class="w-full" />
                        </router-link>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>