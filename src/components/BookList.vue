<template>
  <div class="book-list">
    <div v-if="books.length > 0">
      <div v-for="book in books" :key="book.id" class="book-item">
        <img :src="book.imageUrl" alt="Cartea" />
        <h3>{{ book.title || 'Nespecificat' }}</h3>
        <p>{{ book.author || 'Nespecificat' }}</p>
        <p>{{ book.county || 'Oriunde' }}</p>
        <p>{{ book.city || 'Oriunde' }}</p>
        <p>{{ book.genre || 'Oricare' }}</p>
        <p>{{ book.condition || 'Oricare' }}</p>
        <router-link :to="'/book/' + book.id">
          <button>Vezi detalii</button>
        </router-link>
      </div>
    </div>
    <div v-else>
      <p>No books available.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BookList',
  props: {
    books: Array,
  },
};
</script>

<style scoped>
.book-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  padding: 20px;
}

.book-item {
  background: #fff;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.book-item img {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>
