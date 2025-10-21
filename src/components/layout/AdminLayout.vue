<script setup>
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from "vue-router";

const router = useRouter()

const handleLogout = () => {
    localStorage.removeItem("token"); // hapus JWT
    router.push({ name: "SignIn" });
};

const confirm = useConfirm();
const requireConfirmation = (event) => {
    confirm.require({
        target: event.currentTarget,
        group: "headless",
        message: "Are you sure you want to Sign Out of this account?"
    });
};

</script>

<template>
    <!-- Fixed Navbar -->
    <div class="">
        <nav class="navbar fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between">
            <div class="flex items-center space-x-5">
                <img src="../../assets/LOGO_SMK_METLAND.png" alt="Logo" width="65" />
                <h1>
                    <b>MILS</b> <br /> <b>M</b>etschoo <b>I</b>ntegrated <b>L</b>earning <b>S</b>ystem
                </h1>
            </div>
            <div class="flex items-center space-x-4">

                <ConfirmPopup group="headless">
                    <template #container="{ message, acceptCallback, rejectCallback }">
                        <div class="rounded p-4">
                            <span>{{ message.message }}</span>
                            <div class="flex items-center gap-2 mt-4">
                                <Button label="Sign Out" @click="handleLogout" severity="danger" size="small"
                                    text></Button>
                                <Button label="Cancel" @click="rejectCallback" size="small"></Button>
                            </div>
                        </div>
                    </template>
                </ConfirmPopup>
                <img src="../../assets/Logo.png" alt="Foto Profil"
                    class="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center border-1 bg-gray-200 cursor-pointer"
                    @click="requireConfirmation($event)" />
            </div>
        </nav>
        <div class="absolute z-0 overflow-hidden top-0 right-0">
            <img src="/src/assets/Aset Mawar.png" width="130">
        </div>

        <div class="absolute z-0">
            <img src="/src/assets/Pesawat.png" width="500">
        </div>

        <div class="absolute z-0" style="top: -90px;">
            <img src="/src/assets/pesawat_2.png" width="700">
        </div>
    </div>

    <!-- Layout wrapper -->
    <div class="flex h-screen pt-[96px]">
        <!-- Sidebar -->
        <aside class="sidebar text-black flex flex-col overflow-y-auto">
            <div class="logo flex items-center px-4 py-6">
                <Icon class="icon" icon="eos-icons:admin-outlined" />
                <h1 class="m-4 font-semibold">Hello, Admin!</h1>
            </div>
            <ul class="flex flex-col space-y-1">
                <RouterLink to="/home-admin">
                    <li>
                        <Icon class="icon" icon="material-symbols:home-rounded" /><span class="nav-item">Home</span>
                    </li>
                </RouterLink>
                <RouterLink to="/database">
                    <li>
                        <Icon class="icon" icon="bx:data" /><span class="nav-item">Database
                            Management</span>
                    </li>
                </RouterLink>
                <RouterLink to="/classroom-management-admin">
                    <li>
                        <Icon class="icon" icon="icon-park-outline:category-management" /><span
                            class="nav-item">Database</span>
                    </li>
                </RouterLink>
                <RouterLink to="/clp-admin">
                    <li>
                        <Icon class="icon" icon="marketeq:diagram-bar-3" />
                        <span class="nav-item">Learning Plan</span>
                    </li>
                </RouterLink>
                <RouterLink to="/learning-reflection-admin">
                    <li>
                        <Icon class="icon" icon="fluent:learning-app-24-regular" />
                        <span class="nav-item">Learning Reflection</span>
                    </li>
                </RouterLink>
                <RouterLink to="/add-timetable">
                    <li>
                        <Icon class="icon" icon="uis:schedule" /><span class="nav-item">Timetable</span>
                    </li>
                </RouterLink>
                <RouterLink to="/add-teacher-account">
                    <li>
                        <Icon class="icon" icon="mdi:account-multiple-add-outline" /><span class="nav-item">Add Teacher
                            Account</span>
                    </li>
                </RouterLink>
            </ul>
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
    height: 96px;
}

.sidebar {
    position: fixed;
    top: 96px;
    left: 0;
    width: 60px;
    height: calc(100vh - 96px);
    transition: width 0.3s ease;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    z-index: 40;
}

.sidebar::-webkit-scrollbar {
    width: 0;
    background: transparent;
}

.sidebar:hover {
    width: 250px;
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
    padding: 12px 16px;
    transition: background-color 0.2s ease;
    border-radius: 8px;
    cursor: pointer;
}

.sidebar li:hover {
    background-color: #FFFCB8;
    opacity: 0.7;
}

.sidebar .icon {
    min-width: 30px;
    height: 30px;
    font-size: 20px;
    color: #797574;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav-item {
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease;
    color: black;
}

.sidebar:hover .nav-item {
    opacity: 1;
    visibility: visible;
}

.main-content {
    flex-grow: 1;
    margin-left: 60px;
    transition: margin-left 0.3s ease;
    background-color: white;
    padding: 1.5rem;
    border-radius: 1.5rem;
    overflow-y: auto;
    height: calc(100vh - 96px);
}

.sidebar:hover~.main-content {
    margin-left: 250px;
}
</style>
