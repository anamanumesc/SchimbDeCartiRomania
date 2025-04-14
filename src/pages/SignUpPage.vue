<template>
  <div class="signup-page">
    <h1>Înregistrare</h1>
    <form @submit.prevent="signup" class="signup-form">
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
        <button type="submit">Înregistrează-te</button>
      </div>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </form>
    <p>Ai deja un cont? <router-link to="/login">Autentifică-te aici</router-link></p>
  </div>
</template>

<script>
export default {
  name: 'SignUpPage',
  data() {
    return {
      email: '',
      password: '',
      confirmPassword: '',
      errorMessage: '', // Mesaj de eroare pentru validare
    };
  },
  methods: {
    signup() {
      if (this.password !== this.confirmPassword) {
        this.errorMessage = 'Parolele nu se potrivesc. Te rog încearcă din nou.';
        return;
      }

      // Logica de înregistrare - aceasta poate fi conectată la un backend real
      alert('Înregistrare reușită!');
      this.$router.push('/login'); // Redirecționează utilizatorul la login
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

.error {
  color: red;
  margin-top: 10px;
}
</style>
