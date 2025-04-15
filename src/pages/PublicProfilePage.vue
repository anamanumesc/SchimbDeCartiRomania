<template>
  <div class="profile">
    <h2>Profilul lui {{ user.username }}</h2>
    <p><strong>Email:</strong> {{ user.email }}</p>

    <h3>Cărți postate:</h3>
    <div v-if="user.books.length">
      <div v-for="book in user.books" :key="book.id" class="book-card">
        <img :src="book.imageUrl" alt="carte" />
        <p><strong>{{ book.title }}</strong> de {{ book.author }}</p>
        <router-link :to="'/book/' + book.id">Vezi detalii</router-link>
        <button @click="proposeExchange(book.id)">Propune schimbul</button>
      </div>
    </div>
    <div v-else>
      <p>Acest utilizator nu a postat nicio carte.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PublicProfilePage',
  data() {
    return {
      user: {
        username: '',
        email: '',
        books: []
      }
    };
  },
  created() {
    const userId = this.$route.params.id;
    this.fetchUser(userId);
  },
  methods: {
    fetchUser(id) {
      // Mock user + cărți. În realitate faci un API call aici.
      const allUsers = [
        {
          id: 123,
          username: 'user1',
          email: 'user1@email.com',
          books: [
            { id: 1, title: 'Cartea 1', author: 'Autor 1', imageUrl: 'https://via.placeholder.com/150' },
            { id: 3, title: 'Cartea 3', author: 'Autor 3', imageUrl: 'https://via.placeholder.com/150' }
          ]
        },
        {
          id: 124,
          username: 'user2',
          email: 'user2@email.com',
          books: []
        }
      ];

      const found = allUsers.find(u => u.id == id);
      if (found) this.user = found;
    },
    proposeExchange(bookId) {
      alert(`Ai propus schimbul pentru cartea #${bookId}`);
    }
  }
};
</script>

<style scoped>
.profile {
  padding: 20px;
}

.book-card {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ccc;
}

.book-card img {
  width: 100px;
  height: auto;
  border-radius: 5px;
}
</style>
