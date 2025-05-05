import axios from 'axios';

// Configure base URL
const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
const AUTH_URL = `${API_URL}/auth`;
// Create axios instance with authorization header handling
const authClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor for adding token to requests
authClient.interceptors.request.use(
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

// Register new user
export const registerUser = async (userData) => {
  try {
    console.log("Sending registration request with:", { 
      email: userData.email, 
      name: userData.name,
      password: "***" // Nu afișăm parola în loguri
    });
    
    const response = await axios.post(`${AUTH_URL}/register`, userData);
    
    if (response.data.token) {
      console.log("Registration successful, storing token");
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login user
export const loginUser = async (credentials) => {
  try {
    console.log("Sending login request with:", { 
      email: credentials.email, 
      password: "***" // Nu afișăm parola în loguri
    });
    
    const response = await axios.post(`${AUTH_URL}/login`, credentials);
    
    if (response.data.token) {
      console.log("Login successful, storing token");
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Verify token
export const verifyToken = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { valid: false };
    }
    
    const response = await authClient.get(`${AUTH_URL}/verify`);
    return response.data;
  } catch (error) {
    console.error('Token verification error:', error);
    // În caz de eroare, presupunem că token-ul nu este valid
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { valid: false };
  }
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log("User logged out, storage cleared");
};

// Get current user
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Check if user is logged in
export const isLoggedIn = () => {
  return !!localStorage.getItem('token');
};

// Get user profile data
export const getUserProfile = async () => {
  try {
    const response = await authClient.get(`${AUTH_URL}/profile`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userData) => {
  try {
    const response = await authClient.put(`${AUTH_URL}/profile`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};