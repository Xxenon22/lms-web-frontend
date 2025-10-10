<script setup>
import EditDeleteClass from "../../components/itemGuru/EditDeleteClass.vue";
import EditDeleteMateri from "../../components/itemGuru/EditDeleteMateri.vue";
import AssignmentManagement from "../../components/itemGuru/AssignmentManagement.vue";
import CLPManagement from "../../components/itemGuru/CLPManagement.vue";
import LearningReflectionManagement from "../../components/itemGuru/LearningReflectionManagement.vue";
</script>
<template>
    <Tabs value="0">
        <TabList class="overflow-hidden">
            <Tab value="0">Class Management</Tab>
            <Tab value="1">Material Management</Tab>
            <Tab value="2">Assignment Management</Tab>
            <Tab value="3">Learning Plan Management</Tab>
            <Tab value="4">Learning Reflection Management</Tab>
        </TabList>
        <TabPanels class="overflow-hidden">
            <TabPanel value="0">
                <EditDeleteClass />
            </TabPanel>
            <TabPanel value="1">
                <EditDeleteMateri />
            </TabPanel>
            <TabPanel value="2">
                <AssignmentManagement />
            </TabPanel>
            <TabPanel value="3">
                <CLPManagement />
            </TabPanel>
            <TabPanel value="4">
                <LearningReflectionManagement />
            </TabPanel>
        </TabPanels>
    </Tabs>
</template>
