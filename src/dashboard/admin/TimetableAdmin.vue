<script setup>
import timetableStudent from './timetableStudent.vue';
import timetableTeacher from './timetableTeacher.vue';
import timetableStudentXI from './timetableStudentXI.vue';
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
                    <timetableTeacher />
                </TabPanel>
                <TabPanel value="1">
                    <timetableStudent />
                </TabPanel>
                <TabPanel value="2">
                    <timetableStudentXI />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>
