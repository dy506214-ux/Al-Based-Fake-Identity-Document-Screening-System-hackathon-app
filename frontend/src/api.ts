const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    throw new Error(data.message || 'API request failed');
  }
  return data;
}

export const api = {
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async fetchStats() {
    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async fetchUsers(params?: Record<string, any>) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/api/admin/users?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async fetchDocuments(params?: Record<string, any>) {
    // filter out empty values
    const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v != null && v !== '' && v !== 'All')
    );
    const query = new URLSearchParams(cleanParams as any).toString();
    const res = await fetch(`${API_BASE}/api/admin/documents?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async fetchAuditLogs(params?: Record<string, any>) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/api/admin/audit-logs?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async submitReview(docId: string, reviewDecision: string, reviewComment: string) {
    const res = await fetch(`${API_BASE}/api/documents/review/${docId}/decision`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reviewDecision, reviewComment })
    });
    return handleResponse(res);
  }
};
