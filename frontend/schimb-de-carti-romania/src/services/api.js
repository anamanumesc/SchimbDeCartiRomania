import axios from 'axios';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.log("Unauthorized request detected, redirecting to login");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Get all books with filters
export const getBooks = async (filters = {}) => {
  try {
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

export const getFilterOptions = async () => {
  try {
    const response = await apiClient.get('/books/filter-options');
    return response.data;
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw error;
  }
};

// ✅ AICI e funcția care îți lipsea:
export const getBookDetails = async (id) => {
  try {
    const response = await apiClient.get(`/books/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching book with id ${id}:`, error);
    throw error;
  }
};

export const addBook = async (bookData) => {
  try {
    const response = await apiClient.post('/books/add', bookData);
    return response.data;
  } catch (error) {
    console.error('Error adding book:', error);
    throw error;
  }
};

export const uploadBookImages = async (formData) => {
  try {
    const response = await apiClient.post('/books/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

export const getBooksByUser = async () => {
  console.log('Fetching books for user...');
  try {
    const response = await apiClient.get('/books/mybooks');
    return response.data;
  } catch (error) {
    console.error('Error fetching user books:', error);
    throw error;
  }
};

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

export { apiClient };
