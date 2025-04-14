<template>
  <div class="book-filters">
    <h2>Filtrează cărțile</h2>
    <form @submit.prevent="applyFilters">
      <div class="filters-container">
        <div class="filter-group">
          <label for="county">Județ:</label>
          <select v-model="filters.county" id="county">
            <option value="all">Oricare</option>
            <option value="București">București</option>
            <option value="Cluj">Cluj</option>
            <option value="Iași">Iași</option>
            <!-- Adăugați mai multe județe aici -->
          </select>
        </div>

        <div class="filter-group">
          <label for="city">Oraș:</label>
          <select v-model="filters.city" id="city" :disabled="!filters.county || filters.county === 'all'">
            <option value="all">Oricare</option>
            <option v-for="city in cities[filters.county] || []" :key="city" :value="city">{{ city }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="genre">Gen carte:</label>
          <select v-model="filters.genre" id="genre">
            <option value="all">Oricare</option>
            <option value="thriller">Thriller</option>
            <option value="romance">Romance</option>
            <option value="istorie">Istorie</option>
            <!-- Adăugați mai multe genuri aici -->
          </select>
        </div>

        <div class="filter-group">
          <label for="condition">Stare carte:</label>
          <select v-model="filters.condition" id="condition">
            <option value="all">Oricare</option>
            <option value="noua">Nouă</option>
            <option value="foarte_buna">Foarte bună</option>
            <option value="acceptabila">Acceptabilă</option>
          </select>
        </div>
      </div>

      <button type="submit" class="apply-filters-btn">Aplică filtre</button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      filters: {
        county: 'all',
        city: 'all',
        genre: 'all',
        condition: 'all',
      },
      cities: {
        București: ['Sector 1', 'Sector 2'],
        Cluj: ['Cluj-Napoca', 'Turda'],
        Iași: ['Iași', 'Pașcani'],
        // adaugă orașe pentru fiecare județ
      },
    };
  },
  methods: {
    applyFilters() {
      this.$emit('filters-applied', this.filters);
    },
  },
};
</script>

<style scoped>
.book-filters {
  padding: 20px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 20px;
  color: #333;
  font-size: 1.6rem;
  text-align: center;
}

.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: space-between;
}

.filter-group {
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
}

.filter-group label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

.filter-group select {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  background-color: #f9f9f9;
  transition: border-color 0.3s ease;
}

.filter-group select:focus {
  border-color: #3498db; /* Add a focus effect */
  outline: none;
}

.apply-filters-btn {
  margin-top: 20px;
  padding: 12px 24px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.apply-filters-btn:hover {
  background-color: #2980b9;
}
</style>
