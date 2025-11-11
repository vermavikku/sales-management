const API_BASE_URL = "/api"; // Proxy handles routing to backend

const api = {
  get: async (path, params = {}, options = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || `API Error: ${response.statusText}`);
    }
    if (options.responseType === "blob") {
      return response.blob();
    }
    return response.json();
  },

  post: async (path, data) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || `API Error: ${response.statusText}`);
    }
    return response.json();
  },

  put: async (path, data) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || `API Error: ${response.statusText}`);
    }
    return response.json();
  },

  delete: async (path) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || `API Error: ${response.statusText}`);
    }
    return response.json();
  },
};

export default api;
