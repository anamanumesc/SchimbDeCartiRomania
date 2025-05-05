<template>
  <div class="home-page">
    <div class="content">
      <div v-if="loading" class="loading">
        <p>Loading books...</p>
      </div>
      <div v-else>
        <BookFilters @filters-applied="applyFilters" />
        <div v-if="filteredBooks.length === 0" class="no-books">
          <p>No books found matching your filters. Try different criteria.</p>
        </div>
        <BookList v-else :books="filteredBooks" />
      </div>
    </div>
  </div>
</template>

<script>
import BookFilters from '@/components/BookFilters.vue';
import BookList from '@/components/BookList.vue';
import { getBooks } from '@/services/api';

export default {
  name: 'HomePage',
  components: { BookFilters, BookList },
  data() {
    return {
      filters: { county: 'all', city: 'all', genre: 'all', condition: 'all' },
      filteredBooks: [],
      loading: false,
      error: null
    };
  },
  methods: {
    async applyFilters(filters) {
      this.filters = filters;
      await this.fetchBooks(filters);
    },
    async fetchBooks(filters = {}) {
      try {
        this.loading = true;
        this.error = null;
        const books = await getBooks(filters);
        this.filteredBooks = books;
      } catch (err) {
        console.error('Error fetching books:', err);
        this.error = 'Failed to load books. Please try again later.';
        this.filteredBooks = [];
      } finally {
        this.loading = false;
      }
    }
  },
  created() {
    // Fetch all books when the component is created
    this.fetchBooks();
  }
};
</script>

<style scoped>
.home-page { 
  background: #f9f9f9; 
  min-height: 100vh; 
}

.content { 
  padding: 20px; 
  margin-top: 60px; 
}

.loading, .no-books {
  text-align: center;
  padding: 40px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

.no-books p {
  color: #666;
  font-size: 1.1rem;
}
</style>