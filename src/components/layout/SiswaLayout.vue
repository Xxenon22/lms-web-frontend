<script setup>
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import api from "../../services/api";

const src = ref(null)

const router = useRouter();

const handleLogout = () => {
    localStorage.removeItem("token"); // hapus JWT
    router.push({ name: "SignIn" });
};

const fetchPhotoProfile = async () => {
    try {
        const res = await api.get("/auth/profile");
        const data = res.data;

        // LANGSUNG PAKAI URL DARI BACKEND
        src.value = data.photo_url
            ? `${import.meta.env.VITE_API_URL}${data.photo_url}?v=${Date.now()}`
            : null;
    } catch (error) {
        console.error("Error fetch profile :", error);
    }
};

const confirm = useConfirm();
const requireConfirmation = (event) => {
    confirm.require({
        target: event.currentTarget,
        group: "headless",
        message: "Are you sure you want to Sign Out of this account?"
    });
};

onMounted(async () => {
    await fetchPhotoProfile();
});
</script>
<template>
    <!-- Fixed Navbar -->
    <nav class="navbar top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between rounded-lg shadow-lg">
        <div class="flex items-center space-x-5">
            <img src="../../assets/LOGO_SMK_METLAND.png" alt="Logo" width="65" />
            <div class="flex flex-col">
                <h1 class="text-2xl font-semibold">MILES</h1>
                <p>
                    Metschoo Integrated Learning System</p>
            </div>
        </div>
        <div class="flex items-center space-x-3">
            <ConfirmPopup group="headless">
                <template #container="{ message, acceptCallback, rejectCallback }">
                    <div class="rounded p-4">
                        <span>{{ message.message }}</span>
                        <div class="flex items-center gap-2 mt-4">
                            <Button label="Sign Out" @click="handleLogout" severity="danger" size="small" text></Button>
                            <Button label="Cancel" @click="rejectCallback" size="small"></Button>
                        </div>
                    </div>
                </template>
            </ConfirmPopup>
            <!-- Notif -->
            <!-- <div class="">
                <Icon icon="mdi:bell" width="24" height="24" class="text-white items-center justify-center" />
            </div> -->
            <!-- Photo Profile -->
            <div @click="requireConfirmation($event)"
                class="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 cursor-pointer">
                <img v-if="src" :src="src" alt="Photo Profile" class="w-full h-full object-cover" />
                <i v-else class="pi pi-user text-gray-500" style="font-size: 1.5rem;"></i>
            </div>
        </div>
    </nav>

    <!-- Layout wrapper -->
    <div class="flex h-screen">
        <!-- Sidebar -->
        <aside class="sidebar text-white flex flex-col overflow-y-auto rounded-lg shadow-lg ">
            <div class="relative z-50 logo flex items-center border-b-2 border-white m-4 mt-8">
                <Icon class="icon" icon="famicons:book-sharp" />
                <h1 class="m-4 font-semibold">Enjoy your study time 😊</h1>
            </div>
            <div class="flex flex-col justify-between flex-grow h-full">
                <ul class="flex flex-col space-y-1 z-20">
                    <RouterLink to="/home-student">
                        <li>
                            <Icon class="icon" icon="material-symbols:home-rounded" style="color: #ffff" />
                            <span class="nav-item">Home</span>
                        </li>
                    </RouterLink>
                    <RouterLink to="/your-assignment">
                        <li>
                            <Icon class="icon" icon="material-symbols:assignment" style="color: #ffff" />
                            <span class="nav-item">Assignment</span>
                        </li>
                    </RouterLink>
                    <RouterLink to="/timetable-student">
                        <li>
                            <Icon class="icon" icon="uis:schedule" style="color: #ffff" />
                            <span class="nav-item">Timetable</span>
                        </li>
                    </RouterLink>
                    <RouterLink to="/student-settings">
                        <li>
                            <Icon class="icon" icon="mdi:cog" style="color: #ffff" />
                            <span class="nav-item">Settings</span>
                        </li>
                    </RouterLink>
                </ul>
                <div class="wm mt-auto flex items-center justify-center mb-4 space-x-2">
                    <img src="/src/assets/Logo_ITEC.png" class="wm-logo" alt="Logo">
                    <span class="credit">| Designed By ITEC Metschoo</span>
                </div>
            </div>
        </aside>

        <!-- Main content -->
        <main class="main-content">
            <slot />
        </main>
    </div>

    <Toast />
</template>

<style scoped>
.navbar {
    position: fixed;
    top: 25px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 40px);
    max-width: 2300px;
    height: 96px;
    z-index: 1000;
    background: linear-gradient(90deg, rgba(245, 245, 245, 1) 0%, rgba(69, 139, 139, 1) 100%);
    border-radius: 1rem;
    padding: 0 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}


.sidebar {
    position: fixed;
    top: 135px;
    left: 20px;
    width: 60px;
    height: calc(100vh - 155px);
    transition: width 0.3s ease;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    z-index: 40;
    background-color: #146B6B;
}

.sidebar::-webkit-scrollbar {
    width: 0;
    background: transparent;
}

.sidebar .icon {
    min-width: 30px;
    height: 30px;
    font-size: 20px;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav-item {
    white-space: nowrap;
    visibility: hidden;
    transition: opacity 0.8s ease;
    color: #ffffff;
}

.credit {
    font-size: 12px;
    color: #ffffff;
}

.wm-logo {
    width: 28px;
    height: 28px;
    transition: all 0.3s ease;
}

.sidebar .credit {
    display: none;
}

.sidebar .wm {
    flex-direction: column;
}

.sidebar:hover .credit {
    display: inline;
}

.sidebar:hover .wm {
    flex-direction: row;
}

.sidebar:hover .wm-logo {
    width: 32px;
    height: 32px;
}

.sidebar:hover .nav-item {
    opacity: 1;
    visibility: visible;
}

.sidebar:hover {
    width: 230px;
}

.sidebar ul {
    padding: 0;
    margin: 0;
    list-style: none;
}

.sidebar li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 7px;
    transition: background-color 0.8s ease;
    border-radius: 8px;
    cursor: pointer;
    margin: 8px;

}

.sidebar li:hover {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.45);
}

.main-content {
    margin-top: 135px;
    flex-grow: 1;
    margin-left: 100px;
    /* padding: 1.5rem; */
    margin-right: 20px;
    transition: margin-left 0.3s ease;
    background-color: white;
    border-radius: 1.5rem;
    overflow-y: auto;
    height: calc(100vh - 155px);

}

.sidebar:hover~.main-content {
    margin-left: 270px;
}
</style>
