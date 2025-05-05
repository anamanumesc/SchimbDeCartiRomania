<template>
  <div class="signup-page">
    <h1>Înregistrare</h1>
    <form @submit.prevent="signup" class="signup-form">
      <div class="form-group">
        <label for="name">Nume</label>
        <input
          type="text"
          id="name"
          v-model="name"
          placeholder="Introdu numele tău"
          required
        />
      </div>

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
        <label for="confirmPassword">Confirmă Parola</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="confirmPassword"
          placeholder="Confirmă parola"
          required
        />
      </div>

      <div class="form-group">
        <button type="submit" :disabled="loading">
          {{ loading ? 'Se procesează...' : 'Înregistrează-te' }}
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </form>
    <p>Ai deja un cont? <router-link to="/login">Autentifică-te aici</router-link></p>
  </div>
</template>

<script>
import { registerUser } from '@/services/auth';

export default {
  name: 'SignUpPage',
  data() {
    return {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      error: '',
      loading: false
    };
  },
  methods: {
    async signup() {
      if (this.password !== this.confirmPassword) {
        this.error = 'Parolele nu se potrivesc. Te rog încearcă din nou.';
        return;
      }

      this.error = '';
      this.loading = true;
      
      try {
        await registerUser({
          name: this.name,
          email: this.email,
          password: this.password
        });
        this.$router.push('/'); // Redirecționează la pagina principală după înregistrare
      } catch (error) {
        if (error.response && error.response.data) {
          this.error = error.response.data.error || 'Înregistrare eșuată';
        } else {
          this.error = 'A apărut o eroare. Te rugăm să încerci din nou.';
        }
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.signup-page {
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

.signup-form {
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
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #218838;
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
