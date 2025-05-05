<template>
  <div class="account-page">
    <h1>Contul Meu</h1>

    <div v-if="loading" class="loading">
      <p>Se încarcă datele contului...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>

    <div v-else>
      <div class="account-details">
        <h2>Detalii personale</h2>
        <p><strong>Nume:</strong> {{ user.name }}</p>
        <p><strong>Email:</strong> {{ user.email }}</p>
        <p><strong>Data înregistrării:</strong> {{ formatDate(user.registrationDate) }}</p>

        <div class="location">
          <p v-if="!isEditingLocation"><strong>Locație publică:</strong> {{ user.city || 'Nespecificat' }}, {{ user.county || 'Nespecificat' }}</p>
          <div v-else>
            <label for="city">Oraș:</label>
            <input type="text" v-model="user.city" id="city" placeholder="Introdu orașul tău" />
            
            <label for="county">Județ:</label>
            <input type="text" v-model="user.county" id="county" placeholder="Introdu județul tău" />
          </div>
          <button @click="toggleEditLocation">{{ isEditingLocation ? 'Salvează locația' : 'Editează locația' }}</button>
        </div>
      </div>

      <!-- Secțiune contact preferat -->
      <div v-if="user.contactMethod">
        <h3>Modul preferat de contact:</h3>
        <p>{{ user.contactMethod }}</p>
        <button @click="isEditingContact = !isEditingContact">
          {{ isEditingContact ? 'Salvează' : 'Editează contact' }}
        </button>
        <div v-if="isEditingContact">
          <input 
            type="text" 
            v-model="user.contactMethod" 
            placeholder="Ex: WhatsApp: 0712345678"
          />
        </div>
      </div>
      <div v-else>
        <button @click="isEditingContact = true">Adaugă metodă de contact</button>
        <div v-if="isEditingContact">
          <input 
            type="text" 
            v-model="user.contactMethod" 
            placeholder="Ex: WhatsApp: 0712345678"
          />
          <button @click="saveContact">Salvează</button>
        </div>
      </div>

      <div class="account-actions">
        <h2>Acțiuni cont</h2>
        <button @click="changePassword">Schimbă parola</button>
        <button @click="saveProfile">Salvează modificările</button>
        <button @click="logout" class="logout-btn">Deconectare</button>
      </div>

      <div class="user-books">
        <h2>Cărțile mele</h2>
        <button class="add-button" @click="addBook">Adaugă carte nouă</button>
        <div v-if="userBooks.length" class="books-list">
          <div v-for="book in userBooks" :key="book.id" class="book-card">
            <img :src="book.imageUrl" alt="carte" />
            <div class="book-info">
              <h3>{{ book.title }}</h3>
              <p><strong>Autor:</strong> {{ book.author }}</p>
              <p><strong>Gen:</strong> {{ book.genre }}</p>
            </div>
            <div class="book-actions">
              <button @click="editBook(book.id)">Editează</button>
              <button class="delete" @click="deleteBook(book.id)">Șterge</button>
            </div>
          </div>
        </div>
        <p v-else>Nu ai postat nicio carte.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { getUserProfile, updateUserProfile, logoutUser } from '@/services/auth';
import { getBooksByUser, deleteBookById } from '@/services/api';

export default {
  name: 'AccountPage',
  data() {
    return {
      user: {
        name: '',
        email: '',
        registrationDate: '',
        contactMethod: '',
        city: '',
        county: '',
      },
      isEditingLocation: false,
      isEditingContact: false,
      userBooks: [],
      loading: true,
      error: null,
      booksError: null
    };
  },
  async created() {
    try {
      console.log('Account page created, fetching user data...');
      // Încercă să obții datele utilizatorului
      const userData = await getUserProfile();
      this.user = userData;
      
      // Apoi încearcă să obții cărțile utilizatorului
      await this.fetchUserBooks();
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Gestionează eroarea fără a opri complet încărcarea paginii
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async fetchUserData() {
      const userData = await getUserProfile();
      this.user = userData;
    },
    async fetchUserBooks() {
      try {
        console.log('Fetching user books...');
        const books = await getBooksByUser();
        this.userBooks = books; // Aici este corecția - userBooks în loc de books
      } catch (error) {
        console.error('Error fetching user books:', error);
        // Arată un mesaj de eroare în interfață în loc să arunci eroarea
        this.booksError = 'Nu s-au putut încărca cărțile. Încearcă din nou mai târziu.';
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'Nespecificat';
      const date = new Date(dateString);
      return date.toLocaleDateString('ro-RO');
    },
    toggleEditLocation() {
      if (this.isEditingLocation) {
        this.saveProfile();
      }
      this.isEditingLocation = !this.isEditingLocation;
    },
    async saveContact() {
      this.isEditingContact = false;
      await this.saveProfile();
    },
    async saveProfile() {
      try {
        await updateUserProfile(this.user);
        alert('Profilul a fost actualizat cu succes!');
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Nu s-a putut actualiza profilul. Te rugăm să încerci din nou.');
      }
    },
    changePassword() {
      // Implementează schimbarea parolei sau redirecționează la o pagină dedicată
      alert('Funcționalitate de schimbare a parolei. Va fi implementată ulterior.');
    },
    logout() {
      logoutUser();
      this.$router.push('/login');
    },
    addBook() {
      this.$router.push('/add');
    },
    editBook(id) {
      this.$router.push(`/edit/${id}`);
    },
    async deleteBook(id) {
      if (confirm('Ești sigur că vrei să ștergi această carte?')) {
        try {
          await deleteBookById(id);
          this.userBooks = this.userBooks.filter(book => book.id !== id);
          alert('Cartea a fost ștearsă cu succes!');
        } catch (error) {
          console.error('Error deleting book:', error);
          alert('Nu s-a putut șterge cartea. Te rugăm să încerci din nou.');
        }
      }
    },
  },
};
</script>

<style scoped>
.account-page {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.account-details,
.account-actions,
.user-books {
  background-color: #fff;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

button {
  padding: 10px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 10px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #0056b3;
}

.delete {
  background-color: #dc3545;
}

.delete:hover {
  background-color: #b02a37;
}

.add-button {
  margin-bottom: 15px;
  background-color: #28a745;
}

.add-button:hover {
  background-color: #218838;
}

.books-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.book-card {
  display: flex;
  gap: 16px;
  background: #fafafa;
  padding: 16px;
  border-radius: 10px;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.book-card img {
  width: 100px;
  height: auto;
  border-radius: 8px;
}

.book-info {
  flex: 1;
}

.book-actions button {
  margin-right: 8px;
}

.location {
  margin-top: 20px;
}

.location input {
  padding: 8px;
  margin: 10px 0;
  width: 100%;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.loading {
  text-align: center;
  padding: 40px;
}

.error-message {
  padding: 20px;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 8px;
  margin-bottom: 20px;
}

.logout-btn {
  background-color: #dc3545;
}
.logout-btn:hover {
  background-color: #bd2130;
}
</style>
