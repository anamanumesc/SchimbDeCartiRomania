<template>
  <div class="book-page">
    <h1>Pagina Cărții</h1>

    <div class="requests-container">
      <!-- Cererile primite -->
      <div class="received-requests">
        <h2>Cererile primite</h2>
        <ul>
          <li v-for="(request, index) in receivedRequests" :key="index">
            <span>{{ request.bookTitle }} - {{ request.requester }}</span>
            <button @click="viewDetails(request)">Vezi detalii</button>
          </li>
        </ul>
      </div>

      <!-- Cererile trimise -->
      <div class="sent-requests">
        <h2>Cererile trimise</h2>
        <ul>
          <li v-for="(request, index) in sentRequests" :key="index">
            <span>{{ request.bookTitle }} - Status: <span :class="request.status">{{ request.status }}</span></span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Popup -->
    <SeeRequestPopup
      v-if="showPopup"
      :request="selectedRequest"
      @close="showPopup = false"
    />
  </div>
</template>

<script>
import SeeRequestPopup from '@/components/SeeRequestPopup.vue';

export default {
  name: 'MyRequestsPage',
  components: { SeeRequestPopup },
  data() {
    return {
      showPopup: false,
      selectedRequest: null,
      receivedRequests: [
        {
          bookTitle: 'Cartea A',
          requester: 'Ion Popescu',
          message: 'Salut! Mi-ar plăcea să facem schimb.',
          offeredBooks: [
            { id: 1, title: 'Cartea lui' },
            { id: 2, title: 'Altă carte interesantă' },
          ],
        },
        {
          bookTitle: 'Cartea B',
          requester: 'Maria Ionescu',
          message: 'Sunt interesată de această carte!',
          offeredBooks: [{ id: 3, title: 'Un roman captivant' }],
        },
      ],
      sentRequests: [
        { bookTitle: 'Cartea X', status: 'approve' },
        { bookTitle: 'Cartea Y', status: 'reject' },
        { bookTitle: 'Cartea Z', status: 'approve' },
      ],
    };
  },
  methods: {
    viewDetails(request) {
      this.selectedRequest = request;
      this.showPopup = true;
    },
  },
};
</script>

<style scoped>
.book-page {
  padding: 20px;
}

.requests-container {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.received-requests,
.sent-requests {
  width: 48%;
}

h2 {
  color: #333;
  margin-bottom: 10px;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin: 10px 0;
  padding: 10px;
  background-color: #f4f4f4;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

button {
  padding: 6px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #0056b3;
}

span {
  font-weight: bold;
}

span.approve {
  color: green;
}

span.reject {
  color: red;
}
</style>
