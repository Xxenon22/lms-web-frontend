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
            50: '{indigo.50}',
            100: '{indigo.100}',
            200: '{indigo.200}',
            300: '{indigo.300}',
            400: '{indigo.400}',
            500: '{indigo.500}',
            600: '{indigo.600}',
            700: '{indigo.700}',
            800: '{indigo.800}',
            900: '{indigo.900}',
            950: '{indigo.950}'
        },
        myButton: {
            background: '{primary.900}'
        }

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
    const defaultTitle = 'E Learning Metland School'
    document.title = to.meta.title || defaultTitle
    next()
})
app.use(router);
app.use(ToastService);
app.component('Toast', Toast);
app.component('Icon', Icon);
app.use(ConfirmationService);

app.mount('#app');