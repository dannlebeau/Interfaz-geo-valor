import 'leaflet/dist/leaflet.css'
import './style.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import { iniciarStore } from './store.js'

iniciarStore().then(() => createApp(App).use(router).mount('#app'))
