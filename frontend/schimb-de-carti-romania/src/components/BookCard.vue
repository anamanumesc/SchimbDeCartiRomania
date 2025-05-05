<template>
  <div class="book-card p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
    <img
      v-if="book.imageUrl"
      :src="book.imageUrl"
      alt="Book cover"
      class="w-full h-48 object-cover rounded mb-4"
    />
    <h3 class="text-xl font-semibold mb-2">{{ book.title }}</h3>
    <p class="text-gray-700 mb-1"><strong>Autor:</strong> {{ book.author }}</p>
    <p class="text-gray-700 mb-1"><strong>Locație:</strong> {{ book.city }}, {{ book.county }}</p>
    <p class="text-gray-700 mb-1"><strong>Gen:</strong> {{ book.genre }}</p>
    <p class="text-gray-700"><strong>Stare:</strong> {{ book.condition }}</p>
  </div>
</template>

<script>
export default {
  name: 'BookCard',
  props: {
    book: {
      type: Object,
      required: true
    }
  }
};
</script>

<style scoped>
.book-card {
  cursor: pointer;
}
.book-card:hover {
  transform: translateY(-2px);
  transition: transform 0.2s;
}
</style>
