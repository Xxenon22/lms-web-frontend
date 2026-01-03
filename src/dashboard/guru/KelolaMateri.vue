<script setup>
import api from "../../services/api";
import { ref, onMounted, computed } from "vue";
import { useToast } from "primevue";

const toast = useToast();
const loading = ref(false);

// form state
const judulMateri = ref("");
const linkYtb = ref("");
const linkZoom = ref("");
const passcode = ref("");
const deskripsi = ref("");
const judul_penugasan = ref(null);
const selectedKelas = ref([]);
const selectedFile = ref(null);

// data
const guruName = ref("...");
const guruId = ref(null);
const daftarKelas = ref([]);
const daftarBankSoal = ref([]);

const fileUploadRef = ref(null);

// ================= FETCH DATA =================
const fetchGuruProfile = async () => {
  const res = await api.get("/auth/profile");
  guruName.value = res.data.username;
  guruId.value = res.data.id;
};

const fetchDaftarKelas = async () => {
  const res = await api.get("/kelas");
  daftarKelas.value = (res.data || []).map(k => ({
    id: k.id,
    name: `${k.grade_lvl || ""} ${k.major || ""} ${k.name_rombel || ""} - ${k.nama_mapel || ""}`
  }));
};

const fetchBankSoal = async () => {
  const res = await api.get("/bank-soal");
  daftarBankSoal.value = (res.data || []).map(b => ({
    id: b.id,
    name: b.judul_penugasan
  }));
};

// ================= FILE HANDLER =================
const handleFileSelect = (event) => {
  const file = event.files?.[0];
  if (!file) return;

  if (file.type !== "application/pdf") {
    toast.add({ severity: "warn", summary: "Invalid File", detail: "Only PDF allowed" });
    return;
  }

  selectedFile.value = file;
};

const selectedSoal = computed(() =>
  daftarBankSoal.value.find(b => b.id === judul_penugasan.value)
);

// ================= SUBMIT =================
const submitMateri = async () => {
  try {
    loading.value = true;

    const formData = new FormData();
    formData.append("judul", judulMateri.value);
    formData.append("video_url", linkYtb.value);
    formData.append("deskripsi", deskripsi.value);
    formData.append("guru_id", guruId.value);
    formData.append("bank_soal_id", judul_penugasan.value || "");
    formData.append("judul_penugasan", selectedSoal?.name || "");
    formData.append("link_zoom", linkZoom.value);
    formData.append("pass_code", passcode.value);
    formData.append("file", selectedFile.value);

    // ⬅️ kirim array kelas
    selectedKelas.value.forEach(id => {
      formData.append("kelas_ids[]", id);
    });

    await api.post("/module-pembelajaran", formData);

    toast.add({ severity: "success", summary: "Success", life: 3000 });
    resetForm();
  } catch (err) {
    console.error(err);
    toast.add({ severity: "error", summary: "Failed", life: 3000 });
  } finally {
    loading.value = false;
  }
};


const resetForm = () => {
  judulMateri.value = "";
  linkYtb.value = "";
  linkZoom.value = "";
  passcode.value = "";
  deskripsi.value = "";
  judul_penugasan.value = null;
  selectedKelas.value = [];
  selectedFile.value = null;
  fileUploadRef.value?.clear();
};

onMounted(async () => {
  await fetchGuruProfile();
  await fetchDaftarKelas();
  await fetchBankSoal();
});
</script>

<template>
  <Card class="m-5">
    <template #header>
      <h1 class="m-4 text-2xl">Create Material</h1>
    </template>

    <template #content>
      <div class="flex space-x-5">
        <!-- Form Input -->
        <div class="space-y-7 w-1/2">
          <div>
            <MultiSelect v-model="selectedKelas" :options="daftarKelas" option-label="name" filter option-value="id"
              display="chip" placeholder="Select one or more classes" class="flex w-full overflow-auto break-all" />
          </div>

          <div>
            <FloatLabel>
              <InputText id="judul_materi" v-model="judulMateri" class="w-full" />
              <label for="judul_materi">Lesson Title</label>
            </FloatLabel>
          </div>

          <div class="flex flex-col space-y-5">
            <div class="flex flex-col">
              <FileUpload ref="fileUploadRef" mode="basic" accept=".pdf" chooseLabel="Choose PDF" :customUpload="true"
                @select="handleFileSelect" />

              <!-- <p v-if="selectedFile" class="text-sm text-green-600">
                Selected file: {{ selectedFile.name }}
              </p> -->
            </div>
            <div class="">
              <p class="text-red-500">*Maximum file size is 20MB.</p>
            </div>
          </div>



          <div>
            <FloatLabel>
              <InputText id="link_ytb" v-model="linkYtb" class="w-full" />
              <label for="link_ytb">Enter Youtube link</label>
            </FloatLabel>
          </div>

          <div>
            <Select v-model="judul_penugasan" :options="daftarBankSoal" filter option-label="name" option-value="id"
              placeholder="Select Assignment" class="w-full md:w-full">
              <template #value="{ value, placeholder }">
                <span v-if="value">{{daftarBankSoal.find(opt => opt.id === value)?.name}}</span>
                <span v-else class="text-gray-400">{{ placeholder }}</span>
              </template>

              <template #option="{ option }">
                <div class="flex items-center px-2 py-1">
                  <span>{{ option.name }}</span>
                </div>
              </template>
            </Select>
          </div>

          <div class="">
            <FloatLabel>
              <Textarea id="deskripsi" v-model="deskripsi" class="w-full" rows="3" />
              <label for="deskripsi">Description</label>
            </FloatLabel>
          </div>

          <Card>
            <template #header>
              <div class="m-5">
                Zoom Link (optional)
              </div>
            </template>
            <template #content>
              <div class="space-y-10">
                <FloatLabel>
                  <InputText id="link_zoom" v-model="linkZoom" class="w-full" />
                  <label for="link_zoom">Enter Zoom Link</label>
                </FloatLabel>

                <FloatLabel>
                  <InputText id="passcode" v-model="passcode" class="w-full" />
                  <label for="pass_code">Enter Zoom Link Passcode</label>
                </FloatLabel>
              </div>
            </template>
          </Card>
        </div>

        <!-- Preview Card -->
        <div class="flex w-1/2 justify-center">
          <div class="preview border w-64 h-96 p-4 shadow-2xl flex flex-col justify-between">
            <div class="text-center">
              <h2 class="text-xl font-bold">{{ judulMateri || "Lesson Title" }}</h2>
            </div>
            <div class="text-center">
              <h2 class="text-sm text-gray-600">
                {{ guruName }}
              </h2>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-5">
        <Button :loading="loading" @click="submitMateri" icon="pi pi-upload" label="Upload" />
      </div>
    </template>
  </Card>

  <div class="flex">
  </div>
  <Toast />
</template>