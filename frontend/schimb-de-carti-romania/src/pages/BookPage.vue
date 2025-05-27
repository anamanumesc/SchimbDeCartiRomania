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

      <button @click="translateDescription" class="translate-button">
        Tradu descrierea în engleză
      </button>

      <p v-if="translatedDescription" class="translated">
        <strong>Descriere tradusă:</strong> {{ translatedDescription }}
      </p>

      <p><strong>Propus de:</strong>
        <router-link :to="'/profile/' + book.userId" class="user-link">
          {{ book.username }}
        </router-link>
      </p>

      <button class="exchange-button" @click="proposeExchange">Propune schimbul!</button>
      <button class="history-button" @click="toggleHistory">
        {{ showHistory ? 'Ascunde istoricul cărții' : 'Vizualizează istoricul cărții' }}
      </button>

      <transition name="accordion">
        <div v-show="showHistory" class="history-section">
          <h3>Istoric utilizare:</h3>
          <ul v-if="history.length">
            <li v-for="entry in history" :key="entry.username + entry.startDate">
              <p>
                <strong>{{ entry.username }}</strong> a avut cartea între
                {{ formatDate(entry.startDate) }} și {{ formatDate(entry.endDate) || 'prezent' }}
              </p>
              <p v-if="entry.review"><em>Recenzie: "{{ entry.review }}"</em></p>
              <p v-if="entry.rating">
                <span v-for="n in entry.rating" :key="n">⭐</span>
              </p>
            </li>
          </ul>
          <p v-else class="no-history-alert">Nu există istoric pentru această carte.</p>

          <div v-if="canSubmitReview" class="review-form">
            <h4>Lasă o recenzie</h4>
            <label>Rating:</label>
            <div class="star-rating">
              <span
                v-for="n in 5"
                :key="n"
                class="star"
                :class="{ filled: n <= newReview.rating }"
                @click="newReview.rating = n"
              >★</span>
            </div>
            <textarea v-model="newReview.text" placeholder="Scrie un comentariu..."></textarea>
            <button @click="submitReview">Trimite recenzia</button>
          </div>
        </div>
      </transition>
    </div>

    <div v-else class="not-found">
      <p>Se incarca...</p>
    </div>
  </div>
</template>

<script>
import { getBookDetails, getBookHistory } from '@/services/api';
import axios from 'axios';

export default {
  name: 'BookPage',
  data() {
    return {
      book: null,
      translatedDescription: '',
      showHistory: false,
      history: [],
      newReview: { rating: 0, text: '' },
      canSubmitReview: true
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
        const response = await axios.post(`${process.env.VUE_APP_API_URL}/translate`, {
          text: this.book.description,
          to: 'en'
        });
        this.translatedDescription = response.data.translation;
      } catch (err) {
        console.error('Eroare la traducere:', err);
        this.translatedDescription = 'Eroare la traducere.';
      }
    },
    async toggleHistory() {
      this.showHistory = !this.showHistory;
      if (this.showHistory && this.history.length === 0) {
        try {
          this.history = await getBookHistory(this.book.id);
        } catch (err) {
          console.error('Eroare la obținerea istoricului:', err);
        }
      }
    },
    async submitReview() {
      try {
        const userId = JSON.parse(localStorage.getItem('user')).id;
        await axios.post(`${process.env.VUE_APP_API_URL}/books/${this.book.id}/review`, {
          userId,
          rating: this.newReview.rating,
          review: this.newReview.text
        });
        alert('Recenzia a fost trimisă!');
        this.history = await getBookHistory(this.book.id);
        this.newReview = { rating: 0, text: '' };
        this.canSubmitReview = false;
      } catch (err) {
        console.error('Eroare la trimiterea recenziei:', err);
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return null;
      return new Date(dateStr).toLocaleDateString();
    }
  }
};
</script>

<style scoped>
.star-rating {
  font-size: 24px;
  cursor: pointer;
}
.star {
  color: #ccc;
}
.star.filled {
  color: #FFD700;
}
textarea {
  width: 100%;
  min-height: 60px;
  margin-top: 10px;
}
.review-form button {
  margin-top: 10px;
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
}
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
.history-button {
  margin-top: 15px;
  background-color: #2196f3;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.history-button:hover {
  background-color: #1976d2;
}
.history-section {
  margin-top: 20px;
  background: #f3f8ff;
  padding: 15px;
  border-radius: 8px;
  text-align: left;
}
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
}
.accordion-enter,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
.no-history-alert {
  font-style: italic;
  color: #888;
}
.not-found {
  text-align: center;
  font-size: 18px;
  color: #666;
}
</style>
