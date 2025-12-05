import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 60000, // 增加到60秒，适配AI接口响应时间
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { code, message: msg } = error.response.data;
      
      // Token过期
      if (code === 40101 || code === 40102) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
        message.error('登录已过期，请重新登录');
      } else {
        message.error(msg || '请求失败');
      }
    } else {
      message.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  sendCode: (phone) => api.post('/auth/send-code', { phone }),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
};

// 用户相关API
export const userAPI = {
  getCurrentUser: () => api.get('/users/me'),
  updateCurrentUser: (data) => api.put('/users/me', data),
  getUserProfile: (id) => api.get(`/users/${id}`),
  getUserWorks: (id, params) => api.get(`/users/${id}/works`, { params }),
  followUser: (id) => api.post(`/users/${id}/follow`),
  unfollowUser: (id) => api.delete(`/users/${id}/follow`),
  getFollowing: (id, params) => api.get(`/users/${id}/following`, { params }),
  getFollowers: (id, params) => api.get(`/users/${id}/followers`, { params }),
};

// 作品相关API
export const workAPI = {
  uploadImage: (formData) => api.post('/works/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  createWork: (data) => api.post('/works', data),
  getFeed: (params) => api.get('/works/feed', { params }),
  getFollowingFeed: (params) => api.get('/works/following', { params }),
  searchWorks: (params) => api.get('/works/search', { params }),
  getWorkDetail: (id) => api.get(`/works/${id}`),
  updateWork: (id, data) => api.put(`/works/${id}`, data),
  deleteWork: (id) => api.delete(`/works/${id}`),
  likeWork: (id) => api.post(`/works/${id}/like`),
  unlikeWork: (id) => api.delete(`/works/${id}/like`),
  collectWork: (id) => api.post(`/works/${id}/collect`),
  uncollectWork: (id) => api.delete(`/works/${id}/collect`),
};

// 评论相关API
export const commentAPI = {
  getWorkComments: (workId, params) => api.get(`/comments/work/${workId}`, { params }),
  createComment: (data) => api.post('/comments', data),
  deleteComment: (id) => api.delete(`/comments/${id}`),
  likeComment: (id) => api.post(`/comments/${id}/like`),
  unlikeComment: (id) => api.delete(`/comments/${id}/like`),
};

export default api;
