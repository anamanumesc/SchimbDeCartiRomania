<template>
  <div class="home-page">
    <div class="content">
      <div v-if="loading" class="loading">
        <p>Loading books...</p>
      </div>
      <div v-else>
        <BookFilters @filters-applied="applyFilters" />
        
        <!-- Toggle between map and list views -->
        <div class="view-toggle">
          <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
            Lista cărților
          </button>
          <button :class="{ active: viewMode === 'map' }" @click="viewMode = 'map'">
            Harta cărților
          </button>
        </div>
        
        <!-- Conditional rendering based on view mode -->
        <div v-if="filteredBooks.length === 0 && viewMode === 'list'" class="no-books">
          <p>No books found matching your filters. Try different criteria.</p>
        </div>
        <BookList v-else-if="viewMode === 'list'" :books="filteredBooks" />
        <MapView v-else-if="viewMode === 'map'" />
      </div>
    </div>
  </div>
</template>

<script>
import BookFilters from '@/components/BookFilters.vue';
import BookList from '@/components/BookList.vue';
import MapView from '@/components/MapView.vue';
import { getBooks } from '@/services/api';

export default {
  name: 'HomePage',
  components: { BookFilters, BookList, MapView },
  data() {
    return {
      filters: { county: 'all', city: 'all', genre: 'all', condition: 'all' },
      filteredBooks: [],
      loading: false,
      error: null,
      viewMode: 'list' // Default to list view
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

/* Add this to your existing styles */
.view-toggle {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.view-toggle button {
  padding: 10px 20px;
  margin: 0 10px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.view-toggle button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}
</style>