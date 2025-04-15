<template>
  <div class="overlay" @click.self="close">
    <div class="modal">
      <button class="close-btn" @click="close">×</button>
      <h2>Cerere de Schimb</h2>

      <div class="info-box">
        <p><strong>Cartea vizată:</strong> {{ request.bookTitle }}</p>
        <p><strong>Cerută de:</strong>
          <router-link :to="'/profile/' + request.requesterId">{{ request.requester }}</router-link>
        </p>
        <p><strong>Metodă de contact:</strong> {{ requesterUser?.contactMethod || 'Necunoscută' }}</p>
        <p><strong>Mesaj:</strong> {{ request.message }}</p>
        <p><strong>Cărți oferite:</strong></p>
        <ul>
          <li v-for="book in request.offeredBooks" :key="book.id">{{ book.title }}</li>
        </ul>
      </div>

      <div class="actions">
        <button class="approve-btn" @click="approveRequest">Aprobă</button>
        <button class="reject-btn" @click="rejectRequest">Respinge</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SeeRequestPopup',
  props: {
    request: Object,
  },
  data() {
    return {
      requesterUser: null,
    };
  },
  mounted() {
    this.fetchRequesterInfo();
  },
  methods: {
    async fetchRequesterInfo() {
      // Înlocuiește acest mock cu o cerere API reală sau un store global
      const mockUsers = [
        {
          id: 1,
          name: 'Ion Popescu',
          contactMethod: 'WhatsApp: 123456789',
        },
        {
          id: 2,
          name: 'Maria Ionescu',
          contactMethod: 'Email: maria@example.com',
        },
      ];

      this.requesterUser = mockUsers.find(
        (u) => u.id === this.request.requesterId
      );
    },
    approveRequest() {
      alert('Cerere aprobată!');
      this.close();
    },
    rejectRequest() {
      alert('Cerere respinsă!');
      this.close();
    },
    close() {
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}

.info-box p {
  margin: 10px 0;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.approve-btn,
.reject-btn {
  padding: 10px 20px;
  font-weight: bold;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.approve-btn {
  background-color: #4caf50;
  color: white;
}

.reject-btn {
  background-color: #f44336;
  color: white;
}
</style>
