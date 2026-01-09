<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
        <div class="text-center bg-white p-10 rounded-2xl shadow-xl max-w-md">
            <h1 class="text-3xl font-bold text-red-600 mb-4">
                {{ title }}
            </h1>

            <p class="text-gray-600 mb-6">
                {{ message }}
            </p>

            <div class="animate-pulse text-sm text-gray-400">
                ⏳ Kami akan segera kembali
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    title: String,
    message: String
});
</script>
