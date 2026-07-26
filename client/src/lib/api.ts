export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function clearAuthAndRedirect() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:unauthorized'));
}

function shouldForceLogout(endpoint: string, status: number): boolean {
  if (status !== 401) return false;
  // Don't logout while attempting to sign in / register
  if (endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register')) {
    return false;
  }
  return true;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      throw new Error(`API Error: ${response.status}`);
    }

    if (shouldForceLogout(endpoint, response.status)) {
      clearAuthAndRedirect();
    }

    const error = new Error(errorData.error || `API Error: ${response.status}`) as Error & {
      status?: number;
      data?: any;
    };
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
}

/** Multipart upload helper (does not force JSON Content-Type). */
export async function uploadApi(
  endpoint: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<any> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}${endpoint}`);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch {
        data = {};
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        if (shouldForceLogout(endpoint, xhr.status)) {
          clearAuthAndRedirect();
        }
        const error = new Error(data.error || `API Error: ${xhr.status}`) as Error & {
          status?: number;
          data?: any;
        };
        error.status = xhr.status;
        error.data = data;
        reject(error);
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

export async function downloadApi(endpoint: string, filename: string): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }
    if (shouldForceLogout(endpoint, response.status)) {
      clearAuthAndRedirect();
    }
    throw new Error(errorData.error || `Download failed: ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
