import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";



const TOKEN_KEY = "miniledger_token";

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {
        console.error("Error reading from localStorage:", e);
      }
      return null;
    }
    return await SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {
        console.error("Error removing from localStorage:", e);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export async function setToken(token: string) {
  try {
    await storage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error("Error saving token:", e);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await storage.getItem(TOKEN_KEY);
  } catch (e) {
    console.error("Error reading token:", e);
    return null;
  }
}

export async function clearToken() {
  try {
    await storage.deleteItem(TOKEN_KEY);
  } catch (e) {
    console.error("Error removing token:", e);
  }
}

function getApiUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const hostname = window.location.hostname || "localhost";
    return `http://${hostname}:5000`;
  }
  return process.env.EXPO_PUBLIC_API_URL || "http://10.151.162.79:5000";
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  let response: Response;

  const authToken = token || (await getToken());
  const baseUrl = getApiUrl();

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });
  } catch (err) {
    console.error(`API request failed to ${baseUrl}${path}:`, err);
    throw new Error("NETWORK_ERROR");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    const message =
      typeof data.message === "string"
        ? data.message
        : "Something went wrong";

    throw new Error(message);
  }

  return data as T;
}

export const authApi = {
  sendOtp: (phone: string) =>
    apiRequest<{ message: string }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: async (phone: string, otp: string) => {
    const data = await apiRequest<{
      message: string;
      token: string;
      user: { id: string; phone: string };
    }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    });

    if (data.token) {
      await setToken(data.token);
    }
    return data;
  },
};
