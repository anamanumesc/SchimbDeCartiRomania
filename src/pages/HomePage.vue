<template>
  <div class="home-page">
    <!-- Secțiunea de filtre și lista de cărți -->
    <div class="content">
      <BookFilters @filters-applied="applyFilters" />
      <BookList :books="filteredBooks" :filters="filters" />
    </div>
  </div>
</template>

<script>
import BookFilters from '@/components/BookFilters.vue';
import BookList from '@/components/BookList.vue';

export default {
  name: 'HomePage',
  components: {
    BookFilters,
    BookList,
  },
  data() {
    return {
      filters: {
        county: 'all',
        city: 'all',
        genre: 'all',
        condition: 'all',
      },
      books: [
        { id: 1, title: 'Cartea 1', author: 'Autor 1', county: 'București', city: 'Sector 1', genre: 'thriller', condition: 'noua', imageUrl: 'https://via.placeholder.com/200' },
        { id: 2, title: 'Cartea 2', author: 'Autor 2', county: 'Cluj', city: 'Cluj-Napoca', genre: 'romance', condition: 'foarte_buna', imageUrl: 'https://via.placeholder.com/200' },
        // Adăugați mai multe cărți aici
      ],
      filteredBooks: [], // Adăugat pentru a stoca cărțile filtrate
    };
  },
  methods: {
    applyFilters(filters) {
      this.filters = filters;
      // Aplică filtrele pe lista de cărți
      this.filteredBooks = this.books.filter(book => {
        return (filters.county === 'all' || book.county === filters.county) &&
               (filters.city === 'all' || book.city === filters.city) &&
               (filters.genre === 'all' || book.genre === filters.genre) &&
               (filters.condition === 'all' || book.condition === filters.condition);
      });
    },
  },
  created() {
    // La început, setează filteredBooks cu toate cărțile
    this.filteredBooks = this.books;
  },
};
</script>

<style scoped>
.home-page {
  background-color: #f9f9f9;
  min-height: 100vh;
}

.content {
  padding: 20px;
  margin-top: 60px; /* pentru a da spațiu sub meniu */
}
</style>
