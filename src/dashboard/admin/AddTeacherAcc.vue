<script setup>
import { ref, computed } from 'vue';
import { useToast } from 'primevue';
import api from '../../services/api';
import { isDataScheme } from 'pdfjs-dist';

const toast = useToast()
const username = ref("")
const email = ref("")
const password = ref("")
const confirmPassword = ref("")

const isDisabled = computed(() => {
    return !username.value || !email.value || !password.value || !confirmPassword.value;
});

const addAccTeacher = async () => {
    try {
        const res = await api.post("/auth/register-teacher", {
            username: username.value,
            email: email.value,
            password: password.value,
            confirmPassword: confirmPassword.value
        });
        toast.add({
            severity: "success",
            detail: "Success",
            detail: res.data.message,
            life: 3000
        })

        username.value = "";
        email.value = "";
        password.value = "";
        confirmPassword.value = "";
    } catch (error) {
        console.error("Error add teacher account :", error)
    }
}
</script>

<template>
    <Card>
        <template #header>
            <h1 class="m-5">Add Teacher Account</h1>
        </template>

        <template #content>
            <form class="space-y-3" @submit.prevent="addAccTeacher">
                <IftaLabel>
                    <InputText id="username" v-model="username" variant="filled" class="w-full" />
                    <label for="username">Username</label>
                </IftaLabel>

                <IftaLabel>
                    <InputText id="email" v-model="email" variant="filled" class="w-full" />
                    <label for="email">Email</label>
                </IftaLabel>

                <IftaLabel>
                    <Password toggleMask class="w-full" variant="filled" input-class="w-full" v-model="password" />
                    <label for="password">Password</label>
                </IftaLabel>

                <IftaLabel>
                    <Password toggleMask class="w-full" variant="filled" input-class="w-full"
                        v-model="confirmPassword" />
                    <label for="confirmPassword">Confirm Password</label>
                </IftaLabel>

                <div class="flex justify-end mt-5">
                    <Button label="Add" icon="pi pi-plus" type="submit" :disabled="isDisabled" />
                </div>
            </form>
        </template>
    </Card>
</template>