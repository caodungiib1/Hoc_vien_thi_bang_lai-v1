const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', body, token } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'API backend trả về lỗi.');
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Không kết nối được backend. Hãy chạy `npm run dev` để mở cả API và giao diện.');
    }

    throw error;
  }
};
