<script setup>
import { onMounted, ref, watch } from 'vue';
import api from '../../services/api';
import { useToast } from 'primevue/usetoast';

const src = ref(null);
const imageFile = ref(null);
const error = ref(null);
const toast = useToast();

const nama = ref("");
const kelasId = ref(null);
const jurusanId = ref(null);
const rombelId = ref(null);
const noTelp = ref("");
const photoProfile = ref(null);
const userId = ref(null);

const selectedGrade = ref([]);
const selectedMajor = ref([]);
const selectedStudyGroup = ref([]);

const isSubmitting = ref(false);
const hasChanges = ref(false);
const initialData = ref({});

// Dropdown Fetch
const fetchJurusan = async () => {
    try {
        const res = await api.get("/jurusan");

        selectedMajor.value = Array.isArray(res.data)
            ? res.data.map(b => ({ id: b.id, name: b.nama_jurusan }))
            : res.data && typeof res.data === "object"
                ? [{ id: res.data.id, name: res.data.nama_jurusan }]
                : [];
    } catch (err) {
        console.error("Error fetching jurusan:", err);
        selectedMajor.value = [];
    }
};

const fetchKelas = async () => {
    try {
        const res = await api.get("/grade-level");
        if (Array.isArray(res.data)) {
            selectedGrade.value = res.data.map(b => ({ id: b.id, name: b.grade_lvl }));
        } else {
            console.warn("Response grade-level bukan array:", res.data);
        }
    } catch (err) {
        console.error("Error fetching grade-level:", err);
    }
};

const fetchRombel = async () => {
    try {
        const res = await api.get("/rombel");
        if (Array.isArray(res.data)) {
            selectedStudyGroup.value = res.data.map(b => ({
                id: b.id,
                name: `${b.grade_lvl || ''} ${b.name_rombel}`,
                grade_id: b.grade_id,
                grade_lvl: b.grade_lvl || ''
            }));
        } else {
            console.warn("Response rombel bukan array:", res.data);
        }
    } catch (err) {
        console.error("Error fetching rombel:", err);
    }
};

const fetchProfile = async () => {
    try {

        const res = await api.get("/auth/profile");
        const data = res.data;

        nama.value = data.username;
        noTelp.value = data.phone_number;
        photoProfile.value = data.photo_profiles_user;
        src.value = data.photo_profiles_user
            ? `${import.meta.env.VITE_API_URL}${data.photo_profiles_user}` : null;
        kelasId.value = data.grade_id;
        jurusanId.value = data.jurusan_id;
        rombelId.value = data.rombel_id;

        // Simpan state awal
        initialData.value = {
            username: data.username,
            phone_number: data.phone_number,
            grade_id: data.grade_id,
            jurusan_id: data.jurusan_id,
            rombel_id: data.rombel_id,
            photo: data.photo_profiles_user,
        };


    } catch (error) {
        console.error("Error Fetching Student Profile :", error)
    }
};

// Deteksi perubahan
watch([nama, noTelp, kelasId, jurusanId, rombelId, imageFile], () => {
    hasChanges.value = (
        nama.value !== initialData.value.username ||
        noTelp.value !== initialData.value.phone_number ||
        kelasId.value !== initialData.value.grade_id ||
        jurusanId.value !== initialData.value.jurusan_id ||
        rombelId.value !== initialData.value.rombel_id ||
        imageFile.value !== null
    );
});

// File upload
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

// Upload photo ke Supabase Storage
const uploadPhoto = async () => {
    if (!imageFile.value) return photoProfile.value; // tidak upload baru

    const formData = new FormData();
    formData.append("profile", imageFile.value);
    if (photoProfile.value) {
        // kirim path lama supaya bisa dihapus backend
        formData.append("oldImagePath", photoProfile.value);
    }

    const res = await api.put("/uploads/photo-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data.imageUrl;
};

// Simpan profile
const submitProfileStudent = async () => {
    if (!hasChanges.value) return;

    isSubmitting.value = true;
    const photoUrl = await uploadPhoto();

    const updateData = {
        username: nama.value,
        phone_number: noTelp.value,
        photo_profiles_user: photoUrl,
        grade_id: kelasId.value,
        jurusan_id: jurusanId.value,
        rombel_id: rombelId.value,
    };

    await api.put("/auth/profile", updateData);

    toast.add({
        severity: "success",
        summary: "Success",
        detail: "Profile updated successfully",
        life: 3000,
    });

    imageFile.value = null;
    hasChanges.value = false;
    isSubmitting.value = false;
    await fetchProfile();
};


onMounted(async () => {
    await fetchKelas();
    await fetchJurusan();
    await fetchRombel();
    await fetchProfile();
});
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
                        <h2 class="mb-2 font-semibold">Grade</h2>
                        <Select v-model="kelasId" :options="selectedGrade" option-label="name" option-value="id"
                            class="w-full" placeholder="Select Grade" />
                    </div>

                    <div>
                        <h2 class="mb-2 font-semibold">Major</h2>
                        <Select v-model="jurusanId" :options="selectedMajor" option-label="name" option-value="id"
                            class="w-full" placeholder="Select Major" />
                    </div>

                    <div>
                        <h2 class="mb-2 font-semibold">Class</h2>
                        <Select v-model="rombelId" :options="selectedStudyGroup" option-label="name" option-value="id"
                            class="w-full" placeholder="Select Study Group" />
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
                <Button label="Submit" @click="submitProfileStudent" :loading="isSubmitting"
                    :disabled="!hasChanges || isSubmitting" />
            </div>
        </template>
    </Card>

    <Toast />
</template>
