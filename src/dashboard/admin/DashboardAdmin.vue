<script setup>
import { ref, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm';
import api from '../../services/api'

const toast = useToast()
const isLoading = ref(true)
const confirm = useConfirm();
const visibleTeacher = ref(false)
const visibleStudent = ref(false)

const role = ref([
  { id: 1, name: 'Student' },
  { id: 2, name: 'Teacher' }
])

const selectedRole = ref(null)

const allProfiles = ref([])
const users = ref([])

const jurusanList = ref([])
const gradeLevelList = ref([])
const rombelList = ref([])

const filterName = ref('')
const filterMajor = ref(null)
const filterGrade = ref(null)
const filterRombel = ref(null)
const filterPhone = ref('')
const filterSubject = ref('')

const editTeacherData = ref({
  id: null,
  username: '',
  phone_number: '',
  teacher_subject: '',
})

const editStudentData = ref({
  id: null,
  username: '',
  phone_number: '',
  grade_id: null,
  rombel_id: null,
  jurusan_id: null,
})

const selectedGrade = ref([]);
const selectedMajor = ref([]);
const selectedStudyGroup = ref([]);


const fetchProfiles = async () => {
  try {
    isLoading.value = true

    const [profilesRes, jurusanRes, gradesRes, rombelRes] = await Promise.all([
      api.get("/auth"),
      api.get("/jurusan"),
      api.get("/grade-level"),
      api.get("/rombel")
    ])

    // pastikan data dari server benar-benar array
    const profiles = Array.isArray(profilesRes.data.profiles)
      ? profilesRes.data.profiles
      : profilesRes.data

    const jurusan = Array.isArray(jurusanRes.data)
      ? jurusanRes.data
      : jurusanRes.data.jurusan || []

    const grades = Array.isArray(gradesRes.data)
      ? gradesRes.data
      : gradesRes.data.grades || []

    const rombel = Array.isArray(rombelRes.data)
      ? rombelRes.data
      : rombelRes.data.rombel || []

    // map ke format tabel
    allProfiles.value = profiles.map(p => ({
      id: p.id,
      username: p.username,
      role: p.role,
      phone_number: p.phone_number,
      photo_profiles_user: p.photo_profiles_user
        ? `${import.meta.env.VITE_API_URL}${p.photo_profiles_user}`
        : null,
      teacher_subject: p.teacher_subject,
      jurusan_id: p.jurusan_id,
      grade_id: p.grade_id,
      rombel_id: p.rombel_id,
      nama_jurusan: p.nama_jurusan,
      grade_lvl: p.grade_lvl,
      name_rombel: p.name_rombel
    }))

    jurusanList.value = jurusan.map(j => ({
      id: j.id,
      name: j.nama_jurusan
    }))
    gradeLevelList.value = grades.map(g => ({
      id: g.id,
      name: g.grade_lvl
    }))
    rombelList.value = rombel.map(r => ({
      id: r.id,
      name: r.name_rombel
    }))

    applyFilters()
  } catch (error) {
    console.error("fetchProfiles error", error)
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to fetch users",
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

/**
 * Apply role + all search filters
 */
const applyFilters = () => {
  // base = allProfiles or filtered by role first
  const base = selectedRole.value
    ? allProfiles.value.filter(u =>
      (selectedRole.value.id === 1 && u.role === 'student') ||
      (selectedRole.value.id === 2 && u.role === 'teacher')
    )
    : allProfiles.value

  // string filters
  const fName = (filterName.value || '').toLowerCase()
  const fSubject = (filterSubject.value || '').toLowerCase()
  const fPhone = (String(filterPhone.value || '')).toLowerCase()

  // dropdown filters: kita harapkan id (number) atau null/undefined
  const fMajor = filterMajor.value != null && filterMajor.value !== '' ? Number(filterMajor.value) : null
  const fGrade = filterGrade.value != null && filterGrade.value !== '' ? Number(filterGrade.value) : null
  const fRombel = filterRombel.value != null && filterRombel.value !== '' ? Number(filterRombel.value) : null

  users.value = base.filter(user => {
    const matchesName = (user.username || '').toLowerCase().includes(fName)
    const matchesSubject = (user.teacher_subject || '').toLowerCase().includes(fSubject)
    const matchesPhone = (String(user.phone_number || '')).toLowerCase().includes(fPhone)

    const matchesMajor = fMajor ? Number(user.jurusan_id) === fMajor : true
    const matchesGrade = fGrade ? Number(user.grade_id) === fGrade : true
    const matchesRombel = fRombel ? Number(user.rombel_id) === fRombel : true

    return matchesName && matchesMajor && matchesGrade && matchesRombel && matchesSubject && matchesPhone
  })
}

// watchers: role dan semua filter -> jalankan applyFilters
watch(
  [
    selectedRole,
    filterName,
    filterMajor,
    filterGrade,
    filterRombel,
    filterPhone,
    filterSubject,
    allProfiles
  ],
  () => {
    applyFilters()
  },
  { immediate: true }
)

const deleteAccount = (id) => {
  confirm.require({
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    message: 'Deleting this Account will also remove related data. Continue?',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Yes, delete',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        await api.delete(`/auth/${id}`)
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'User Account deleted successfully', life: 3000 })
        await fetchProfiles()
      } catch (err) {
        console.error("Error Delete data :", err)
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete teacher', life: 3000 })
      }
    }
  })
}

const openEditDialogTeacher = (row) => {
  editTeacherData.value = {
    id: row.id,
    username: row.username,
    phone_number: row.phone_number,
    teacher_subject: row.teacher_subject,
  }
  visibleTeacher.value = true
}

const openEditDialogStudent = (row) => {
  editStudentData.value = {
    id: row.id,
    username: row.username,
    phone_number: row.phone_number,
    rombel_id: row.rombel_id,
    jurusan_id: row.jurusan_id,
    grade_id: row.grade_id,
  }
  visibleStudent.value = true
}

const updateTeacher = async () => {
  try {
    await api.put(`/auth/profile/${editTeacherData.value.id}`, {
      username: editTeacherData.value.username,
      phone_number: editTeacherData.value.phone_number,
      teacher_subject: editTeacherData.value.teacher_subject
    })

    toast.add({ severity: 'success', summary: 'Updated', detail: 'Profile Teacher updated successfully', life: 3000 })
    visibleTeacher.value = false
    fetchProfiles()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile teacher', life: 3000 })
  }
}

const updateStudent = async () => {
  try {
    await api.put(`/auth/profile/${editStudentData.value.id}`, {
      username: editStudentData.value.username,
      phone_number: editStudentData.value.phone_number,
      username: editStudentData.value.username,
      grade_id: editStudentData.value.grade_id,
      jurusan_id: editStudentData.value.jurusan_id,
      rombel_id: editStudentData.value.rombel_id
    })

    toast.add({ severity: 'success', summary: 'Updated', detail: 'Profile Student updated successfully', life: 3000 })
    visibleStudent.value = false
    fetchProfiles()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile Student', life: 3000 })
  }
}

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
        name: b.name_rombel,
      }));
    } else {
      console.warn("Response rombel bukan array:", res.data);
    }
  } catch (err) {
    console.error("Error fetching rombel:", err);
  }
};


onMounted(() => {
  fetchProfiles()
  fetchJurusan()
  fetchKelas()
  fetchRombel()
})
</script>

<template>
  <section class="flex flex-col">
    <div class="flex justify-between">
      <div class="m-5">
        <h1 class="font-bold">All User Profiles</h1>
      </div>
      <div class="flex mb-5">
        <Select v-model="selectedRole" :options="role" optionLabel="name" placeholder="Select the Role" checkmark
          :highlightOnSelect="false" class="w-full md:w-56" />
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-10">
      <ProgressSpinner />
    </div>

    <div class="mb-5" v-if="selectedRole?.id === 1">
      <Card>
        <template #header>
          <div class="m-4">
            <h1>Student's Profiles</h1>
          </div>
        </template>

        <template #content>
          <DataTable :value="users" paginator :rows="10" dataKey="user_id" filterDisplay="row">
            <template #empty> No users found. </template>
            <template #loading> Loading users data. Please wait. </template>

            <Column field="photo_profiles_user" header="Photo" style="width: 6rem">
              <template #body="{ data }">
                <div class="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
                  <img v-if="data.photo_profiles_user" :src="data.photo_profiles_user" alt="Profile"
                    class="w-full h-full object-cover" />
                  <i v-else class="pi pi-user text-gray-500 text-xl"></i>
                </div>
              </template>
            </Column>


            <Column field="name" header="Name" style="min-width: 12rem" :showFilterMenu="false">
              <template #body="{ data }">{{ data.username }}</template>
              <template #filter>
                <InputText v-model="filterName" placeholder="Search by Name" />
              </template>
            </Column>

            <Column field="major_name" header="Major" style="min-width: 12rem" :showFilterMenu="false">
              <template #body="{ data }">{{ data.nama_jurusan }}</template>
              <template #filter>
                <Select v-model="filterMajor" :options="jurusanList" option-label="name" option-value="id"
                  placeholder="Select Major" style="min-width: 14rem" :showClear="true" />
              </template>
            </Column>

            <Column field="grade_name" header="Grade" style="min-width: 12rem" :showFilterMenu="false">
              <template #body="{ data }" class="flex justify-center">
                <Tag :value="data.grade_lvl" />
              </template>
              <template #filter>
                <Select v-model="filterGrade" :options="gradeLevelList" optionLabel="name" optionValue="id"
                  placeholder="Select Grade" style="min-width: 12rem" :showClear="true" />
              </template>
            </Column>

            <Column field="rombel_name" header="Class" style="min-width: 14rem" :showFilterMenu="false">
              <template #body="{ data }">{{ data.name_rombel }}</template>
              <template #filter>
                <Select v-model="filterRombel" :options="rombelList" optionLabel="name" optionValue="id"
                  placeholder="Select Class" style="min-width: 14rem" :showClear="true" />
              </template>
            </Column>

            <Column field="phone_number" header="Phone Number" style="min-width: 12rem" :showFilterMenu="false">
              <template #body="{ data }">{{ data.phone_number }}</template>
            </Column>

            <Column field="action" header="Action" style="min-width: 12rem;" :showFilterMenu="false">
              <template #body="{ data }">
                <div class="flex gap-4">
                  <Button icon="pi pi-trash" severity="danger" outlined @click="deleteAccount(data.id)" />
                  <Button icon="pi pi-pencil" @click="openEditDialogStudent(data)" />
                  <Dialog v-model:visible="visibleStudent" modal header="Edit Student Profile"
                    :style="{ width: '30rem' }">
                    <span class="text-surface-500 dark:text-surface-400 block mb-8">Update the Student Data.</span>

                    <div class="flex items-center gap-4 mb-4">
                      <label for="username" class="font-semibold w-full">Student Name</label>
                      <InputText v-model="editStudentData.username" id="username" class="flex-auto"
                        autocomplete="off" />
                    </div>

                    <div class="flex items-center gap-4 mb-4">
                      <label for="phone_number" class="font-semibold w-full">Phone Number</label>
                      <InputText v-model="editStudentData.phone_number" id="phone_number" class="flex-auto"
                        autocomplete="off" />
                    </div>

                    <div class="flex items-center gap-4 mb-4">
                      <label for="grade" class="font-semibold w-full">Grade</label>
                      <Select v-model="editStudentData.grade_id" :options="selectedGrade" option-label="name"
                        option-value="id" placeholder="Select Grade" class="w-full" />
                    </div>

                    <div class="flex items-center gap-4 mb-4">
                      <label for="jurusan" class="font-semibold w-full">Major</label>
                      <Select v-model="editStudentData.jurusan_id" :options="selectedMajor" option-label="name"
                        option-value="id" placeholder="Select Major" class="w-full" />
                    </div>

                    <div class="flex items-center gap-4 mb-4">
                      <label for="rombel" class="font-semibold w-full">Class</label>
                      <Select v-model="editStudentData.rombel_id" :options="selectedStudyGroup" option-label="name"
                        option-value="id" placeholder="Select Class" class="w-full" />
                    </div>

                    <div class="flex justify-end gap-2">
                      <Button type="button" label="Cancel" severity="secondary" @click="visibleStudent = false" />
                      <Button type="button" label="Save" @click="updateStudent" />
                    </div>
                  </Dialog>

                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>

    <div v-if="selectedRole?.id === 2">
      <Card>
        <template #header>
          <div class="m-4">
            <h1>Teacher's Profiles</h1>
          </div>
        </template>
        <template #content>
          <DataTable :value="users" paginator :rows="10" dataKey="user_id" filterDisplay="row">
            <template #empty> No users found. </template>
            <template #loading> Loading users data. Please wait. </template>

            <Column field="photo_profiles_user" header="Photo" style="width: 6rem">
              <template #body="{ data }">
                <div class="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
                  <img v-if="data.photo_profiles_user" :src="data.photo_profiles_user" alt="Profile"
                    class="w-full h-full object-cover" />
                  <i v-else class="pi pi-user text-gray-500 text-xl"></i>
                </div>
              </template>
            </Column>

            <Column field="name" header="Name" style="min-width: 12rem" :showFilterMenu="false">
              <template #body="{ data }">{{ data.username }}</template>
              <template #filter>
                <InputText v-model="filterName" placeholder="Search by Name" />
              </template>
            </Column>

            <Column field="teacher_subject" header="Subject" style="min-width: 12rem" :showFilterMenu="false">
              <template #body="{ data }">{{ data.teacher_subject }}</template>
              <template #filter>
                <InputText v-model="filterSubject" placeholder="Search by Subject" />
              </template>
            </Column>

            <Column field="phone_number" header="Phone Number" style="min-width: 12rem" :showFilterMenu="false">
              <template #body="{ data }">{{ data.phone_number }}</template>

            </Column>

            <Column field="action" header="Action" style="min-width: 12rem;" :showFilterMenu="false">
              <template #body="{ data }">
                <div class="flex gap-4">
                  <Button icon="pi pi-trash" severity="danger" outlined @click="deleteAccount(data.id)" />
                  <Button icon="pi pi-pencil" @click="openEditDialogTeacher(data)" />
                  <Dialog v-model:visible="visibleTeacher" modal header="Edit Profile" :style="{ width: '30rem' }">
                    <span class="text-surface-500 dark:text-surface-400 block mb-8">Update the
                      Data.</span>
                    <div class="flex items-center gap-4 mb-4">
                      <label for="subject" class="font-semibold w-full">Teacher's Name</label>
                      <InputText v-model="editTeacherData.username" id="guru" class="flex-auto" autocomplete="off" />
                    </div>
                    <div class="flex items-center gap-4 mb-4">
                      <label for="subject" class="font-semibold w-full">Teacher's Subject</label>
                      <InputText v-model="editTeacherData.teacher_subject" id="teacher_subject" class="flex-auto"
                        autocomplete="off" />
                    </div>
                    <div class="flex items-center gap-4 mb-4">
                      <label for="subject" class="font-semibold w-full">Phone Number</label>
                      <InputText v-model="editTeacherData.phone_number" id="phone_number" class="flex-auto"
                        autocomplete="off" />
                    </div>
                    <div class="flex justify-end gap-2">
                      <Button type="button" label="Cancel" severity="secondary"
                        @click="visibleTeacher = false"></Button>
                      <Button type="button" label="Save" @click="updateTeacher"></Button>
                    </div>
                  </Dialog>
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </section>
  <ConfirmDialog />
  <Toast />
</template>