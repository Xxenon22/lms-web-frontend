<script setup>
import JadwalGuru from './JadwalGuru.vue';
import JadwalSiswa from './JadwalSiswa.vue';
import JadwalSiswa2 from './JadwalSiswa2.vue';
</script>

<template>
    <div class="card">
        <Tabs value="0">
            <TabList>
                <Tab value="0">Teacher Timetable</Tab>
                <Tab value="1">Grade X Timetable</Tab>
                <Tab value="2">Grade XI Timetable</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <JadwalGuru />
                </TabPanel>
                <TabPanel value="1">
                    <JadwalSiswa />
                </TabPanel>
                <TabPanel value="2">
                    <JadwalSiswa2 />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>