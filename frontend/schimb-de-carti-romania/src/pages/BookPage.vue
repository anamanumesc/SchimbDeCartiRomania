<template>
  <div class="book-page">
    <div v-if="book" class="book-card">
      <img :src="book.imageUrl" alt="Cartea" class="book-image" />
      <h2>{{ book.title || 'Nespecificat' }}</h2>
      <p><strong>Autor:</strong> {{ book.author || 'Nespecificat' }}</p>
      <p><strong>Gen:</strong> {{ book.genre || 'Oricare' }}</p>
      <p><strong>Stare:</strong> {{ book.condition || 'Oricare' }}</p>
      <p><strong>Oraș:</strong> {{ book.city || 'Oriunde' }}</p>
      <p><strong>Județ:</strong> {{ book.county || 'Oricare' }}</p>
      <p v-if="book.description"><strong>Descriere:</strong> {{ book.description }}</p>

      <!-- Butonul de traducere -->
      <button @click="translateDescription" class="translate-button">
        Tradu descrierea în engleză
      </button>

      <!-- Afișăm descrierea tradusă dacă există -->
      <p v-if="translatedDescription" class="translated">
        <strong>Descriere tradusă:</strong> {{ translatedDescription }}
      </p>

      <p>
        <strong>Propus de:</strong>
        <router-link :to="'/profile/' + book.userId" class="user-link">
          {{ book.username }}
        </router-link>
      </p>

      <button class="exchange-button" @click="proposeExchange">
        Propune schimbul!
      </button>
    </div>
    <div v-else class="not-found">
      <p>Cartea nu a fost găsită.</p>
    </div>
  </div>
</template>

<script>
import { getBookDetails } from '@/services/api';
import axios from 'axios';

export default {
  name: 'BookPage',
  data() {
    return {
      book: null,
      translatedDescription: ''
    };
  },
  created() {
    const bookId = this.$route.params.id;
    this.fetchBookDetails(bookId);
  },
  methods: {
    async fetchBookDetails(id) {
      try {
        this.book = await getBookDetails(id);
      } catch (error) {
        console.error('Error fetching book details:', error);
      }
    },
    proposeExchange() {
      this.$router.push(`/book/${this.book.id}/propose`);
    },
    async translateDescription() {
      if (!this.book?.description) return;

      try {
        const response = await axios.post('/api/translate', {
          text: this.book.description,
          to: 'en'
        });
        this.translatedDescription = response.data.translation;
      } catch (err) {
        console.error('Eroare la traducere:', err);
        this.translatedDescription = 'Eroare la traducere.';
      }
    }
  }
};
</script>

<style scoped>
.book-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 85vh;
  background: #f0f2f5;
  padding: 20px;
}

.book-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.book-image {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 20px;
}

h2 {
  margin-bottom: 10px;
  color: #333;
}

p {
  margin: 8px 0;
  color: #555;
}

.user-link {
  color: #007bff;
  text-decoration: none;
}

.user-link:hover {
  text-decoration: underline;
}

.exchange-button {
  margin-top: 20px;
  background-color: #ff5722;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.exchange-button:hover {
  background-color: #e64a19;
}

.translate-button {
  margin-top: 15px;
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.translate-button:hover {
  background-color: #388e3c;
}

.translated {
  margin-top: 10px;
  color: #333;
  background: #eef9f0;
  padding: 10px;
  border-radius: 6px;
}

.not-found {
  text-align: center;
  font-size: 18px;
  color: #666;
}
</style>
