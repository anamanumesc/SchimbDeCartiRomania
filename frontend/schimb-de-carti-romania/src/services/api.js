// src/services/api.js
import axios from 'axios';

// Configure base URL
// Modifică doar această linie:
const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Adaugă interceptor la apiClient
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor pentru răspunsuri - redirectare la login în caz de eroare de autorizare
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.log("Unauthorized request detected, redirecting to login");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login - utilizăm window.location pentru a reîncărca complet aplicația
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Get all books (optionally with filters)
export const getBooks = async (filters = {}) => {
  try {
    // Build query parameters
    const params = {};
    
    if (filters.county && filters.county !== 'all') params.county = filters.county;
    if (filters.city && filters.city !== 'all') params.city = filters.city;
    if (filters.genre && filters.genre !== 'all') params.genre = filters.genre;
    if (filters.condition && filters.condition !== 'all') params.condition = filters.condition;
    
    const response = await apiClient.get('/books/filtered', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};

// Get filter options for dropdowns
export const getFilterOptions = async () => {
  try {
    const response = await apiClient.get('/books/filter-options');
    return response.data;
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw error;
  }
};

// Get book by ID
export const getBookById = async (id) => {
  try {
    const response = await apiClient.get(`/books/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching book with id ${id}:`, error);
    throw error;
  }
};

// Adaugă o carte nouă
export const addBook = async (bookData) => {
  try {
    // Modifică aici: folosește endpoint-ul /books/add în loc de /books 
    const response = await apiClient.post('/books/add', bookData);
    return response.data;
  } catch (error) {
    console.error('Error adding book:', error);
    throw error;
  }
};

// Upload book images
export const uploadBookImages = async (formData) => {
  try {
    const response = await apiClient.post('/books/upload-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

// Get books by the currently logged in user
export const getBooksByUser = async () => {
  console.log('Fetching books for user...');
  try {
    const response = await apiClient.get('/books/mybooks'); // Endpoint corect
    return response.data;
  } catch (error) {
    console.error('Error fetching user books:', error);
    throw error;
  }
};

// Delete a book
export const deleteBookById = async (id) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await apiClient.delete(`/books/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting book with id ${id}:`, error);
    throw error;
  }
};

// Exportăm apiClient pentru a putea fi folosit direct
export { apiClient };