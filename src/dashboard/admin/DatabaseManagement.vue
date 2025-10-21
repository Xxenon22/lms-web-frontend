<script setup>
import { onMounted, ref } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import api from '../../services/api';

const visibleClass = ref(false);
const visibleSubject = ref(false);
const visibleTeacher = ref(false)
const kelas = ref([])
const subject = ref([])
const guru = ref([])
const confirm = useConfirm();
const toast = useToast();
const gradeLvl = ref([])

const editClassData = ref({
    id: null,
    name_rombel: '',
    grade_id: null,
})
const editSubjectData = ref({
    id: null,
    nama_mapel: '',
})
const editTeacherData = ref({
    id: null,
    name: '',
})

const fetchDataGradeLevel = async () => {
    try {
        const res = await api.get("/grade-level")
        gradeLvl.value = res.data
    } catch (err) {
        console.error("Fetch Grade Level:", err)
    }
}

const fetchDataKelas = async () => {
    try {
        const res = await api.get("/rombel")
        kelas.value = res.data;
    } catch (err) {
        console.error("Fetch Class:", err)
    }
}

const fetchDataSubject = async () => {
    try {
        const res = await api.get("/mapel")
        subject.value = res.data;
    } catch (err) {
        console.error("Fetch Subject:", err)
    }
}

const fetchDataTeacher = async (order = "asc") => {
    try {
        const res = await api.get("/teacher")
        guru.value = res.data.sort((a, b) => {
            if (order === "asc") {
                return a.name.localeCompare(b.name) // A-Z
            } else {
                return b.name.localeCompare(a.name) // Z-A
            }
        })
    } catch (err) {
        console.error("Fetch Teacher:", err)
    }
};

const deleteKelas = (id) => {
    confirm.require({
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        message: "Deleting this class will also remove related enrollments. This action is permanent. Continue?",
        acceptClass: 'p-button-danger',
        acceptLabel: 'Yes, delete',
        rejectLabel: 'Cancel',
        accept: async () => {
            try {
                await api.delete(`/rombel/${id}`)
                toast.add({ severity: 'success', summary: 'Deleted', detail: 'Class deleted successfully', life: 3000 })
                fetchDataKelas()
            } catch (err) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete class', life: 3000 })
            }
        }
    })
}

const deleteSubject = (id) => {
    confirm.require({
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        message: 'Deleting this subject will also remove related data. Continue?',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Yes, delete',
        rejectLabel: 'Cancel',
        accept: async () => {
            try {
                await api.delete(`/mapel/${id}`)
                toast.add({ severity: 'success', summary: 'Deleted', detail: 'Subject deleted successfully', life: 3000 })
                fetchDataSubject()
            } catch (err) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete subject', life: 3000 })
            }
        }
    })
}

const deleteTeacher = (id) => {
    confirm.require({
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        message: 'Deleting this teacher will also remove related data. Continue?',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Yes, delete',
        rejectLabel: 'Cancel',
        accept: async () => {
            try {
                await api.delete(`/teacher/${id}`)
                toast.add({ severity: 'success', summary: 'Deleted', detail: 'Teacher deleted successfully', life: 3000 })
                fetchDataTeacher()
            } catch (err) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete teacher', life: 3000 })
            }
        }
    })
}

const openEditDialog = (row) => {
    editClassData.value = {
        id: row.id,
        name_rombel: row.name_rombel,
        grade_id: row.grade_id,
    }
    visibleClass.value = true
}

const openEditDialogSubject = (row) => {
    editSubjectData.value = {
        id: row.id,
        nama_mapel: row.nama_mapel,
    }
    visibleSubject.value = true
}

const openEditDialogTeacher = (row) => {
    editTeacherData.value = {
        id: row.id,
        name: row.name,
    }
    visibleTeacher.value = true
}

const updateClass = async () => {
    try {
        await api.put(`/rombel/${editClassData.value.id}`, {
            name_rombel: editClassData.value.name_rombel,
            grade_id: editClassData.value.grade_id,
        })
        toast.add({ severity: 'success', summary: 'Updated', detail: 'Class updated successfully', life: 3000 })
        visibleClass.value = false
        fetchDataKelas()
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update class', life: 3000 })
    }
}

const updateSubject = async () => {
    try {
        await api.put(`/mapel/${editSubjectData.value.id}`, {
            nama_mapel: editSubjectData.value.nama_mapel
        })
        toast.add({ severity: 'success', summary: 'Updated', detail: 'Subject updated successfully', life: 3000 })
        visibleSubject.value = false
        fetchDataSubject()
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update subject', life: 3000 })
    }
}

const updateTeacher = async () => {
    try {
        await api.put(`/teacher/${editTeacherData.value.id}`, {
            name: editTeacherData.value.name
        })
        toast.add({ severity: 'success', summary: 'Updated', detail: 'Teacher updated successfully', life: 3000 })
        visibleTeacher.value = false
        fetchDataTeacher()
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update teacher', life: 3000 })
    }
}

onMounted(async () => {
    await fetchDataGradeLevel()
    await fetchDataKelas()
    await fetchDataSubject()
    await fetchDataTeacher("asc")
})
</script>

<template>
    <div class="space-y-5">

        <!-- Class Management -->
        <div class="w-full">
            <Card>
                <template #header>
                    <h1 class="m-5">Class Management</h1>
                </template>
                <template #content>
                    <DataTable :value="kelas" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20, 50]"
                        tableStyle="min-width: 50rem">
                        <Column field="grade_name" header="Grade Level" style="width: 25%" />
                        <Column field="name_rombel" header="Class" style="width: 50%" />

                        <!-- Action Buttons -->
                        <Column header="Action" style="width: 25%">
                            <template #body="slotProps">
                                <div class="flex space-x-2">
                                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-info"
                                        @click="openEditDialog(slotProps.data)" />

                                    <Dialog v-model:visible="visibleClass" modal header="Edit Class"
                                        :style="{ width: '25rem' }">
                                        <span class="text-surface-500 dark:text-surface-400 block mb-8">Update the
                                            Class.</span>
                                        <div class="flex items-center gap-4 mb-4">
                                            <label for="gradeLevel" class="font-semibold w-24">Grade Level</label>
                                            <Select v-model="editClassData.grade_id" :options="gradeLvl"
                                                option-value="id" option-label="grade_lvl" placeholder="Select a Grade"
                                                class="w-full md:w-56" />
                                        </div>
                                        <div class="flex items-center gap-4 mb-4">
                                            <label for="username" class="font-semibold w-24">Class</label>
                                            <InputText v-model="editClassData.name_rombel" id="username"
                                                class="flex-auto" autocomplete="off" />
                                        </div>
                                        <div class="flex justify-end gap-2">
                                            <Button type="button" label="Cancel" severity="secondary"
                                                @click="visibleClass = false"></Button>
                                            <Button type="button" label="Save" @click="updateClass"></Button>
                                        </div>
                                    </Dialog>
                                    <Button icon="pi pi-trash" class="p-button-rounded p-button-danger"
                                        @click="deleteKelas(slotProps.data.id)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>

        <!-- Subject Management -->
        <div class="w-full">
            <Card>
                <template #header>
                    <h1 class="m-5">Subject Management</h1>
                </template>
                <template #content>
                    <DataTable :value="subject" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20, 50]"
                        tableStyle="min-width: 50rem">
                        <Column field="nama_mapel" header="Subject" style="width: 75%" />

                        <!-- Action Buttons -->
                        <Column header="Action" style="width: 25%">
                            <template #body="slotProps">
                                <div class="flex space-x-2">
                                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-info"
                                        @click="openEditDialogSubject(slotProps.data)" />
                                    <Dialog v-model:visible="visibleSubject" modal header="Edit Profile"
                                        :style="{ width: '25rem' }">
                                        <span class="text-surface-500 dark:text-surface-400 block mb-8">Update the
                                            Subject.</span>
                                        <div class="flex items-center gap-4 mb-4">
                                            <label for="subject" class="font-semibold w-24">Subject</label>
                                            <InputText v-model="editSubjectData.nama_mapel" id="subject"
                                                class="flex-auto" autocomplete="off" />
                                        </div>
                                        <div class="flex justify-end gap-2">
                                            <Button type="button" label="Cancel" severity="secondary"
                                                @click="visibleSubject = false"></Button>
                                            <Button type="button" label="Save" @click="updateSubject"></Button>
                                        </div>
                                    </Dialog>
                                    <Button icon="pi pi-trash" class="p-button-rounded p-button-danger"
                                        @click="deleteSubject(slotProps.data.id)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>

        <!-- Teacher Management -->
        <div class="w-full">
            <Card>
                <template #header>
                    <h1 class="m-5">Teachers Management</h1>
                </template>
                <template #content>
                    <DataTable :value="guru" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20, 50]"
                        tableStyle="min-width: 50rem">
                        <Column field="name" header="Teacher's Name" style="width: 75%" />

                        <!-- Action Buttons -->
                        <Column header="Action" style="width: 25%">
                            <template #body="slotProps">
                                <div class="flex space-x-2">
                                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-info"
                                        @click="openEditDialogTeacher(slotProps.data)" />
                                    <Dialog v-model:visible="visibleTeacher" modal header="Edit Profile"
                                        :style="{ width: '25rem' }">
                                        <span class="text-surface-500 dark:text-surface-400 block mb-8">Update the
                                            Data.</span>
                                        <div class="flex items-center gap-4 mb-4">
                                            <label for="subject" class="font-semibold w-24">Teacher's Name</label>
                                            <InputText v-model="editTeacherData.name" id="guru" class="flex-auto"
                                                autocomplete="off" />
                                        </div>
                                        <div class="flex justify-end gap-2">
                                            <Button type="button" label="Cancel" severity="secondary"
                                                @click="visibleTeacher = false"></Button>
                                            <Button type="button" label="Save" @click="updateTeacher"></Button>
                                        </div>
                                    </Dialog>
                                    <Button icon="pi pi-trash" class="p-button-rounded p-button-danger"
                                        @click="deleteTeacher(slotProps.data.id)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>
    </div>
    <ConfirmDialog />
    <Toast />
</template>
