<template>
    <div
        class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 px-4">
        <div class="relative bg-white max-w-md w-full p-10 rounded-3xl shadow-2xl text-center overflow-hidden">
            <!-- Decorative blur -->
            <div class="absolute -top-20 -right-20 w-40 h-40 bg-red-100 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-gray-200 rounded-full blur-3xl"></div>

            <!-- Icon -->
            <div class="flex justify-center mb-6">
                <div class="w-16 h-16 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                    </svg>
                </div>
            </div>

            <!-- Title -->
            <h1 class="text-3xl font-extrabold text-gray-800 mb-3">
                {{ title || "Maintenance Mode" }}
            </h1>

            <!-- Message -->
            <p class="text-gray-600 leading-relaxed mb-8">
                {{ message || "Our system is currently undergoing scheduled maintenance to improve your experience." }}
            </p>

            <!-- Status -->
            <div class="flex items-center justify-center gap-2 text-sm text-gray-400 animate-pulse">
                <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>We'll be back shortly</span>
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
