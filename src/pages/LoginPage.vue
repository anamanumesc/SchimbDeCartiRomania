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
        <button type="submit">Autentificare</button>
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
export default {
  name: 'LoginPage',
  data() {
    return {
      email: '',
      password: '',
      errorMessage: '', // Mesaj de eroare pentru validare
    };
  },
  methods: {
    login() {
      // Logica de autentificare - aceasta poate fi conectată la un backend real
      if (this.email === 'user@example.com' && this.password === 'password123') {
        // Dacă autentificarea este validă
        alert('Autentificare reușită!');
        this.$router.push('/'); // Redirecționează utilizatorul la pagina de home
      } else {
        // Dacă datele nu sunt corecte
        this.errorMessage = 'Email sau parolă incorecte. Te rog încearcă din nou.';
      }
    },
  },
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

.error {
  color: red;
  margin-top: 10px;
}
</style>
