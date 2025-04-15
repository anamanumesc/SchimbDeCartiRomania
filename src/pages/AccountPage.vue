<template>
  <div class="account-page">
    <h1>Contul Meu</h1>

    <div class="account-details">
      <h2>Detalii personale</h2>
      <p><strong>Nume:</strong> {{ user.name }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>Data înregistrării:</strong> {{ user.registrationDate }}</p>

      <div class="location">
        <p v-if="!isEditingLocation"><strong>Locație publică:</strong> {{ user.city }}, {{ user.county }}</p>
        <div v-else>
          <label for="city">Oraș:</label>
          <input type="text" v-model="user.city" id="city" placeholder="Introdu orașul tău" />
          
          <label for="county">Județ:</label>
          <input type="text" v-model="user.county" id="county" placeholder="Introdu județul tău" />
        </div>
        <button @click="toggleEditLocation">{{ isEditingLocation ? 'Salvează locația' : 'Editează locația' }}</button>
      </div>
    </div>

    <!-- Secțiune contact preferat -->
    <div v-if="user.contactMethod">
      <h3>Modul preferat de contact:</h3>
      <p>{{ user.contactMethod }}</p>
    </div>

    <div class="account-actions">
      <h2>Acțiuni cont</h2>
      <button @click="changePassword">Schimbă parola</button>
      <button @click="updatePreferences">Actualizează preferințele</button>
      <button @click="logout">Deconectare</button>
    </div>

    <div class="user-books">
      <h2>Cărțile mele</h2>
      <button class="add-button" @click="addBook">Adaugă carte nouă</button>
      <div v-if="books.length" class="books-list">
        <div v-for="book in books" :key="book.id" class="book-card">
          <img :src="book.imageUrl" alt="carte" />
          <div class="book-info">
            <h3>{{ book.title }}</h3>
            <p><strong>Autor:</strong> {{ book.author }}</p>
            <p><strong>Gen:</strong> {{ book.genre }}</p>
          </div>
          <div class="book-actions">
            <button @click="editBook(book.id)">Editează</button>
            <button class="delete" @click="deleteBook(book.id)">Șterge</button>
          </div>
        </div>
      </div>
      <p v-else>Nu ai postat nicio carte.</p>
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
        contactMethod: 'WhatsApp: 123456789',
        city: 'București',  // Orașul utilizatorului
        county: 'Ilfov',    // Județul utilizatorului
      },
      isEditingLocation: false,  // Control pentru editarea locației
      books: [
        {
          id: 1,
          title: 'Cartea 1',
          author: 'Autor 1',
          genre: 'Thriller',
          imageUrl: 'https://via.placeholder.com/150',
        },
        {
          id: 2,
          title: 'Cartea 2',
          author: 'Autor 2',
          genre: 'Romance',
          imageUrl: 'https://via.placeholder.com/150',
        },
      ],
    };
  },
  methods: {
    toggleEditLocation() {
      if (this.isEditingLocation) {
        this.saveLocation();  // Salvează locația când se oprește editarea
      }
      this.isEditingLocation = !this.isEditingLocation;
    },
    saveLocation() {
      alert('Locația a fost salvată!');
      // Logica de salvare a locației (API sau localStorage)
    },
    changePassword() {
      alert('Funcționalitate de schimbare a parolei.');
    },
    updatePreferences() {
      alert('Funcționalitate de actualizare preferințe.');
    },
    logout() {
      alert('Te-ai deconectat cu succes.');
    },
    addBook() {
      this.$router.push('/add');
    },
    editBook(id) {
      this.$router.push(`/edit/${id}`);
    },
    deleteBook(id) {
      if (confirm('Ești sigur că vrei să ștergi această carte?')) {
        this.books = this.books.filter(book => book.id !== id);
      }
    },
  },
};
</script>

<style scoped>
.account-page {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.account-details,
.account-actions,
.user-books {
  background-color: #fff;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

button {
  padding: 10px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 10px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #0056b3;
}

.delete {
  background-color: #dc3545;
}

.delete:hover {
  background-color: #b02a37;
}

.add-button {
  margin-bottom: 15px;
  background-color: #28a745;
}

.add-button:hover {
  background-color: #218838;
}

.books-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.book-card {
  display: flex;
  gap: 16px;
  background: #fafafa;
  padding: 16px;
  border-radius: 10px;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.book-card img {
  width: 100px;
  height: auto;
  border-radius: 8px;
}

.book-info {
  flex: 1;
}

.book-actions button {
  margin-right: 8px;
}

.location {
  margin-top: 20px;
}

.location input {
  padding: 8px;
  margin: 10px 0;
  width: 100%;
  border-radius: 6px;
  border: 1px solid #ccc;
}
</style>
