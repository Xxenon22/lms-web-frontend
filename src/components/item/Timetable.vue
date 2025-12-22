<script setup>
import JadwalGuru from './JadwalGuru.vue';
import JadwalSiswa from './JadwalSiswa.vue';
import JadwalSiswa2 from './JadwalSiswa2.vue';
import { ref } from "vue";

const activeTab = ref("0");
</script>

<template>
    <div class="m-10">
        <!-- Tabs -->
        <div class="flex gap-3 mb-6 shadow-2xl p-5 rounded-xl">
            <button class="px-5 py-2 rounded-xl font-medium transition-all" :class="activeTab === '0'
                ? '!bg-[#008C95] text-white shadow'
                : '!bg-[#94A4A4] text-white'" @click="activeTab = '0'">
                Teacher Timetable
            </button>

            <button class="px-5 py-2 rounded-xl font-medium transition-all" :class="activeTab === '1'
                ? '!bg-[#008C95] text-white shadow'
                : '!bg-[#94A4A4] text-white'" @click="activeTab = '1'">
                Grade X Timetable
            </button>

            <button class="px-5 py-2 rounded-xl font-medium transition-all" :class="activeTab === '2'
                ? '!bg-[#008C95] text-white shadow'
                : '!bg-[#94A4A4] text-white'" @click="activeTab = '2'">
                Grade XI Timetable
            </button>
        </div>

        <!-- Content Container -->
        <div class="bg-white p-5 border-transparent rounded-lg ">

            <div v-if="activeTab === '0'">
                <h2 class="text-lg font-semibold mb-3">Teacher Timetable</h2>
                <JadwalGuru />
            </div>

            <div v-if="activeTab === '1'">
                <h2 class="text-lg font-semibold mb-3">Grade X Timetable</h2>
                <JadwalSiswa />
            </div>

            <div v-if="activeTab === '2'">
                <h2 class="text-lg font-semibold mb-3">Grade XI Timetable</h2>
                <JadwalSiswa2 />
            </div>

        </div>
    </div>
</template>
