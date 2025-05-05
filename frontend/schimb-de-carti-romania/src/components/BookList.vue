<template>
  <div class="book-list">
    <div v-if="books.length > 0" class="books-container">
      <div v-for="book in books" :key="book.id" class="book-item">
        <div class="book-image">
          <img :src="book.imageUrl || defaultImage" alt="Book Cover" />
        </div>
        <div class="book-details">
          <h3>{{ book.title || 'Title not specified' }}</h3>
          <p class="author">{{ book.author || 'Author not specified' }}</p>
          <p class="location">
            <span class="label">Location:</span> 
            {{ book.city && book.city !== 'all' ? book.city + ', ' : '' }}
            {{ book.county && book.county !== 'all' ? book.county : 'Any location' }}
          </p>
          <p class="genre">
            <span class="label">Genre:</span> 
            {{ book.genre || 'Any genre' }}
          </p>
          <p class="condition">
            <span class="label">Condition:</span> 
            {{ book.condition || 'Any condition' }}
          </p>
          <router-link :to="`/book/${book.id}`" class="details-link">
            <button>View Details</button>
          </router-link>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>No books available.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BookList',
  props: {
    books: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      defaultImage: '/placeholder-book.jpg' // Provide a default placeholder image
    };
  }
};
</script>

<style scoped>
.book-list {
  padding: 20px 0;
}

.books-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 25px;
  margin-top: 20px;
}

.book-item {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.book-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.book-image {
  height: 200px;
  overflow: hidden;
}

.book-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.book-item:hover .book-image img {
  transform: scale(1.05);
}

.book-details {
  padding: 15px;
}

.book-details h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 1.2rem;
  color: #333;
  height: 3em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.book-details p {
  margin: 6px 0;
  color: #666;
  font-size: 0.9rem;
}

.label {
  font-weight: 600;
  color: #444;
}

.author {
  font-style: italic;
  margin-bottom: 12px !important;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 15px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #2980b9;
}

.empty-state {
  text-align: center;
  padding: 50px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.empty-state p {
  color: #666;
  font-size: 1.1rem;
}
</style>