<template>
  <div id="app">
    <!-- Meniul sus, va apărea doar dacă nu suntem pe pagina de login -->
    <AppMenu v-if="!isLoginPage" />

    
    <!-- Conținutul paginilor -->
    <router-view />
  </div>
</template>

<script>
import AppMenu from './components/AppMenu.vue'

export default {
  name: 'App',
  components: {
    AppMenu
  },
  computed: {
    // Verificăm dacă ruta curentă este login
    isLoginPage() {
  const hiddenMenuRoutes = ['/login', '/signup', "/forgot-password"];
  return hiddenMenuRoutes.includes(this.$route.path);
}
  }
}
</script>

<style>
/* Stiluri pentru aplicația principală, dacă este nevoie */
#app {
  font-family: 'Arial', sans-serif;
  margin: 0;
  padding: 0;
}
</style>
