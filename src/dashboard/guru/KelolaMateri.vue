<script setup>
import api from "../../services/api";
import { ref, onMounted } from "vue";
import { useToast } from "primevue";

const judulMateri = ref("");
const fileUrl = ref("");
const linkYtb = ref("");
const linkZoom = ref("");
const passcode = ref("");
const deskripsi = ref("");
const guruName = ref("...");
const judul_penugasan = ref(null);
const daftarBankSoal = ref([]);
const guruId = ref(null);
const loading = ref(false);
const toast = useToast();
const daftarKelas = ref([]);
const selectedKelas = ref([]);
const fileUploadRef = ref(null);

// Ambil profil guru dari backend
const fetchGuruProfile = async () => {
  try {
    const res = await api.get("/auth/profile");
    guruName.value = res.data.username;
    guruId.value = res.data.id;

    return true;
  } catch (err) {
    console.warn("fetchGuruProfile:", err);
    if (err.response && err.response.status === 404) {
      toast.add({ severity: "error", summary: "Error", detail: "Endpoint /profile tidak ditemukan (404)", life: 4000 });
    } else {
      toast.add({ severity: "error", summary: "Error", detail: "Gagal mengambil profil guru", life: 4000 });
    }
    return false;
  }
};

// Ambil daftar kelas khusus guru (pastikan backend punya route ini)
const fetchDaftarKelas = async () => {
  try {
    const res = await api.get("/kelas");
    daftarKelas.value = (res.data || []).map((k) => ({
      id: k.id,
      name: `${k.grade_lvl || ""} ${k.major} ${k.name_rombel || ""} - ${k.nama_mapel || ""}`,
    }));

  } catch (err) {
    console.error("fetchDaftarKelas:", err);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Gagal mengambil daftar kelas",
      life: 4000,
    });
  }
};


// Ambil bank soal guru
const fetchBankSoal = async () => {
  try {
    const res = await api.get("/bank-soal");
    daftarBankSoal.value = (res.data || []).map((b) => ({ id: b.id, name: b.judul_penugasan }));
  } catch (err) {
    console.error("fetchBankSoal:", err);
    toast.add({ severity: "error", summary: "Error", detail: "Gagal mengambil bank soal", life: 4000 });
  }
};

// Upload file: kirim FormData ke backend (multer)
const handleFileUpload = async (event) => {

  const file = event.files?.[0];
  if (!file) return;
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    fileUrl.value = res.data.url;
    toast.add({ severity: "success", summary: "Success", detail: "File Uploaded Successfully", life: 3000 });
  } catch (err) {
    console.error("handleFileUpload:", err);
    toast.add({ severity: "error", summary: "Upload Failed", detail: err?.message || "Upload error", life: 4000 });
  } finally {
    loading.value = false;
  }
};

// Submit materi ke backend
const submitMateri = async () => {
  try {
    if (!selectedKelas.value.length || !judulMateri.value.trim() || !fileUrl.value) {
      toast.add({ severity: "warn", summary: "Check Form", detail: "All fields must be filled", life: 3000 });
      return;
    }
    const selectedSoal = daftarBankSoal.value.find((b) => b.id === judul_penugasan.value);
    const inserts = selectedKelas.value.map((kelasId) => ({
      judul: judulMateri.value,
      video_url: linkYtb.value,
      file_url: fileUrl.value,
      deskripsi: deskripsi.value,
      guru_id: guruId.value,
      link_zoom: linkZoom.value,
      pass_code: passcode.value,
      judul_penugasan: selectedSoal?.name,
      kelas_id: kelasId,
      bank_soal_id: selectedSoal?.id,
    }));

    for (const data of inserts) {
      await api.post("/module-pembelajaran", data);
    }
    toast.add({ severity: "success", summary: "Success", detail: "Material Saved successfully", life: 3000 });
    // reset form
    selectedKelas.value = [];
    judulMateri.value = "";
    fileUrl.value = "";
    linkYtb.value = "";
    linkZoom.value = "";
    passcode.value = "";
    deskripsi.value = "";
    judul_penugasan.value = null;
    if (fileUploadRef.value) fileUploadRef.value.clear();
  } catch (err) {
    console.error("submitMateri:", err);
    toast.add({ severity: "error", summary: "Failed", detail: err?.message || "Submit error", life: 3000 });
  }
};
onMounted(async () => {
  await fetchGuruProfile()
  await fetchDaftarKelas()
  await fetchBankSoal()
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

          <div>
            <FileUpload ref="fileUploadRef" mode="basic" name="file" accept=".pdf" chooseLabel="Choose File"
              :customUpload="true" class="w-full mb-2" @select="handleFileUpload" />
            <p v-if="fileUrl" class="text-sm text-green-500">
              File Uploaded Successfully:
              <a :href="fileUrl" class="underline" target="_blank">View File</a>
            </p>
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
                Link Zoom
              </div>
            </template>
            <template #content>
              <div class="space-y-10">
                <FloatLabel>
                  <InputText id="link_zoom" v-model="linkZoom" class="w-full" />
                  <label for="link_zoom">Enter Link Zoom</label>
                </FloatLabel>

                <FloatLabel>
                  <InputText id="passcode" v-model="passcode" class="w-full" />
                  <label for="pass_code">Enter Link Zoom Passcode</label>
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
        <Button :loading="loading" @click="submitMateri" icon="pi pi-upload" label="Upload" :disabled="!fileUrl" />
      </div>
    </template>
  </Card>

  <div class="flex">
  </div>
  <Toast />
</template>