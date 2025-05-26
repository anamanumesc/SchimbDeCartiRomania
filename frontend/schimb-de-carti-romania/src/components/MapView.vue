<template>
  <div class="map-container">
    <div v-if="loading" class="loading-overlay">
      <p>Se încarcă harta...</p>
    </div>
    <l-map ref="map" v-model:zoom="zoom" :center="center">
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
      <l-marker v-for="marker in cityMarkers" :key="marker.city" :lat-lng="marker.coordinates">
        <l-popup>
          <div class="city-popup">
            <h3>{{ marker.city }}</h3>
            <p>{{ marker.county }}</p>
            <p><strong>{{ marker.books.length }} cărți disponibile</strong></p>
            <ul class="book-list">
              <li v-for="book in marker.books" :key="book.id">
                <router-link :to="`/book/${book.id}`">
                  {{ book.title }} - {{ book.author }}
                </router-link>
              </li>
            </ul>
          </div>
        </l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'; // Removed unused 'computed' import
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet';
import 'leaflet/dist/leaflet.css';
import { getBooks } from '@/services/api';
import romanianCities from '@/data/romanian-cities.js';

// Fix for Leaflet icon issue in webpack
import { Icon } from 'leaflet';
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default {
  name: 'MapView',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup
  },
  setup() {
    const loading = ref(true);
    const books = ref([]);
    const zoom = ref(7);
    const center = ref([45.9443, 25.0094]); // Romania center
    const url = ref('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    const attribution = ref('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>');
    const cityMarkers = ref([]);

    // Group books by city and create markers
    const groupBooksByCity = () => {
      const cities = {};
      
      books.value.forEach(book => {
        if (!book.city || !book.county) return;
        
        const cityKey = `${book.city}-${book.county}`;
        
        if (!cities[cityKey]) {
          // Find coordinates for the city or use approximate ones
          const cityInfo = romanianCities.find(
            c => c.name.toLowerCase() === book.city.toLowerCase() && 
                c.county.toLowerCase() === book.county.toLowerCase()
          );
          
          const coordinates = cityInfo 
            ? [cityInfo.lat, cityInfo.lng] 
            : [
                45.9443 + (Math.random() - 0.5), 
                25.0094 + (Math.random() - 0.5)
              ];
          
          cities[cityKey] = {
            city: book.city,
            county: book.county,
            coordinates,
            books: []
          };
        }
        
        cities[cityKey].books.push(book);
      });
      
      cityMarkers.value = Object.values(cities);
    };

    // Fetch books and initialize map
    const fetchBooks = async () => {
      try {
        loading.value = true;
        books.value = await getBooks();
        groupBooksByCity();
      } catch (error) {
        console.error('Error fetching books for map view:', error);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchBooks();
    });

    return {
      loading,
      zoom,
      center,
      url,
      attribution,
      cityMarkers
    };
  }
};
</script>

<style scoped>
.map-container {
  position: relative;
  height: 600px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.city-popup {
  padding: 5px;
  min-width: 200px;
}

.city-popup h3 {
  margin-top: 0;
  margin-bottom: 5px;
  color: #2c3e50;
}

.book-list {
  max-height: 200px;
  overflow-y: auto;
  padding-left: 15px;
}

.book-list li {
  margin-bottom: 6px;
}

.book-list a {
  color: #007bff;
  text-decoration: none;
}

.book-list a:hover {
  text-decoration: underline;
}
</style>