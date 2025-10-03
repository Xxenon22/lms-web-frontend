<script setup>
import { ref, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '../../services/api'

const toast = useToast()
const isLoading = ref(true)

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

const fetchProfiles = async () => {
  try {
    isLoading.value = true

    const [profilesRes, jurusanRes, gradesRes, rombelRes] = await Promise.all([
      api.get("/auth"),
      api.get("/jurusan"),
      api.get("/grade-level"),
      api.get("/rombel")
    ])

    const profiles = profilesRes.data.profiles || []
    const jurusan = jurusanRes.data.jurusan || []
    const grades = gradesRes.data.grades || []
    const rombel = rombelRes.data.rombel || []

    // Map profiles ke format yang dipakai tabel
    allProfiles.value = profiles.map(p => ({
      id: p.id,
      username: p.username,
      role: p.role,
      phone_number: p.phone_number,
      photo_profiles_user: p.photo_profiles_user
        ? `${import.meta.env.VITE_API_URL}/api${p.photo_profiles_user}`
        : null,
      teacher_subject: p.teacher_subject,
      jurusan_id: p.jurusan_id || '',   // kosong jika tidak ada
      grade_id: p.grade_id || '',
      rombel_id: p.rombel_id || ''
    }))

    jurusanList.value = jurusan.map(j => j.nama_jurusan).filter(Boolean)
    gradeLevelList.value = grades.map(g => g.grade_lvl).filter(Boolean)
    rombelList.value = rombel.map(r => r.name_rombel).filter(Boolean)

    // // Isi dropdown filter langsung dari tabel referensi (semua data di DB)
    // jurusanList.value = jurusan
    //   .map(j => j.nama_jurusan)
    //   .filter(v => v !== null && v !== undefined && String(v).trim() !== '')

    // gradeLevelList.value = grades
    //   .map(g => g.grade_lvl)
    //   .filter(v => v !== null && v !== undefined && String(v).trim() !== '')

    // rombelList.value = rombel
    //   .map(r => r.name_rombel)
    //   .filter(v => v !== null && v !== undefined && String(v).trim() !== '')

    // initial apply filters
    applyFilters()
  } catch (error) {
    console.error('fetchProfiles error', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch users', life: 3000 })
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

  // normalize filter values (safe if null)
  const fName = (filterName.value || '').toLowerCase()
  const fMajor = (filterMajor.value || '').toLowerCase()
  const fGrade = (filterGrade.value || '').toLowerCase()
  const fRombel = (filterRombel.value || '').toLowerCase()
  const fPhone = (filterPhone.value || '').toLowerCase()
  const fSubject = (filterSubject.value || '').toLowerCase()

  users.value = base.filter(user => {
    return (
      (user.username || '').toLowerCase().includes(fName) &&
      String(user.jurusan_id || '').toLowerCase().includes(fMajor) &&
      String(user.grade_id || '').toLowerCase().includes(fGrade) &&
      String(user.rombel_id || '').toLowerCase().includes(fRombel) &&
      (user.teacher_subject || '').toLowerCase().includes(fSubject) &&
      (String(user.phone_number || '')).toLowerCase().includes(fPhone)
    )
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

onMounted(() => {
  fetchProfiles()
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
                <Select v-model="filterMajor" :options="jurusanList" placeholder="Select Major" style="min-width: 14rem"
                  :showClear="true" />
              </template>
            </Column>

            <Column field="grade_name" header="Grade" style="min-width: 12rem" :showFilterMenu="false">
              <template #body="{ data }" class="flex justify-center">
                <Tag :value="data.grade_lvl" />
              </template>
              <template #filter>
                <Select v-model="filterGrade" :options="gradeLevelList" placeholder="Select Grade"
                  style="min-width: 12rem" :showClear="true" />
              </template>
            </Column>

            <Column field="rombel_name" header="Class" style="min-width: 14rem" :showFilterMenu="false">
              <template #body="{ data }">{{ data.name_rombel }}</template>
              <template #filter>
                <Select v-model="filterRombel" :options="rombelList" placeholder="Select Class" style="min-width: 14rem"
                  :showClear="true" />
              </template>
            </Column>

            <Column field="phone_number" header="Phone Number" style="min-width: 12rem" :showFilterMenu="false">
              <template #body="{ data }">{{ data.phone_number }}</template>
              <template #filter>
                <InputText v-model="filterPhone" placeholder="Search by Phone Number" />
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
              <template #filter>
                <InputText v-model="filterPhone" placeholder="Search by Phone Number" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </section>
  <Toast />
</template>