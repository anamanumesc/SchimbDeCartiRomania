<template>
  <div class="my-requests-page">
    <!-- Header -->
    <div class="page-header">
      <h1>Cererile Mele de Schimb</h1>
      <p>Gestionează cererile de schimb primite și trimise</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Se încarcă cererile...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="content-container">
      <!-- Tabs -->
      <div class="tabs">
        <button 
          @click="activeTab = 'received'" 
          :class="{ active: activeTab === 'received' }"
          class="tab-button"
        >
          Cereri Primite ({{ receivedRequests.length }})
        </button>
        <button 
          @click="activeTab = 'sent'" 
          :class="{ active: activeTab === 'sent' }"
          class="tab-button"
        >
          Cereri Trimise ({{ sentRequests.length }})
        </button>
      </div>

      <!-- Received Requests Tab -->
      <div v-if="activeTab === 'received'" class="tab-content">
        <div v-if="receivedRequests.length === 0" class="empty-state">
          <p>Nu ai cereri de schimb primite.</p>
        </div>
        
        <div v-else class="requests-grid">
          <div 
            v-for="request in receivedRequests" 
            :key="request.id" 
            class="request-card"
          >
            <div class="card-header">
              <h3>{{ request.requesterName }}</h3>
              <span :class="['status-badge', request.status]">
                {{ getStatusText(request.status) }}
              </span>
            </div>

            <div class="card-body">
              <div class="requested-book">
                <h4>Cartea cerută:</h4>
                <p><strong>{{ request.requestedBookTitle }}</strong></p>
                <p class="author">de {{ request.requestedBookAuthor }}</p>
              </div>

              <div class="offered-books">
                <h4>Cărți oferite în schimb:</h4>
                <div class="books-list">
                  <div 
                    v-for="book in request.offeredBooks" 
                    :key="book.id"
                    class="offered-book"
                  >
                    <img 
                      v-if="book.imageUrl" 
                      :src="book.imageUrl" 
                      :alt="book.title"
                      class="book-image"
                    >
                    <div class="book-info">
                      <p><strong>{{ book.title }}</strong></p>
                      <p class="author">{{ book.author }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="request.message" class="message">
                <h4>Mesaj:</h4>
                <p>{{ request.message }}</p>
              </div>

              <div class="request-date">
                <small>Trimisă pe {{ formatDate(request.createdAt) }}</small>
              </div>
            </div>

            <div v-if="request.status === 'pending'" class="card-actions">
              <button 
                @click="acceptRequest(request.id)"
                :disabled="processing"
                class="btn btn-success"
              >
                Acceptă
              </button>
              <button 
                @click="rejectRequest(request.id)"
                :disabled="processing"
                class="btn btn-danger"
              >
                Respinge
              </button>
            </div>

            <div v-else-if="request.status === 'accepted'" class="contact-info">
              <h4>Informații de contact:</h4>
              <p><strong>Email:</strong> {{ request.requesterEmail }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sent Requests Tab -->
      <div v-if="activeTab === 'sent'" class="tab-content">
        <div v-if="sentRequests.length === 0" class="empty-state">
          <p>Nu ai trimis încă cereri de schimb.</p>
        </div>
        
        <div v-else class="requests-grid">
          <div 
            v-for="request in sentRequests" 
            :key="request.id" 
            class="request-card"
          >
            <div class="card-header">
              <h3>Către {{ request.targetUserName }}</h3>
              <span :class="['status-badge', request.status]">
                {{ getStatusText(request.status) }}
              </span>
            </div>

            <div class="card-body">
              <div class="requested-book">
                <h4>Cartea cerută:</h4>
                <p><strong>{{ request.requestedBookTitle }}</strong></p>
                <p class="author">de {{ request.requestedBookAuthor }}</p>
              </div>

              <div v-if="request.message" class="message">
                <h4>Mesajul tău:</h4>
                <p>{{ request.message }}</p>
              </div>

              <div class="request-date">
                <small>Trimisă pe {{ formatDate(request.createdAt) }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Modal -->
    <div v-if="showErrorModal" class="modal-overlay" @click="showErrorModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Eroare</h3>
          <button @click="showErrorModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ errorMessage }}</p>
        </div>
        <div class="modal-footer">
          <button @click="showErrorModal = false" class="btn btn-primary">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MyRequestsPage',
  data() {
    return {
      activeTab: 'received',
      receivedRequests: [],
      sentRequests: [],
      loading: false,
      processing: false,
      showErrorModal: false,
      errorMessage: ''
    };
  },
  mounted() {
    this.loadRequests();
  },
  methods: {
    async loadRequests() {
      this.loading = true;
      try {
        await Promise.all([
          this.loadReceivedRequests(),
          this.loadSentRequests()
        ]);
      } catch (error) {
        console.error('Eroare la încărcarea cererilor:', error);
        this.showError('Eroare la încărcarea cererilor de schimb');
      } finally {
        this.loading = false;
      }
    },

    async loadReceivedRequests() {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }

        // Import api module
        const { apiClient } = await import('@/services/api');
        
        const response = await apiClient.get('/exchanges/received');
        this.receivedRequests = response.data || [];
        console.log('Cereri primite:', this.receivedRequests);
      } catch (error) {
        console.error('Eroare la încărcarea cererilor primite:', error);
        
        // Check error type
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          this.$router.push('/login');
        } else if (error.code === 'ERR_NAME_NOT_RESOLVED') {
          this.showError('Nu se poate conecta la server. Verifică conexiunea la internet.');
        } else {
          throw error;
        }
      }
    },

    async loadSentRequests() {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }

        // Import api module
        const { apiClient } = await import('@/services/api');
        
        const response = await apiClient.get('/exchanges/sent');
        this.sentRequests = response.data || [];
        console.log('Cereri trimise:', this.sentRequests);
      } catch (error) {
        console.error('Eroare la încărcarea cererilor trimise:', error);
        
        // Check error type
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          this.$router.push('/login');
        } else if (error.code === 'ERR_NAME_NOT_RESOLVED') {
          this.showError('Nu se poate conecta la server. Verifică conexiunea la internet.');
        } else {
          throw error;
        }
      }
    },

    async acceptRequest(requestId) {
      if (!confirm('Ești sigur că vrei să accepți această cerere de schimb?')) return;
      
      this.processing = true;
      try {
        const { apiClient } = await import('@/services/api');
        
        await apiClient.patch(`/exchanges/${requestId}/accept`);
        
        // Update request status in list
        const request = this.receivedRequests.find(r => r.id === requestId);
        if (request) {
          request.status = 'accepted';
        }
        
        // Show success message
        alert('Cererea a fost acceptată! Informațiile de contact sunt acum vizibile.');
        
      } catch (error) {
        console.error('Eroare la acceptarea cererii:', error);
        this.showError(error.response?.data?.error || 'Eroare la acceptarea cererii');
      } finally {
        this.processing = false;
      }
    },

    async rejectRequest(requestId) {
      if (!confirm('Ești sigur că vrei să respingi această cerere de schimb?')) return;
      
      this.processing = true;
      try {
        const { apiClient } = await import('@/services/api');
        
        await apiClient.patch(`/exchanges/${requestId}/reject`);
        
        // Update request status in list
        const request = this.receivedRequests.find(r => r.id === requestId);
        if (request) {
          request.status = 'rejected';
        }
        
        alert('Cererea a fost respinsă.');
        
      } catch (error) {
        console.error('Eroare la respingerea cererii:', error);
        this.showError(error.response?.data?.error || 'Eroare la respingerea cererii');
      } finally {
        this.processing = false;
      }
    },

    showError(message) {
      this.errorMessage = message;
      this.showErrorModal = true;
    },

    getStatusText(status) {
      const statusMap = {
        'pending': 'În așteptare',
        'accepted': 'Acceptată',
        'rejected': 'Respinsă'
      };
      return statusMap[status] || status;
    },

    formatDate(dateString) {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return 'Data invalidă';
        }
        return date.toLocaleDateString('ro-RO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        console.error('Eroare la formatarea datei:', error);
        return 'Data invalidă';
      }
    }
  }
};
</script>

<style scoped>
.my-requests-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
  font-size: 16px;
}

.loading-container {
  text-align: center;
  padding: 50px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.tabs {
  display: flex;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 30px;
}

.tab-button {
  background: none;
  border: none;
  padding: 15px 30px;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.tab-button:hover {
  color: #3498db;
}

.tab-button.active {
  color: #3498db;
  border-bottom-color: #3498db;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  padding: 50px;
  color: #666;
  font-size: 18px;
}

.requests-grid {
  display: grid;
  gap: 20px;
}

.request-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.2s ease;
}

.request-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
}

.status-badge {
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.accepted {
  background: #d4edda;
  color: #155724;
}

.status-badge.rejected {
  background: #f8d7da;
  color: #721c24;
}

.card-body {
  padding: 20px;
}

.requested-book,
.offered-books,
.message,
.contact-info {
  margin-bottom: 20px;
}

.requested-book h4,
.offered-books h4,
.message h4,
.contact-info h4 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.author {
  color: #666;
  font-style: italic;
}

.books-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.offered-book {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  flex: 1;
  min-width: 200px;
}

.book-image {
  width: 40px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.book-info p {
  margin: 0;
  font-size: 14px;
}

.message p {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin: 0;
  font-style: italic;
}

.request-date {
  text-align: right;
  margin-top: 20px;
}

.request-date small {
  color: #666;
}

.card-actions {
  padding: 20px;
  background: #f8f9fa;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.contact-info {
  background: #d4edda;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 10px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #e9ecef;
}

/* Responsive Design */
@media (max-width: 768px) {
  .my-requests-page {
    padding: 10px;
  }
  
  .tabs {
    flex-direction: column;
  }
  
  .tab-button {
    padding: 10px 20px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .books-list {
    flex-direction: column;
  }
  
  .offered-book {
    min-width: auto;
  }
  
  .card-actions {
    flex-direction: column;
  }
}
</style>