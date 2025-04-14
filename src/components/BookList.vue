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
  display: flex;
  flex-wrap: wrap;
}

.book-item {
  width: 200px;
  margin: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.book-item img {
  width: 100%;
  height: auto;
  border-radius: 8px;
}
</style>
