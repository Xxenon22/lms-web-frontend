<script setup>
import { onMounted, ref } from "vue";
import { useToast } from "primevue/usetoast";
import api from "../../services/api";

const mapel = ref("");
const guru = ref("");
const gradeLvl = ref([]);
const major = ref([]);
const rombelNum = ref([]);
const selectedGrade = ref(null);
const selectMajor = ref(null);
const selectRombel = ref(null);

const toast = useToast();

// Fetch Grade Levels
const fetchGradeLevel = async () => {
    try {
        const res = await api.get("/grade-level");
        gradeLvl.value = res.data;
    } catch (err) {
        console.error("Fetch Grade Level:", err);
    }
};

// Fetch Major
const fetchMajor = async () => {
    try {
        const res = await api.get("/jurusan");
        major.value = res.data;
    } catch (err) {
        console.error("Fetch Major:", err);
    }
};

// Fetch NumRombel
const fetchRombelNum = async () => {
    try {
        const res = await api.get("/number-rombel");
        rombelNum.value = res.data;
    } catch (err) {
        console.error("Fetch Rombel Number:", err);
    }
};

// Add new Rombel (Class)
const submitNewRombel = async () => {
    if (!selectMajor.value || !selectedGrade.value) {
        toast.add({
            severity: "warn",
            summary: "Warning!",
            detail: "Please fill all fields before submitting",
            life: 3000,
        });
        return;
    }
    try {
        await api.post("/rombel", {
            name_rombel: selectRombel.value,
            grade_id: selectedGrade.value,
            jurusan_id: selectMajor.value,
        });
        toast.add({
            severity: "success",
            summary: "Success",
            detail: "Study Group has been Saved",
            life: 3000,
        });
        selectedGrade.value = "";
        selectMajor.value = "";
        selectRombel.value = "";
    } catch (err) {
        toast.add({
            severity: "error",
            summary: "Failed!",
            detail: "Failed to add New Study Group",
            life: 3000,
        });
    }
};

// Add new Subject
const submitNewMapel = async () => {
    if (!mapel.value) {
        toast.add({
            severity: "warn",
            summary: "Warning!",
            detail: "Please input subject name before submitting",
            life: 3000,
        });
        return;
    }
    try {
        await api.post("/mapel", { nama_mapel: mapel.value });
        toast.add({
            severity: "success",
            summary: "Success",
            detail: "New Subject has been saved",
            life: 3000,
        });
        mapel.value = "";
    } catch (err) {
        toast.add({
            severity: "error",
            summary: "Failed!",
            detail: "Failed to add new Subject!",
            life: 3000,
        });
    }
};

// Add new Teacher
const submitNewTeacher = async () => {
    if (!guru.value) {
        toast.add({
            severity: "error",
            summary: "Complete the field",
            detail: "There is no data to submit",
        });
        return;
    }
    try {
        await api.post("/teacher", { name: guru.value });
        toast.add({
            severity: "success",
            summary: "Success",
            detail: "New Teacher has been saved",
            life: 3000,
        });
        guru.value = "";
    } catch (err) {
        console.error("Submit new teacher:", err);
    }
};

onMounted(() => {
    fetchGradeLevel();
    fetchMajor();
    fetchRombelNum();
});
</script>

<template>
    <div class="m-5">
        <h1 class="font-2xl font-bold">Admin Management</h1>
    </div>
    <div class="flex flex-col space-y-3 m-5">
        <Card>
            <template #header>
                <div class="m-5">
                    <h1>Create New Class</h1>
                </div>
            </template>

            <template #content>
                <div class="flex space-x-3 w-full overflow-hidden">
                    <div class="w-3/5">
                        <Select v-model="selectedGrade" :options="gradeLvl" option-value="id" option-label="grade_lvl"
                            placeholder="Select a Grade" class="w-full" />
                    </div>
                    <div class="w-3/5">
                        <Select v-model="selectMajor" :options="major" option-value="id" option-label="nama_jurusan"
                            placeholder="Select a Major" class="w-full"></Select>
                    </div>

                    <div class="w-3/5">
                        <Select v-model="selectRombel" :options="rombelNum" option-value="id" option-label="number"
                            placeholder="Select a Class" class="w-full"></Select>
                    </div>

                </div>
            </template>

            <template #footer>
                <div class="m-5 flex justify-end">
                    <Button label="Submit" @click="submitNewRombel" />
                </div>
            </template>
        </Card>

        <Card>
            <template #header>
                <div class="m-5">
                    <h1> Create New Subject</h1>
                </div>
            </template>
            <template #content>
                <div class="m-5">
                    <FloatLabel variant="in">
                        <InputText type="text" class="w-full" v-model="mapel" />
                        <label for="">New Subject</label>
                    </FloatLabel>
                </div>
            </template>
            <template #footer>
                <div class="m-5 flex justify-end">
                    <Button label="Submit" @click="submitNewMapel" />
                </div>
            </template>
        </Card>

        <Card>
            <template #header>
                <h1 class="m-5">New Teacher</h1>
            </template>
            <template #content>
                <div class="m-5">
                    <FloatLabel variant="in">
                        <InputText type="text" class="w-full" v-model="guru" />
                        <label for="">Add new Teacher</label>
                    </FloatLabel>
                </div>
            </template>
            <template #footer>
                <div class="m-5 flex justify-end">
                    <Button label="Submit" @click="submitNewTeacher" />
                </div>
            </template>
        </Card>
    </div>
    <Toast />
</template>