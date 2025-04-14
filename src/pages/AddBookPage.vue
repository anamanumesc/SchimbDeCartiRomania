
<template>
  <div class="add-book-container">
    <h1>Adaugă Carte</h1>
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
        <label for="images">Imagini carte</label>
        <input type="file" id="images" multiple @change="handleImageUpload" accept="image/*" />
      </div>

      <!-- Previzualizare imagini -->
      <div v-if="imagePreviews.length" class="preview">
        <p>Previzualizare imagini:</p>
        <div class="preview-images">
          <img v-for="(imgSrc, index) in imagePreviews" :key="index" :src="imgSrc" alt="Preview imagine" />
        </div>
      </div>

      <!-- Buton submit -->
      <button type="submit">Adaugă carte</button>
    </form>
  </div>
</template>

<script>
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
      },
      imageFiles: [],
      imagePreviews: [],
    };
  },
  methods: {
    handleImageUpload(event) {
      const files = event.target.files;
      
      // Se adaugă noile imagini în lista de previzualizare
      // Se adaugă doar fișierele noi, fără a șterge cele vechi
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreviews.push(e.target.result); // Adăugăm URL-ul imaginii în previzualizări
        };
        reader.readAsDataURL(files[i]); // Citim fișierul și obținem URL-ul
      }
    },

    submitBook() {
      const formData = new FormData();
      for (const key in this.book) {
        formData.append(key, this.book[key]);
      }

      this.imageFiles.forEach(file => {
        formData.append('images[]', file); // Adăugăm fișierele imagini
      });

      // Simularea trimiterii datelor
      console.log('Trimitem cartea:', this.book);
      console.log('Fișiere:', this.imageFiles);
      alert('Carte adăugată (simulare)');
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
  flex-wrap: wrap; /* Permite imaginilor să se aranjeze pe mai multe rânduri */
  gap: 12px; /* Spațiu între imagini */
  margin-top: 8px;
}

.preview-images img {
  width: 120px; /* Lățimea fiecărei imagini */
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  border: 1px solid #ddd;
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
}

button:hover {
  background-color: #0056b3;
}
</style>
