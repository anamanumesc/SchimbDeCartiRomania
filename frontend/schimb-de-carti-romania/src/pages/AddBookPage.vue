<template>
  <div class="add-book-container">
    <h1>Adaugă Carte</h1>
    
    <!-- Success message -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
    
    <!-- Error message -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
    
    <form @submit.prevent="submitBook" class="book-form" enctype="multipart/form-data">
      <!-- Câmpuri carte -->
      <div class="form-group">
        <label for="title">Titlu</label>
        <input type="text" id="title" v-model="book.title" placeholder="Introduceti titlul" required />
      </div>

      <div class="form-group">
        <label for="author">Autor</label>
        <input type="text" id="author" v-model="book.author" placeholder="Introduceti autorul" required />
      </div>

      <div class="form-group">
        <label for="genre">Gen</label>
        <input type="text" id="genre" v-model="book.genre" placeholder="Introduceti genul cărții" required />
      </div>

      <div class="form-group">
        <label for="condition">Stare</label>
        <input type="text" id="condition" v-model="book.condition" placeholder="Stare cărții" required />
      </div>

      <div class="form-group">
        <label for="county">Județ</label>
        <input type="text" id="county" v-model="book.county" placeholder="Județ" required />
      </div>

      <div class="form-group">
        <label for="city">Oraș</label>
        <input type="text" id="city" v-model="book.city" placeholder="Oraș" required />
      </div>

      <!-- Imagini -->
      <div class="form-group">
        <label for="images">Imagini carte (obligatoriu)</label>
        <input 
          type="file" 
          id="images" 
          multiple 
          @change="handleImageUpload" 
          accept="image/*" 
          required
        />
      </div>

      <!-- Previzualizare imagini -->
      <div v-if="imagePreviews.length" class="preview">
        <p>Previzualizare imagini:</p>
        <div class="preview-images">
          <div v-for="(imgSrc, index) in imagePreviews" :key="index" class="image-preview-container">
            <img :src="imgSrc" alt="Preview imagine" />
            <button 
              type="button" 
              class="remove-image" 
              @click="removeImage(index)"
              title="Șterge imaginea"
            >
              &times;
            </button>
          </div>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">
        <p>Se procesează cererea...</p>
      </div>

      <!-- Buton submit -->
      <button 
        type="submit" 
        :disabled="isLoading || imageFiles.length === 0" 
        :class="{ 'disabled': isLoading || imageFiles.length === 0 }"
      >
        {{ isLoading ? 'Se încarcă...' : 'Adaugă carte' }}
      </button>
    </form>
  </div>
</template>

<script>
import { addBook, uploadBookImages } from '@/services/api';

export default {
  name: 'AddBookPage',
  data() {
    return {
      book: {
        title: '',
        author: '',
        genre: '',
        condition: '',
        county: '',
        city: '',
        userId: 1, // Utilizator implicit (vei actualiza în implementarea cu autentificare)
      },
      imageFiles: [],
      imagePreviews: [],
      errorMessage: null,
      successMessage: null,
      isLoading: false,
    };
  },
  methods: {
    handleImageUpload(event) {
      // Reset existing files if needed
      // this.imageFiles = [];
      // this.imagePreviews = [];
      
      const files = event.target.files;
      
      // Validare - limitează la 5 imagini
      if (this.imageFiles.length + files.length > 5) {
        this.errorMessage = 'Poți încărca maximum 5 imagini.';
        return;
      }
      
      this.errorMessage = null;
      
      // Add new files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Verifică dacă este imagine
        if (!file.type.startsWith('image/')) {
          continue;
        }
        
        // Verifică dimensiunea (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.errorMessage = 'Imaginile trebuie să fie mai mici de 5MB.';
          continue;
        }
        
        this.imageFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    },
    
    removeImage(index) {
      this.imageFiles.splice(index, 1);
      this.imagePreviews.splice(index, 1);
    },
    
    async submitBook() {
      if (this.imageFiles.length === 0) {
        this.errorMessage = 'Te rugăm să adaugi cel puțin o imagine.';
        return;
      }
      
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;
      
      try {
        // Pasul 1: Încărcarea imaginilor
        const formData = new FormData();
        this.imageFiles.forEach(file => {
          formData.append('images', file);
        });

        console.log('Încărcare imagini...');
        const uploadResponse = await uploadBookImages(formData);

        console.log('Răspuns încărcare:', uploadResponse);
        
        if (uploadResponse && uploadResponse.imageUrls) {
          const imageUrls = uploadResponse.imageUrls;

          // Pasul 2: Trimiterea datelor cărții împreună cu URL-urile imaginilor
          console.log('Adăugare carte...');
          const addBookResponse = await addBook({ 
            ...this.book, 
            imageUrls 
          });

          console.log('Răspuns adăugare carte:', addBookResponse);
          
          this.successMessage = `Carte adăugată cu succes! ID: ${addBookResponse.id}`;
          
          // Reset form
          this.book = { 
            title: '', 
            author: '', 
            genre: '', 
            condition: '', 
            county: '', 
            city: '',
            userId: 1 
          };
          this.imageFiles = [];
          this.imagePreviews = [];
          
        } else {
          this.errorMessage = 'Eroare la încărcarea imaginilor. Te rugăm să încerci din nou.';
        }
      } catch (error) {
        console.error('Eroare la adăugarea cărții:', error);
        
        if (error.response) {
          // Răspuns de la server cu eroare
          this.errorMessage = `Eroare (${error.response.status}): ${error.response.data.error || 'A apărut o problemă la server.'}`;
        } else if (error.request) {
          // Cererea a fost făcută dar nu s-a primit răspuns
          this.errorMessage = 'Nu s-a putut contacta serverul. Verifică conexiunea la internet.';
        } else {
          // Eroare în setarea cererii
          this.errorMessage = 'A apărut o eroare la trimiterea datelor.';
        }
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.add-book-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f4f4f4;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.preview-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.image-preview-container {
  position: relative;
  width: 120px;
  height: 120px;
}

.preview-images img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  border: 1px solid #ddd;
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #ff4757;
  color: white;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid white;
  padding: 0;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 15px;
}

button:hover {
  background-color: #0056b3;
}

button.disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.success-message {
  padding: 12px;
  background-color: #d4edda;
  color: #155724;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: center;
}

.error-message {
  padding: 12px;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: center;
}

.loading {
  text-align: center;
  margin: 15px 0;
  font-style: italic;
  color: #666;
}
</style>