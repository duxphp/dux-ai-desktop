import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { setupNativeAppMenu } from './lib/native-menu'
import { initSystemTheme } from './lib/theme'
import './styles.css'

initSystemTheme()
void setupNativeAppMenu()

const app = createApp(App)

app.use(createPinia())
app.mount('#app')
