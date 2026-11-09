import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { authService } from "./auth";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    let message = res.statusText;

    if (contentType.includes("application/json")) {
      const payload = (await res.json()) as { message?: string };
      message = payload.message || message;
    } else {
      message = (await res.text()) || message;
    }

    throw new ApiError(message, res.status);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  // Add auth headers if token exists
  const authHeaders = authService.getAuthHeaders();
  if (authHeaders.Authorization) {
    headers.Authorization = authHeaders.Authorization;
  }

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(apiUrl(url), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Add auth headers if token exists
    const authHeaders = authService.getAuthHeaders();
    if (authHeaders.Authorization) {
      headers.Authorization = authHeaders.Authorization;
    }

    const res = await fetch(apiUrl(queryKey.join("/") as string), {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
