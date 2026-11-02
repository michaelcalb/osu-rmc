import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

window.addEventListener('vite:preloadError', () => window.location.reload())

createApp(App).use(router).mount('#app')
