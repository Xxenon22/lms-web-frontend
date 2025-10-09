<script setup>
import { onMounted, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import api from "../../services/api"; // axios instance yg udah ada

const src = ref(null);
const imageFile = ref(null);
const error = ref(null);
const toast = useToast();

const nama = ref("");
const subject = ref("");
const noTelp = ref("");
const photoProfile = ref(null);

const initialData = ref({});
const isSubmitting = ref(false);
const hasChanges = ref(false);

// Fetch user profile
const fetchProfile = async () => {
    try {
        const res = await api.get("/auth/profile");
        const data = res.data;

        nama.value = data.username;
        subject.value = data.teacher_subject;
        noTelp.value = data.phone_number;
        photoProfile.value = data.photo_profiles_user;
        src.value = data.photo_profiles_user
            ? `${import.meta.env.VITE_API_URL}${data.photo_profiles_user}`
            : null;
        initialData.value = {
            username: data.username,
            teacher_subject: data.teacher_subject,
            phone_number: data.phone_number,
            photo: data.photo_profiles_user,
        };
    } catch (err) {
        console.error("fetchProfile error:", err);
    }
};

// Detect perubahan
watch([nama, subject, noTelp, imageFile], () => {
    hasChanges.value =
        nama.value !== initialData.value.username ||
        subject.value !== initialData.value.teacher_subject ||
        noTelp.value !== initialData.value.phone_number ||
        imageFile.value !== null;
});

// Handle file select (sama kaya punyamu)
function onFileSelect(event) {
    const file = event.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        error.value = 'Only JPG, JPEG, or PNG files are allowed.';
        src.value = null;
        return;
    }

    imageFile.value = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        src.value = e.target.result;
        error.value = null;
    };
    reader.readAsDataURL(file);
}

// TODO: ganti ini dengan upload ke server kamu (Express multer)
const uploadPhoto = async () => {
    if (!imageFile.value) return photoProfile.value;

    const formData = new FormData();
    formData.append("profile", imageFile.value);

    const res = await api.post("/uploads/photo-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });

    return res.data.imageUrl;
};

// Submit profile
const submitProfile = async () => {
    if (!hasChanges.value) return;

    isSubmitting.value = true;
    const photoUrl = await uploadPhoto();

    const updateData = {
        username: nama.value,
        teacher_subject: subject.value,
        phone_number: noTelp.value,
        photo_profiles_user: photoUrl,
    };

    await api.put("/auth/profile", updateData);

    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Profile updated successfully',
        life: 3000
    });

    imageFile.value = null;
    hasChanges.value = false;
    isSubmitting.value = false;
    await fetchProfile();
};

onMounted(fetchProfile);
</script>

<template>
    <Card>
        <template #header>
            <div class="m-5">
                <h1 class="text-xl font-bold">Settings</h1>
            </div>
        </template>

        <template #content>
            <div class="flex flex-col space-y-5">
                <div class="flex flex-col items-center">
                    <h2 class="mb-4 text-lg font-semibold">Photo Profile</h2>

                    <div class="shadow-xl rounded-full w-40 h-40 object-cover mb-4 flex justify-center items-center">
                        <img v-if="src" :src="src" alt="Photo Profile" class="rounded-full w-40 h-40 object-cover" />
                        <i v-else class="pi pi-user text-gray-500" style="font-size: 5rem;"></i>
                    </div>

                    <FileUpload mode="basic" @select="onFileSelect" customUpload auto accept="image/*"
                        chooseLabel="Choose Profile Photo" class="p-button-outlined" />

                    <p v-if="error" class="text-red-500 mt-2 text-sm">{{ error }}</p>
                </div>

                <div class="space-y-5">
                    <div>
                        <h2 class="mb-2 font-semibold">Name</h2>
                        <InputText v-model="nama" class="w-full" placeholder="Enter your name" />
                    </div>

                    <div>
                        <h2 class="mb-2 font-semibold">Teacher's Subject</h2>
                        <InputText v-model="subject" class="w-full" placeholder="Enter your name" />
                    </div>

                    <div>
                        <h2 class="mb-2 font-semibold">Phone Number</h2>
                        <InputNumber v-model="noTelp" :useGrouping="false" placeholder="Enter phone number"
                            class="w-full" />
                    </div>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-end mt-5">
                <Button label="Submit" @click="submitProfile" :disabled="!hasChanges || isSubmitting"
                    :loading="isSubmitting" />
            </div>
        </template>
    </Card>

    <Toast />
</template>
