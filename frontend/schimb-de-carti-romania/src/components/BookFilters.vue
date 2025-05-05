<template>
  <div class="book-filters">
    <h2>Filtrează cărțile</h2>
    <form @submit.prevent="applyFilters">
      <div class="filters-container">
        <div class="filter-group">
          <label for="county">Județ:</label>
          <select v-model="filters.county" id="county" @change="onCountyChange">
            <option value="all">Oricare</option>
            <option v-for="county in filterOptions.counties" :key="county" :value="county">
              {{ county }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="city">Oraș:</label>
          <select v-model="filters.city" id="city" :disabled="!filters.county || filters.county === 'all'">
            <option value="all">Oricare</option>
            <option v-for="city in availableCities" :key="city" :value="city">
              {{ city }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="genre">Gen carte:</label>
          <select v-model="filters.genre" id="genre">
            <option value="all">Oricare</option>
            <option v-for="genre in filterOptions.genres" :key="genre" :value="genre">
              {{ genre }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="condition">Stare carte:</label>
          <select v-model="filters.condition" id="condition">
            <option value="all">Oricare</option>
            <option v-for="condition in filterOptions.conditions" :key="condition" :value="condition">
              {{ condition }}
            </option>
          </select>
        </div>
      </div>

      <button type="submit" class="apply-filters-btn">Aplică filtre</button>
    </form>
  </div>
</template>

<script>
import { getFilterOptions } from '@/services/api';

export default {
  data() {
    return {
      filters: {
        county: 'all',
        city: 'all',
        genre: 'all',
        condition: 'all',
      },
      filterOptions: {
        counties: [],
        cities: {},
        genres: [],
        conditions: []
      },
      loading: false
    };
  },
  computed: {
    availableCities() {
      if (this.filters.county === 'all' || !this.filterOptions.cities[this.filters.county]) {
        return [];
      }
      return this.filterOptions.cities[this.filters.county] || [];
    }
  },
  methods: {
    onCountyChange() {
      this.filters.city = 'all';
    },
    applyFilters() {
      this.$emit('filters-applied', { ...this.filters });
    },
    async fetchFilterOptions() {
      try {
        this.loading = true;
        const options = await getFilterOptions();
        this.filterOptions = options;
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      } finally {
        this.loading = false;
      }
    }
  },
  created() {
    // Fetch filter options when component is created
    this.fetchFilterOptions();
  }
};
</script>

<style scoped>
.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 150px;
}

</style>