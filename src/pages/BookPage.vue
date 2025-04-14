<template>
  <div class="book-page">
    <div v-if="book">
      <img :src="book.imageUrl" alt="Cartea" class="book-image" />
      <h2>{{ book.title || 'Nespecificat' }}</h2>
      <p><strong>Autor:</strong> {{ book.author || 'Nespecificat' }}</p>
      <p><strong>Gen:</strong> {{ book.genre || 'Oricare' }}</p>
      <p><strong>Stare:</strong> {{ book.condition || 'Oricare' }}</p>
      <p><strong>Oraș:</strong> {{ book.city || 'Oriunde' }}</p>
      <p><strong>Județ:</strong> {{ book.county || 'Oricare' }}</p>
      
      <!-- Descriere optională -->
      <p v-if="book.description"><strong>Descriere:</strong> {{ book.description }}</p>

      <!-- Informații despre utilizator -->
      <p><strong>Propus de:</strong> <router-link :to="'/profile/' + book.userId">{{ book.username }}</router-link></p>

      <!-- Buton Propune schimbul -->
      <button class="exchange-button" @click="proposeExchange">Propune schimbul!</button>
    </div>
    <div v-else>
      <p>Cartea nu a fost găsită.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BookPage',
  data() {
    return {
      book: null,
    };
  },
  created() {
    const bookId = this.$route.params.id; // Obținem ID-ul cărții din URL
    this.fetchBookDetails(bookId);
  },
  methods: {
    fetchBookDetails(id) {
      // Exemplu de date; în practică, aici vei face un API call pentru a obține cartea
      const books = [
        { 
          id: 1, title: 'Cartea 1', author: 'Autor 1', county: 'București', city: 'Sector 1', genre: 'thriller', 
          condition: 'noua', imageUrl: 'https://via.placeholder.com/200', description: 'O carte interesantă.', 
          userId: 123, username: 'user1' 
        },
        { 
          id: 2, title: 'Cartea 2', author: 'Autor 2', county: 'Cluj', city: 'Cluj-Napoca', genre: 'romance', 
          condition: 'foarte_buna', imageUrl: 'https://via.placeholder.com/200', description: 'O poveste de dragoste.', 
          userId: 124, username: 'user2' 
        },
        // Adăugați mai multe cărți
      ];

      this.book = books.find(book => book.id === parseInt(id));
    },
    proposeExchange() {
      alert('Ai propus schimbul pentru această carte!');
    }
  },
};
</script>

<style scoped>
.book-page {
  padding: 20px;
  background-color: #f9f9f9;
}

.book-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.exchange-button {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.exchange-button:hover {
  background-color: #218838;
}
</style>
