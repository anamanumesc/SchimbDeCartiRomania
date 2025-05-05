import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { verifyToken } from './services/auth'

// Verificăm token-ul la pornirea aplicației
const validateAuth = async () => {
  try {
    if (localStorage.getItem('token')) {
      const result = await verifyToken();
      if (!result.valid) {
        // Token invalid, redirect to login
        router.push('/login');
      }
    }
  } catch (e) {
    console.error('Auth validation error:', e);
  }
};

validateAuth();

createApp(App)
  .use(router)
  .mount('#app')
