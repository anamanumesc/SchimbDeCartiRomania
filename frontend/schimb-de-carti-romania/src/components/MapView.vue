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
import { ref, onMounted } from 'vue'; 
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

// Funcție utilitară pentru normalizarea stringurilor
const normalizeString = (str) => {
  if (!str) return '';
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // elimină diacriticele
    .replace(/[-_]/g, ' ')           // înlocuiește - și _ cu spațiu
    .replace(/\s+/g, ' ')            // reduce spațiile multiple
    .trim();                          // elimină spațiile de la început și sfârșit
};

// Funcție pentru a calcula similaritatea dintre două stringuri
const calculateSimilarity = (s1, s2) => {
  const normalized1 = normalizeString(s1);
  const normalized2 = normalizeString(s2);
  
  // Dacă stringurile sunt identice după normalizare
  if (normalized1 === normalized2) return 1;
  
  // Verifică dacă unul îl include pe celălalt
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.9;
  
  return 0;
};

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
    const unmatchedCities = ref([]);

    // Funcție îmbunătățită pentru potrivirea orașelor
    const findCityCoordinates = (cityName, countyName) => {
      // Normalizează numele orașului și județului
      const normalizedCityName = normalizeString(cityName);
      const normalizedCountyName = normalizeString(countyName);
      
      let bestMatch = null;
      let bestScore = 0;
      
      for (const city of romanianCities) {
        const normCityName = normalizeString(city.name);
        const normCountyName = normalizeString(city.county);
        
        // Verifică potrivirea județului (trebuie să fie exactă)
        if (normCountyName !== normalizedCountyName) continue;
        
        // Calculează similaritatea pentru numele orașului
        const similarity = calculateSimilarity(normCityName, normalizedCityName);
        
        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = city;
          
          // Dacă am găsit o potrivire perfectă, ne oprim
          if (similarity === 1) break;
        }
      }
      
      // Considerăm potrivită o similaritate de cel puțin 0.7
      if (bestScore >= 0.7) {
        console.log(`Potrivire pentru "${cityName}, ${countyName}": ${bestMatch.name}, ${bestMatch.county} (scor: ${bestScore})`);
        return [bestMatch.lat, bestMatch.lng];
      }
      
      console.warn(`Nu s-a găsit potrivire pentru "${cityName}, ${countyName}" (cel mai bun scor: ${bestScore})`);
      unmatchedCities.value.push({
        city: cityName,
        county: countyName,
        bestMatchName: bestMatch?.name || 'N/A',
        bestMatchScore: bestScore
      });
      
      // Returnăm o poziție aproximativă bazată pe centrul României
      return [
        45.9443 + (Math.random() * 2 - 1), 
        25.0094 + (Math.random() * 2 - 1)
      ];
    };

    // Group books by city and create markers
    const groupBooksByCity = () => {
      const cities = {};
      unmatchedCities.value = [];
      
      books.value.forEach(book => {
        if (!book.city || !book.county) return;
        
        const cityKey = `${book.city}-${book.county}`;
        
        if (!cities[cityKey]) {
          const coordinates = findCityCoordinates(book.city, book.county);
          
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
      
      // Log statistici
      console.log(`Total cărți procesate: ${books.value.length}`);
      console.log(`Total orașe marcate pe hartă: ${cityMarkers.value.length}`);
      console.log(`Orașe negăsite: ${unmatchedCities.value.length}`);
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
      cityMarkers,
      unmatchedCities
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