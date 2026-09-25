const API_BASE_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL.trim()
    : "https://aor-q19z.onrender.com";

export default API_BASE_URL;