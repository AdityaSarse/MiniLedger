import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL is missing");
}

const TOKEN_KEY = "miniledger_token";

export async function setToken(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (e) {
    console.error("Error saving token:", e);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (e) {
    console.error("Error reading token:", e);
    return null;
  }
}

export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (e) {
    console.error("Error removing token:", e);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  let response: Response;

  const authToken = token || (await getToken());

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });
  } catch {
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
