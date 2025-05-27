<template>
  <div class="exchange-page">
    <h1>Propune un schimb</h1>
    
    <div v-if="targetBook" class="target-book-info">
      <h3>Carte dorită:</h3>
      <div class="book-preview">
        <img :src="targetBook.imageUrl" :alt="targetBook.title" class="book-image" />
        <div class="book-details">
          <h4>{{ targetBook.title }}</h4>
          <p><strong>Autor:</strong> {{ targetBook.author }}</p>
          <p><strong>Proprietar:</strong> {{ targetBook.userName }}</p>
        </div>
      </div>
    </div>

    <form @submit.prevent="submitExchangeRequest" class="exchange-form">
      <div class="form-section">
        <label>Ce carte/cărți propui la schimb:</label>
        <div v-if="myBooks.length" class="books-list">
          <div v-for="book in myBooks" :key="book.id" class="checkbox-book">
            <input
              type="checkbox"
              :id="'book-' + book.id"
              :value="book.id"
              v-model="selectedBookIds"
            />
            <label :for="'book-' + book.id" class="book-label">
              <img :src="book.imageUrl" :alt="book.title" class="book-thumbnail" />
              <div class="book-info">
                <strong>{{ book.title }}</strong>
                <span>de {{ book.author }}</span>
              </div>
            </label>
          </div>
        </div>
        <div v-else-if="!loading" class="no-books">
          <p>Nu ai cărți adăugate în cont.</p>
          <router-link to="/add" class="add-book-link">Adaugă o carte</router-link>
        </div>
        <div v-if="loading" class="loading">Se încarcă cărțile tale...</div>
      </div>

      <div class="form-section">
        <label for="message">Mesaj pentru utilizator:</label>
        <textarea
          id="message"
          v-model="message"
          placeholder="Scrie un mesaj pentru proprietarul cărții..."
          rows="4"
        ></textarea>
      </div>

      <div class="form-actions">
        <button 
          type="button" 
          @click="goBack" 
          class="cancel-btn"
        >
          Anulează
        </button>
        <button 
          type="submit" 
          class="submit-btn"
          :disabled="selectedBookIds.length === 0 || submitting"
        >
          {{ submitting ? 'Se trimite...' : 'Trimite cererea' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "ProposeExchangePage",
  data() {
    return {
      myBooks: [],
      selectedBookIds: [],
      message: "",
      targetBook: null,
      loading: false,
      submitting: false
    };
  },
  async created() {
    await this.fetchTargetBook();
    await this.fetchMyBooks();
  },
  methods: {
    async fetchTargetBook() {
      try {
        const bookId = this.$route.params.id;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/books/${bookId}`);
        this.targetBook = response.data;
      } catch (error) {
        console.error('Error fetching target book:', error);
        this.$router.push('/'); // Redirecționează dacă cartea nu există
      }
    },

    async fetchMyBooks() {
      try {
        this.loading = true;
        const token = localStorage.getItem('token');
        
        if (!token) {
          this.$router.push('/login');
          return;
        }

        const response = await axios.get(`${process.env.VUE_APP_API_URL}/books/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        this.myBooks = response.data;
      } catch (error) {
        console.error('Error fetching user books:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          this.$router.push('/login');
        }
      } finally {
        this.loading = false;
      }
    },

    async submitExchangeRequest() {
      if (this.selectedBookIds.length === 0) {
        alert('Te rog să selectezi cel puțin o carte pentru schimb.');
        return;
      }

      try {
        this.submitting = true;
        const token = localStorage.getItem('token');
        
        const exchangeData = {
          requestedBookId: parseInt(this.$route.params.id),
          offeredBookIds: this.selectedBookIds,
          message: this.message
        };

        await axios.post(`${process.env.VUE_APP_API_URL}/exchanges`, exchangeData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        alert('Cererea de schimb a fost trimisă cu succes!');
        this.$router.push(`/book/${this.$route.params.id}`);
        
      } catch (error) {
        console.error('Error submitting exchange request:', error);
        
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          this.$router.push('/login');
        } else if (error.response?.data?.error) {
          alert(error.response.data.error);
        } else {
          alert('A apărut o eroare la trimiterea cererii. Te rog să încerci din nou.');
        }
      } finally {
        this.submitting = false;
      }
    },

    goBack() {
      this.$router.push(`/book/${this.$route.params.id}`);
    }
  }
};
</script>

<style scoped>
.exchange-page {
  max-width: 800px;
  margin: 40px auto;
  background: #fff;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.target-book-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.target-book-info h3 {
  margin-bottom: 15px;
  color: #333;
}

.book-preview {
  display: flex;
  align-items: center;
  gap: 15px;
}

.book-image {
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.book-details h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.book-details p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.exchange-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-section {
  display: flex;
  flex-direction: column;
}

.form-section label {
  font-weight: bold;
  margin-bottom: 10px;
  color: #555;
}

.books-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
}

.checkbox-book {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.checkbox-book:hover {
  background-color: #f8f9fa;
}

.checkbox-book input {
  margin-right: 12px;
  transform: scale(1.2);
}

.book-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
}

.book-thumbnail {
  width: 50px;
  height: 75px;
  object-fit: cover;
  border-radius: 6px;
}

.book-info {
  display: flex;
  flex-direction: column;
}

.book-info strong {
  color: #333;
  margin-bottom: 2px;
}

.book-info span {
  color: #666;
  font-size: 14px;
}

.no-books {
  text-align: center;
  padding: 40px;
  color: #666;
}

.add-book-link {
  display: inline-block;
  margin-top: 15px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.add-book-link:hover {
  background-color: #0056b3;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

textarea {
  resize: vertical;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 14px;
  font-family: inherit;
  min-height: 100px;
}

textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-top: 10px;
}

.cancel-btn {
  padding: 12px 24px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

.submit-btn {
  padding: 12px 24px;
  background-color: #ff5722;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background-color: #e64a19;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>