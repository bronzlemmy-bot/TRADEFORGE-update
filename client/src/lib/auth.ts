interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  token: string;
  message: string;
}

const TOKEN_KEY = "authToken";

export const authService = {
  setToken: (token: string, remember = false) => {
    const targetStorage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem(TOKEN_KEY);
    targetStorage.setItem(TOKEN_KEY, token);
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return Boolean(authService.getToken());
  },

  getAuthHeaders: (): Record<string, string> => {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};

export type { AuthResponse };
