// ============================================
// api.js — URL centralisée du backend
// En développement : localhost:5000
// En production : URL Render (depuis .env)
// ============================================

export const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';