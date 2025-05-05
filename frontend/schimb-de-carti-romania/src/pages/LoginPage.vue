<template>
  <div class="login-page">
    <h1>Autentificare</h1>
    <form @submit.prevent="login" class="login-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          v-model="email"
          placeholder="Introdu email-ul"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Parolă</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="Introdu parola"
          required
        />
      </div>

      <div class="form-group">
        <button type="submit" :disabled="loading">
          {{ loading ? 'Se procesează...' : 'Autentificare' }}
        </button>
      </div>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </form>
    <p>Nu ai cont? <router-link to="/signup">Înregistrează-te aici</router-link></p>
    <p>
      <router-link to="/forgot-password">Ai uitat parola?</router-link>
    </p>
  </div>
</template>

<script>
import { loginUser } from '@/services/auth';

export default {
  name: 'LoginPage',
  data() {
    return {
      email: '',
      password: '',
      errorMessage: '',
      loading: false
    };
  },
  methods: {
    async login() {
      try {
        this.loading = true;
        this.errorMessage = '';
        
        console.log("Sending login request with:", { 
          email: this.email, 
          password: this.password.substring(0, 3) + "..." // nu afișa parola întreagă
        });

        await loginUser({ 
          email: this.email, 
          password: this.password 
        });
        
        // Dacă autentificarea a reușit (nu a aruncat eroare)
        this.$router.push('/');
      } catch (error) {
        if (error.response && error.response.data) {
          this.errorMessage = error.response.data.error || 'Autentificare eșuată';
        } else {
          this.errorMessage = 'A apărut o eroare. Te rugăm să încerci din nou.';
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f9f9f9;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.login-form {
  width: 100%;
  max-width: 400px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: bold;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  margin-top: 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>
