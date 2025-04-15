<template>
  <div class="forgot-password">
    <h2>Recuperare parolă</h2>
    <form @submit.prevent="recover">
      <input type="email" v-model="email" placeholder="Emailul tău" required />
      <button type="submit">Trimite link de resetare</button>
    </form>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      message: ''
    }
  },
  methods: {
    recover() {
      // Aici integrezi ulterior un backend real
      this.message = `Dacă adresa există, vei primi un email la ${this.email}.`;
    }
  }
}
</script>
