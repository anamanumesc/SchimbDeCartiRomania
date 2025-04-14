<template>
  <div class="account-page">
    <h1>Contul Meu</h1>
    <div class="account-details">
      <h2>Detalii personale</h2>
      <p><strong>Nume:</strong> {{ user.name }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>Data înregistrării:</strong> {{ user.registrationDate }}</p>
    </div>

    <div class="account-actions">
      <h2>Acțiuni cont</h2>
      <button @click="changePassword">Schimbă parola</button>
      <button @click="updatePreferences">Actualizează preferințele</button>
      <button @click="logout">Deconectare</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AccountPage',
  data() {
    return {
      user: {
        name: 'Ion Popescu',
        email: 'ion.popescu@example.com',
        registrationDate: '2023-04-01',
      },
    };
  },
  methods: {
    changePassword() {
      // Aici va fi logica pentru schimbarea parolei
      alert('Funcționalitate de schimbare a parolei.');
    },
    updatePreferences() {
      // Aici va fi logica pentru actualizarea preferințelor
      alert('Funcționalitate de actualizare preferințe.');
    },
    logout() {
      // Aici va fi logica de logout
      alert('Te-ai deconectat cu succes.');
    },
  },
};
</script>

<style scoped>
.account-page {
  padding: 20px;
  background-color: #f9f9f9;
  min-height: 100vh;
}

h1 {
  color: #333;
}

.account-details {
  background-color: #fff;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.account-actions {
  background-color: #fff;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #0056b3;
}

p {
  font-size: 16px;
  color: #555;
}

h2 {
  color: #333;
  margin-bottom: 10px;
}
</style>
