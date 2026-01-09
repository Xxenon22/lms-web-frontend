import { createWebHistory, createRouter } from 'vue-router'
import Signin from "./components/auth/SignIn.vue"
import api from "./services/api.js"

const routes = [

    {
        path: '/',
        component: Signin,
        name: "SignIn",
        meta: {
            title: 'Sign in - Metschoo Integrated Learning System'
        }
    },
    {
        path: '/sign-up',
        component: () => import("./components/auth/SignUp.vue"),
        name: "SignUp",
        meta: {
            title: 'Sign up - Metschoo Integrated Learning System'
        }
    },
    {
        path: '/verify-code',
        component: () => import("./components/auth/verificationPage.vue"),
        name: "verify",
        meta: {
            title: 'Verify code - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/home-admin",
        component: () => import("./dashboard/admin/DashboardAdmin.vue"),
        meta: {
            requiresAuth: true,
            role: "admin",
            layout: "admin",
            title: 'Admin - Metschoo Integrated Learning System'
        },
    },
    {
        path: "/home-teacher",
        component: () => import("./dashboard/guru/DashboardGuru.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: 'Home - Metschoo Integrated Learning System'
        },
    },
    {
        path: "/home-student",
        component: () => import("./dashboard/siswa/DashboardSiswa.vue"),
        meta: {
            requiresAuth: true,
            role: "student",
            layout: "student",
            title: 'Home - Metschoo Integrated Learning System'
        },
    },
    {
        path: "/enter-to-the-class/:kelasId",
        name: "Enter-To-The-Class",
        component: () => import("./dashboard/guru/JoinClass.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: "Classroom - Metschoo Integrated Learning System"
        }
    },
    {
        path: "/develope-course-content",
        name: "Develope-Course-Content",
        component: () => import("./dashboard/guru/KelolaMateri.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: "Assignment - Metschoo Integrated Learning System"
        }
    },
    {
        path: "/assignments",
        name: "Assignments",
        component: () => import("./dashboard/guru/KelolaTugas.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: 'Develope Course Content - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/classroom-management",
        name: "Classroom-Management",
        component: () => import("./dashboard/guru/ManagementClass.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: "Classroom Management - Metschoo Integrated Learning System"
        }
    },
    {
        path: "/learning-material-details/:id",
        name: "Learning-Material-Details",
        component: () => import("./dashboard/guru/DetailMateri.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: "Detailed Learning Materials - Metschoo Integrated Learning System"
        }
    },
    {
        path: "/join-class/:id",
        name: "Join-Class",
        component: () => import("./dashboard/siswa/JoinKelasSiswa.vue"),
        meta: {
            requiresAuth: true,
            role: "student",
            layout: "student",
            title: 'Join Classroom - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/edit-assignment/:id",
        name: "edit-assignment",
        component: () => import("./components/itemGuru/EditAssignment.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: "Edit Assignment - Metschoo Integrated Learning System"
        }
    },
    {
        path: "/classroom-management-admin",
        name: "Classroom-Management-Admin",
        component: () => import("./dashboard/admin/ClassroomManagementAdmin.vue"),
        meta: {
            requiresAuth: true,
            role: "admin",
            layout: "admin",
            title: "Admin - Metschoo Integrated Learning System"
        }
    },
    {
        path: "/student-settings",
        name: "Student-Settings",
        component: () => import("./dashboard/siswa/SettingsSiswa.vue"),
        meta: {
            requiresAuth: true,
            role: "student",
            layout: "student",
            title: "Student Profile - Metschoo Integrated Learning System"
        }
    },
    {
        path: "/teacher-settings",
        name: "Teachers-Settings",
        component: () => import("./dashboard/guru/SettingsGuru.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: "Teacher Profile - Metschoo Integrated Learning System"
        }
    },
    {
        path: "/class-learning-plan",
        name: "Class-Learning-Plan",
        component: () => import("./dashboard/guru/RPK.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: "Class Learning Plan -  Metschoo Integrated Learning System"
        }
    },
    {
        path: "/class-learning-reflection",
        name: "Class-Learning-Reflection",
        component: () => import("./dashboard/guru/LearningReflection.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: "Learning Reflection - Metschoo Integrated Learning System"
        }
    },
    {
        path: "/edit-clp/:id",
        name: "Edit-CLP",
        component: () => import("./dashboard/guru/editRPK.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: "Update Class Learning Plan - Metschoo Integrated Learning System"
        }
    },
    {
        path: "/clp-view-teacher/:id",
        name: "CLP-View-Teacher",
        component: () => import("./components/itemGuru/CLPView.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: 'Class Learning Plan - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/interactive-forum",
        name: "Interactive-Forum",
        component: () => import("./dashboard/guru/InteractiveForum.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: "Interactive Forum - Metschoo Integrated Learning System"
        }
    },
    {
        path: "/assignment-list/:kelasId",
        name: "Assignment-List",
        component: () => import("./dashboard/guru/assignmentList.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: "Assignment List - Metschoo Integrated Learning System"
        }
    },
    {
        path: "/view-student-assignment/:kelasId/:assignmentId",
        name: "View-Student-Assignment",
        component: () => import("./dashboard/guru/viewStudentAssignment.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: 'View Student Answer - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/add-timetable",
        name: "Add-timetable",
        component: () => import("./dashboard/admin/TimetableAdmin.vue"),
        meta: {
            requiresAuth: true,
            role: "admin",
            layout: "admin",
            title: 'Add New Timetable - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/timetable-student",
        name: "Timetable-student",
        component: () => import("./components/item/Timetable.vue"),
        meta: {
            requiresAuth: true,
            role: "student",
            layout: "student",
            title: 'Timetable - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/timetables",
        name: "Timetables",
        component: () => import("./components/item/Timetable.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: 'Timetable - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/assignment-review/:userId/:assignmentId",
        name: "Assignment-Review",
        component: () => import("./dashboard/guru/ReviewAssignment.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: 'Assignment Review - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/your-assignment",
        name: "Your-Assignment",
        component: () => import("./dashboard/siswa/AssignmentListStudent.vue"),
        meta: {
            requiresAuth: true,
            role: "student",
            layout: "student",
            title: 'Assignment List - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/database",
        name: "Database",
        component: () => import("./dashboard/admin/DatabaseManagement.vue"),
        meta: {
            requiresAuth: true,
            role: "admin",
            layout: "admin",
            title: 'Database - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/clp-reflection/:id",
        name: "CLP-Reflection",
        component: () => import("./components/itemGuru/clpReflectionView.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: 'Reflection Class Learning Plan - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/edit-learning-reflection/:id",
        name: "Edit-Learning-Reflection",
        component: () => import("./dashboard/guru/EditRpk2.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: "Update Learning Reflection - Metschoo Integrated Learning System"
        }
    },
    {
        path: "/clp-admin",
        name: "CLP-Admin",
        component: () => import("./dashboard/admin/RPKAdmin.vue"),
        meta: {
            requiresAuth: true,
            role: "admin",
            layout: "admin",
            title: 'Class Learning Plan - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/learning-reflection-admin",
        name: "Learning-Reflection-Admin",
        component: () => import("./dashboard/admin/LearningReflectionAdmin.vue"),
        meta: {
            requiresAuth: true,
            role: "admin",
            layout: "admin",
            title: 'Learning Reflection - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/clp/:id",
        name: "CLP",
        component: () => import("./dashboard/admin/clpItem/clp.vue"),
        meta: {
            requiresAuth: true,
            role: "admin",
            layout: "admin",
            title: 'Class Learning Plan - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/learning-reflection/:id",
        name: "Learning-Reflection",
        component: () => import("./dashboard/admin/clpItem/learningReflection.vue"),
        meta: {
            requiresAuth: true,
            role: "admin",
            layout: "admin",
            title: 'Learning Reflection- Metschoo Integrated Learning System'
        }
    },
    {
        path: "/clp-view/:id",
        name: "CLP-View",
        component: () => import("./dashboard/admin/clpItem/clpView.vue"),
        meta: {
            requiresAuth: true,
            role: "admin",
            layout: "admin",
            title: 'Class Learning Plan - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/Reflection-view/:id",
        name: "Reflection-View",
        component: () => import("./dashboard/admin/clpItem/learningReflectionView.vue"),
        meta: {
            requiresAuth: true,
            role: "admin",
            layout: "admin",
            title: 'Class Learning Plan - Metschoo Integrated Learning System'
        }
    },

    {
        path: "/mobile-unavailable",
        name: "Mobile-Unavailable",
        component: () => import("./views/MobileUnavailable.vue")
    },
    {
        path: "/add-teacher-account",
        name: "Add-Teacher-Account",
        component: () => import("./dashboard/admin/AddTeacherAcc.vue"),
        meta: {
            requiresAuth: true,
            role: "admin",
            layout: "admin",
            title: 'Add Teacher Account - Metschoo Integrated Learning System'
        }
    },
    {
        path: "/maintenance",
        name: "maintenance",
        component: () => import("./views/maintanance.vue"),
        props: route => ({
            title: route.query.title,
            message: route.query.message
        }),
        meta: {
            layout: "none"
        }
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// navigation guard
router.beforeEach(async (to, from, next) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (to.name !== "maintenance") {
        try {
            const res = await api.get("/maintenance");

            if (res.data?.is_active) {
                return next({
                    name: "maintenance"
                });
            }
        } catch (err) {
            // kalau API maintenance error → jangan block user
            console.error("Maintenance check failed");
        }
    }

    const tempToken = localStorage.getItem("tempToken");
    const pending = localStorage.getItem("pendingVerification");
    const isVerified = localStorage.getItem("is_verified");

    // if (pending === "true" || isVerified === "false") {
    //     if (to.path !== "/verify-code") {
    //         return next("/verify-code")
    //     }
    //     return next();
    // }

    // if (to.path === "/verify-code" && isVerified === "true") {
    //     if (role === "student") return next("/home-student");
    //     if (role === "teacher") return next("/home-teacher");
    //     if (role === "admin") return next("/home-admin");
    //     return next("/");
    // }

    if (to.meta.requiresAuth) {
        if (!token) {
            return next("/");
        }
    }

    // kalau route ada rule role, tapi role user beda → lempar ke dashboard sesuai role dia
    if (to.meta.role && role !== to.meta.role) {
        if (role === "student") return next("/home-student");
        if (role === "teacher") return next("/home-teacher"); // FIXED
        if (role === "admin") return next("/home-admin");
        return next("/");
    }

    next();
});

export default router; 