<!-- <script setup>
import { supabase } from '../../supabase/supabase';
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useRouter } from 'vue-router';

const toast = useToast();
const loading = ref(false);

const router = useRouter()
const guruId = ref(null);
const daftarPenugasan = ref([]);
const selectedTitle = ref(null)
const title = ref([])

const listSoal = ref([
    {
        pertanyaanEssai: "",
        gambar: null,
        uploadedUrl: null,
        previewUrl: null
    }
]);

// Ambil daftar penugasan
const fetchPenugasan = async () => {
    const { data, error } = await supabase.from("bank_soal").select("id, judul_penugasan");
    if (!error) {
        daftarPenugasan.value = data.map(d => ({ id: d.id, name: d.judul_penugasan }));
    }
};

// Ambil user login (guru)
const fetchGuruProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        guruId.value = user.id;
    }
};

// Tambah penugasan baru
const fetchTitle = async () => {
    // if (!judul.value.trim()) {
    //     toast.add({ severity: "warn", summary: "Title is Empty", life: 2000 });
    //     return;
    // }

    const { data, error } = await supabase
        .from("bank_soal")
        // .insert({ judul_penugasan: judulBaru.value, guru_id: guruId.value })
        .select('id, judul_penugasan')
    // .single();

    if (error) {
        toast.add({ severity: "error", summary: "Gagal", detail: error.message });
        return;
    } else {
        title.value = data
        console.log('data :', data)
    }

    // daftarPenugasan.value.push({ id: data.id, name: data.judul_penugasan });
    // selectedTitle.value = data.id;
    // judul.value = "";
};



// Submit semua soal
const submitSemuaEssay = async () => {
    if (!selectedTitle.value) {
        toast.add({ severity: "warn", summary: "Please select a title", life: 2000 });
        return;
    }

    loading.value = true;

    // Validasi & Upload gambar
    for (let soal of listSoal.value) {
        if (!soal.pertanyaanEssai) {
            toast.add({ severity: "warn", summary: "There is a question that is incomplete.", life: 2000 });
            loading.value = false;
            return;
        }

        if (soal.gambar) {
            soal.uploadedUrl = await uploadGambar(soal.gambar);
        } else {
            soal.uploadedUrl = null;
        }
    }

    // Insert penugasan jika belum dipilih
    let bankSoalId = selectedTitle.value;
    if (!bankSoalId) {
        const { data: bankSoal, error: errorBank } = await supabase
            .from("bank_soal")
            .insert({ judul_penugasan: title.value, guru_id: guruId.value })
            .select()
            .single();

        if (errorBank) {
            toast.add({ severity: "error", summary: "Failed to save the title", detail: errorBank.message });
            loading.value = false;
            return;
        }

        bankSoalId = bankSoal.id;
    }

    // Siapkan data soal
    const dataToInsert = listSoal.value.map(s => ({
        bank_soal_id: bankSoalId,
        pertanyaan_essai: s.pertanyaanEssai,
        gambar_saol_id: s.uploadedUrl
    }));

    // Insert soal
    const { error: errorSoal } = await supabase.from("soal_pilgan").insert(dataToInsert);

    loading.value = false;

    if (errorSoal) {
        toast.add({ severity: "error", summary: "Failed to save the question", detail: errorSoal.message });
    } else {
        toast.add({ severity: "success", summary: "Success!", detail: "Question and assignment have been saved.", life: 3000 });
        title.value = "";
        listSoal.value = [{
            pertanyaanEssai: "", gambar: null, uploadedUrl: null, previewUrl: null
        }];
    }
};

const back = () => {
    router.back()
}

onMounted(() => {
    fetchPenugasan();
    fetchGuruProfile();
    fetchTitle()
});

</script> -->

<template>
    <div class="space-y-8">
        <div class="flex justify-between items-center">
            <Button label="back" icon="pi pi-chevron-left" @click="back" />
            <div class="">
                <Select v-model="selectedTitle" :options="title" option-value="id" option-label="judul_penugasan"
                    placeholder="Select a Title" class="w-full md:w-56" />
            </div>
        </div>


        <div class="flex justify-end space-x-2">
            <Button label="Submit" :loading="loading" @click="submitSemuaEssay" />
        </div>
        <Toast />
    </div>
</template>
