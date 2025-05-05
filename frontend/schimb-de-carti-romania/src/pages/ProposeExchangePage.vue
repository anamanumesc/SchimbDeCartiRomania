<template>
  <div class="exchange-page">
    <h1>Propune un schimb</h1>

    <form @submit.prevent="submitExchangeRequest" class="exchange-form">
      <div class="form-section">
        <label>Ce carte/cărți propui la schimb:</label>
        <div v-if="myBooks.length">
          <div v-for="book in myBooks" :key="book.id" class="checkbox-book">
            <input
              type="checkbox"
              :id="'book-' + book.id"
              :value="book.id"
              v-model="selectedBookIds"
            />
            <label :for="'book-' + book.id">{{ book.title }}</label>
          </div>
        </div>
        <div v-else>
          <p>Nu ai cărți adăugate în cont.</p>
        </div>
      </div>

      <div class="form-section">
        <label for="message">Mesaj pentru utilizator:</label>
        <textarea
          id="message"
          v-model="message"
          placeholder="Scrie un mesaj..."
          rows="4"
        ></textarea>
      </div>

      <button type="submit" class="submit-btn">Trimite cererea</button>
    </form>
  </div>
</template>

<script>
export default {
  name: "ProposeExchangePage",
  data() {
    return {
      myBooks: [],
      selectedBookIds: [],
      message: "",
    };
  },
  created() {
    const currentUserId = 123; // În practică, ia din auth sau store
    const allBooks = [
      { id: 1, title: "Cartea 1", userId: 123 },
      { id: 2, title: "Cartea 2", userId: 123 },
      { id: 3, title: "Altă carte", userId: 124 },
    ];

    this.myBooks = allBooks.filter((book) => book.userId === currentUserId);
  },
  methods: {
    submitExchangeRequest() {
      const exchangeData = {
        offeredBookIds: this.selectedBookIds,
        message: this.message,
        forBookId: this.$route.params.id,
      };

      // Aici trimiți datele prin API sau email
      console.log("Cerere de schimb:", exchangeData);
      alert("Cererea a fost trimisă!");
      this.$router.push("/"); // sau înapoi la pagină
    },
  },
};
</script>

<style scoped>
.exchange-page {
  max-width: 600px;
  margin: 40px auto;
  background: #fff;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
}

.exchange-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: bold;
  margin-bottom: 8px;
  color: #555;
}

textarea {
  resize: vertical;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 14px;
}

.checkbox-book {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.checkbox-book input {
  margin-right: 8px;
}

.submit-btn {
  align-self: flex-end;
  padding: 12px 24px;
  background-color: #ff5722;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-btn:hover {
  background-color: #e64a19;
}
</style>
