<script setup>
import { onMounted, ref, watch } from "vue";
import { useToast } from "primevue/usetoast";
import api from "../../services/api"; // Axios instance sudah ada

const src = ref(null); // preview image
const imageFile = ref(null); // file upload
const error = ref(null); // error message
const toast = useToast();

const nama = ref("");
const subject = ref("");
const noTelp = ref("");
const photoProfile = ref(null);

const initialData = ref({});
const isSubmitting = ref(false);
const hasChanges = ref(false);

// ==================== FETCH PROFILE ====================
const fetchProfile = async () => {
    try {
        const res = await api.get("/auth/profile");
        const data = res.data;

        nama.value = data.username;
        subject.value = data.teacher_subject;
        noTelp.value = data.phone_number;
        photoProfile.value = data.photo_profiles_user;

        // preview image
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
        toast.add({ severity: "error", summary: "Error", detail: "Failed to fetch profile", life: 3000 });
    }
};

// ==================== WATCH FOR CHANGES ====================
watch([nama, subject, noTelp, imageFile], () => {
    hasChanges.value =
        nama.value !== initialData.value.username ||
        subject.value !== initialData.value.teacher_subject ||
        noTelp.value !== initialData.value.phone_number ||
        imageFile.value !== null;
});

// ==================== HANDLE FILE SELECT ====================
function onFileSelect(event) {
    const file = event.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
        error.value = "Only JPG, JPEG, or PNG files are allowed.";
        src.value = null;
        imageFile.value = null;
        return;
    }

    imageFile.value = file;
    error.value = null;

    const reader = new FileReader();
    reader.onload = (e) => {
        src.value = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ==================== UPLOAD PHOTO ====================
const uploadPhoto = async () => {
    if (!imageFile.value) return photoProfile.value; // jika tidak ada perubahan photo

    try {
        const formData = new FormData();
        formData.append("profile", imageFile.value);

        const res = await api.post("/uploads/photo-profile", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return res.data.imageUrl; // ini path relatif untuk frontend
    } catch (err) {
        console.error("Upload photo error:", err);
        toast.add({ severity: "error", summary: "Error", detail: "Failed to upload photo", life: 3000 });
        return null;
    }
};

// ==================== SUBMIT PROFILE ====================
const submitProfile = async () => {
    if (!hasChanges.value) return;

    isSubmitting.value = true;

    const photoUrl = await uploadPhoto(); // upload image dan dapat URL
    if (!photoUrl && imageFile.value) {
        isSubmitting.value = false;
        return; // gagal upload
    }

    const updateData = {
        username: nama.value,
        teacher_subject: subject.value,
        phone_number: noTelp.value,
        photo_profiles_user: photoUrl,
    };

    try {
        await api.put("/auth/profile", updateData);

        toast.add({
            severity: "success",
            summary: "Success",
            detail: "Profile updated successfully",
            life: 3000,
        });

        imageFile.value = null;
        hasChanges.value = false;
        await fetchProfile(); // refresh data
    } catch (err) {
        console.error("Update profile error:", err);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to update profile",
            life: 3000,
        });
    } finally {
        isSubmitting.value = false;
    }
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
                <!-- Photo Profile -->
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

                <!-- Info Profile -->
                <div class="space-y-5">
                    <div>
                        <h2 class="mb-2 font-semibold">Name</h2>
                        <InputText v-model="nama" class="w-full" placeholder="Enter your name" />
                    </div>

                    <div>
                        <h2 class="mb-2 font-semibold">Teacher's Subject</h2>
                        <InputText v-model="subject" class="w-full" placeholder="Enter your subject" />
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
