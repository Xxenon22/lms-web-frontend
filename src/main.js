import { createApp } from 'vue'
import { Icon } from "@iconify/vue"
import { definePreset } from "@primevue/themes";
import './style.css'
import App from './App.vue'
import Aura from '@primeuix/themes/aura';
import PrimeVue from "primevue/config";
import router from './router'
import "primeicons/primeicons.css";
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Toast from 'primevue/toast';

const app = createApp(App);

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{emerald.50}',
            100: '{emerald.100}',
            200: '{emerald.200}',
            300: '{emerald.300}',
            400: '{emerald.400}',
            500: '{emerald.500}',
            600: '{emerald.600}',
            700: '{emerald.700}',
            800: '{emerald.800}',
            900: '{emerald.900}',
            950: '{emerald.950}'
        },

    },
    components: {
        button: {
            background: "{my.button.background}"
        }
    }
});
app.use(PrimeVue, {
    theme: {
        preset: MyPreset,
        options: {
            prefix: 'p',
            darkModeSelector: 'system',
            cssLayer: false
        }
    }
});

router.beforeEach((to, from, next) => {
    const defaultTitle = 'Metschoo Integrated Learning System'
    document.title = to.meta.title || defaultTitle
    next()
})
app.use(router);
app.use(ToastService);
app.component('Toast', Toast);
app.component('Icon', Icon);
app.use(ConfirmationService);

app.mount('#app');