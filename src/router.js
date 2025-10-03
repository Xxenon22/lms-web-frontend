import { createWebHistory, createRouter } from 'vue-router'
import Signin from './components/login/SignIn.vue'

const routes = [

    {
        path: '/',
        component: Signin,
        name: "SignIn",
        meta: {
            title: 'Sign in - E Learning Metland School'
        }
    },
    {
        path: '/sign-up',
        component: () => import("./components/login/SignUp.vue"),
        name: "SignUp",
        meta: {
            title: 'Sign up - E Learning Metland School'
        }
    },
    {
        path: "/home-admin",
        component: () => import("./dashboard/admin/DashboardAdmin.vue"),
        meta: {
            requiresAuth: true,
            role: "admin",
            layout: "admin",
            title: 'Admin - E Learning Metland School'
        },
    },
    {
        path: "/home-teacher",
        component: () => import("./dashboard/guru/DashboardGuru.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: 'Home - E Learning Metland School'
        },
    },
    {
        path: "/home-student",
        component: () => import("./dashboard/siswa/DashboardSiswa.vue"),
        meta: {
            requiresAuth: true,
            role: "student",
            layout: "student",
            title: 'Home - E Learning Metland School'
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
            title: "Classroom - E Learning Metland School"
        }
    },
    {
        path: "/assignments",
        name: "Assignments",
        component: () => import("./dashboard/guru/KelolaMateri.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: "Assignment - E Learning Metland School"
        }
    },
    {
        path: "/develope-course-content",
        name: "Develope-Course-Content",
        component: () => import("./dashboard/guru/KelolaTugas.vue"),
        meta: {
            requiresAuth: true,
            role: "teacher",
            layout: "teacher",
            title: 'Develope Course Content - E Learning Metland School'
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
            title: "Classroom Management - E Learning Metland School"
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
            title: "Detailed Learning Materials - E Learning Metland School"
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
            title: 'Join Classroom - E Learning Metland School'
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
            title: "Edit Assignment - E Learning Metland School"
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
            title: "Admin - E Learning Metland School"
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
            title: "Student Profile - E Learning Metland School"
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
            title: "Teacher Profile - E Learning Metland School"
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
            title: "Class Learning Plan -  E Learning Metland School"
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
            title: "Learning Reflection - E Learning Metland School"
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
            title: "Update Class Learning Plan - E Learning Metland School"
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
            title: 'Class Learning Plan - E Learning Metland School'
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
            title: "Interactive Forum - E Learning Metland School"
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
            title: "Assignment List - E Learning Metland School"
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
            title: 'View Student Answer - E Learning Metland School'
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
            title: 'Add New Timetable - E Learning Metland School'
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
            title: 'Timetable - E Learning Metland School'
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
            title: 'Timetable - E Learning Metland School'
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
            title: 'Assignment Review - E Learning Metland School'
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
            title: 'Assignment List - E Learning Metland School'
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
            title: 'Database - E Learning Metland School'
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
            title: 'Reflection Class Learning Plan - E Learning Metland School'
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
            title: "Update Learning Reflection - E Learning Metland School"
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
            title: 'Class Learning Plan - E Learning Metland School'
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
            title: 'Learning Reflection - E Learning Metland School'
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
            title: 'Class Learning Plan - E Learning Metland School'
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
            title: 'Learning Reflection- E Learning Metland School'
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
            title: 'Class Learning Plan - E Learning Metland School'
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
            title: 'Class Learning Plan - E Learning Metland School'
        }
    },

    {
        path: "/mobile-unavailable",
        name: "Mobile-Unavailable",
        component: () => import("./views/MobileUnavailable.vue")
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// navigation guard
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // kalau butuh login tapi belum ada token → balik ke login
    if (to.meta.requiresAuth && !token) {
        return next("/");
    }

    // kalau route ada rule role, tapi role user beda → lempar ke dashboard sesuai role dia
    if (to.meta.role && role !== to.meta.role) {
        if (role === "student") return next("/home-student");
        if (role === "teacher") return next("/home-guru");
        if (role === "admin") return next("/home-admin");
        return next("/"); // fallback
    }

    next();
});

export default router; 