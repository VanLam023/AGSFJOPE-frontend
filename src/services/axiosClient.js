import axios from "axios";

/**
 * Preconfigured Axios instance for all API calls.
 * - Base URL: http://localhost:8080/api
 * - Request interceptor: auto-attaches Bearer token from localStorage
 * - Response interceptor: on 401, attempts a silent token refresh then retries
 *   the original request once. On refresh failure, clears storage and redirects to /login.
 */
const axiosClient = axios.create({
  // Đỏ nhưng mà xài dc
  baseURL: `${__BASE_URL__}`,
  // timeout: 10000,
  timeout: 30000,
});

// ── Request interceptor: attach Access Token to every outgoing request ──
// Skip Authorization header for public auth endpoints (login, register, etc.)
const PUBLIC_AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/forgot-password",
  "/auth/reset-password", "/auth/verify-reset-token", "/auth/verify-account"];

axiosClient.interceptors.request.use((config) => {
  const isPublic = PUBLIC_AUTH_PATHS.some((path) => config.url?.includes(path));
  if (!isPublic) {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: silent Refresh Token rotation on 401 ──
axiosClient.interceptors.response.use(
  // Pass through successful responses (return res.data directly)
  (res) => res.data,

  async (err) => {
    const originalRequest = err.config;

    // Only attempt refresh if:
    //   1. The server returned 401 (Unauthorized)
    //   2. This request hasn't already been retried (avoid infinite loop)
    //   3. The failing request was NOT itself the refresh endpoint
    const is401 = err.response?.status === 401;
    const notRetried = !originalRequest._retry;
    const notRefreshEndpoint = !originalRequest.url?.includes("/auth/refresh");
    // Don't trigger refresh/redirect for public auth endpoints (login, register, etc.)
    const isPublicAuthPath = PUBLIC_AUTH_PATHS.some((path) => originalRequest.url?.includes(path));

    if (is401 && notRetried && notRefreshEndpoint && !isPublicAuthPath) {
      originalRequest._retry = true; // flag to prevent infinite retry loop

      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          // Call the refresh endpoint directly (bypass interceptor to avoid recursion)
          const refreshResponse = await axios.post(
            `${__BASE_URL__}/auth/refresh`,
            { refreshToken }
          );

          // Backend wraps response: { success, message, data: { accessToken, ... } }
          const newAccessToken =
            refreshResponse.data?.data?.accessToken ??
            refreshResponse.data?.accessToken;

          // Persist the new access token
          localStorage.setItem("token", newAccessToken);

          // Patch the original failed request with the new token and retry it
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        } catch {
          // Refresh failed (token expired or revoked) → force logout
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(err);
        }
      } else {
        // No refresh token found → session gone, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);

export default axiosClient;
