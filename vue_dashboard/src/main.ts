import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import router from './router/index'
import { setupAxiosInterceptors } from './plugins/axios'
import { useAuthStore } from './Store/AuthStore'







const vuetify = createVuetify({ components, directives })
const pinia = createPinia()


const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(vuetify)

app.mount('#app')


setupAxiosInterceptors(() => {
	try {
		return useAuthStore()
	} catch (e) {
		return null
	}
}, router)

// Listen for logout events from other tabs to sync logout state
if (typeof window !== 'undefined') {
	window.addEventListener('storage', (ev) => {
		if (ev.key === 'app.logout') {
			try {
				router.push({ name: 'login', query: { sessionExpired: '1' } })
			} catch (e) {
				// ignore
			}
		}
	})
}
