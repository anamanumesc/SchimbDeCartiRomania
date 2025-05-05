<template>
  <div class="reset-password">
    <h2>Resetare parolă</h2>
    <form @submit.prevent="resetPassword">
      <input
        type="password"
        v-model="password"
        placeholder="Parola nouă"
        required
      />
      <input
        type="password"
        v-model="confirmPassword"
        placeholder="Confirmă parola nouă"
        required
      />
      <button type="submit">Resetează parola</button>
    </form>
    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      password: "",
      confirmPassword: "",
      message: "",
      errorMessage: "",
    };
  },
  methods: {
    async resetPassword() {
      if (this.password !== this.confirmPassword) {
        this.errorMessage = "Parolele nu se potrivesc.";
        return;
      }

      try {
        const token = this.$route.query.token; // Preia token-ul din URL
        const response = await axios.post("/api/auth/reset-password", {
          token,
          newPassword: this.password,
        });
        this.message = response.data.message || "Parola a fost resetată cu succes.";
        this.errorMessage = "";
      } catch (error) {
        console.error("Eroare la resetarea parolei:", error);
        this.errorMessage =
          error.response?.data?.error || "A apărut o eroare. Încearcă din nou.";
        this.message = "";
      }
    },
  },
};
</script>

<style>
.reset-password {
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}

input {
  display: block;
  width: 100%;
  margin: 10px 0;
  padding: 10px;
}

button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

.success {
  color: green;
}

.error {
  color: red;
}
</style>