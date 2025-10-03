<template>
    <div class="fixed top-0 left-0 w-full blur-md h-full bg-cover bg-center z-[-1]"
        style="background-image: url('/src/assets/school_bg.png')">
        <!-- Slot hanya untuk layouting -->
        <div class="w-full h-full">
            <slot />
        </div>
    </div>
</template>