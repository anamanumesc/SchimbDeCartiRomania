<template>
  <div class="forgot-password">
    <h2>Recuperare parolă</h2>
    <form @submit.prevent="recover">
      <input type="email" v-model="email" placeholder="Emailul tău" required />
      <button type="submit">Trimite link de resetare</button>
    </form>
    <p v-if="message">{{ message }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      email: '',
      message: '',
      errorMessage: ''
    }
  },
  methods: {
    async recover() {
      try {
        // Trimite cererea către backend
        const response = await axios.post('/api/auth/forgot-password', { email: this.email });
        this.message = response.data.message || 'Dacă adresa există, vei primi un email.';
        this.errorMessage = ''; // Resetează mesajul de eroare
      } catch (error) {
        console.error('Error in recover:', error);
        this.errorMessage = error.response?.data?.error || 'A apărut o eroare. Încearcă din nou.';
        this.message = ''; // Resetează mesajul de succes
      }
    }
  }
}
</script>

<style>
.error {
  color: red;
}
</style>