const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
const API_URL = `${BASE_URL}/api/v1`;

const getHeaders = (options = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('aura_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };
};

const handleResponse = async (res) => {
    let data = null;
    try {
        data = await res.json();
    } catch (e) {
        // No json body
    }

    if (!res.ok) {
        const errorMsg = data?.message || `Request failed with status ${res.status}`;
        const error = new Error(errorMsg);
        error.status = res.status;
        error.data = data;
        throw error;
    }

    return data;
};

export const apiClient = {
    async request(url, options = {}) {
        const fullUrl = url.startsWith('http') || url.startsWith('/') 
            ? url 
            : `${API_URL}/${url}`;

        const config = {
            ...options,
            headers: options.body instanceof FormData 
                ? {
                    ...(options.headers || {}),
                    ...(typeof window !== 'undefined' && localStorage.getItem('aura_token')
                        ? { 'Authorization': `Bearer ${localStorage.getItem('aura_token')}` }
                        : {})
                  }
                : getHeaders(options)
        };

        if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const res = await fetch(fullUrl, config);
            return await handleResponse(res);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(`API Error on ${url}:`, err);
            }
            throw err;
        }
    },

    get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    },

    post(url, body, options = {}) {
        return this.request(url, { ...options, method: 'POST', body });
    },

    patch(url, body, options = {}) {
        return this.request(url, { ...options, method: 'PATCH', body });
    },

    delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
};
