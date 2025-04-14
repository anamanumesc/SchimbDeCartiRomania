<template>
  <div class="book-page">
    <h1>Pagina Cărții</h1>

    <div class="requests-container">
      <!-- Prima jumătate: Cererile primite -->
      <div class="received-requests">
        <h2>Cererile primite</h2>
        <ul>
          <li v-for="(request, index) in receivedRequests" :key="index">
            <span>{{ request.bookTitle }} - {{ request.requester }}</span>
            <button @click="viewDetails(request)">Vezi detalii</button>
          </li>
        </ul>
      </div>

      <!-- A doua jumătate: Cererile trimise -->
      <div class="sent-requests">
        <h2>Cererile trimise</h2>
        <ul>
          <li v-for="(request, index) in sentRequests" :key="index">
            <span>{{ request.bookTitle }} - Status: <span :class="request.status">{{ request.status }}</span></span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BookPage',
  data() {
    return {
      receivedRequests: [
        { bookTitle: 'Cartea A', requester: 'Ion Popescu' },
        { bookTitle: 'Cartea B', requester: 'Maria Ionescu' },
        { bookTitle: 'Cartea C', requester: 'George Vasilescu' },
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
      // Aici va veni logica pentru popup, deocamdată doar un log
      console.log('Vezi detalii pentru cererea:', request);
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

.received-requests, .sent-requests {
  width: 48%; /* Fiecare jumătate ocupă 48% din lățimea totală */
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
