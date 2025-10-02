interface ApiError {
  code: string;
  message: string;
  details?: any;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private getAuthHeaders: () => Record<string, string>;

  constructor(
    baseUrl: string,
    getAuthHeaders: () => Record<string, string>
  ) {
    this.baseUrl = baseUrl;
    this.getAuthHeaders = getAuthHeaders;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error?.message || 'Request failed',
          response.status,
          data.error?.code || 'REQUEST_FAILED',
          data.error?.details
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('API request failed:', error);
      throw new ApiError(
        'Network error occurred',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  async get<T = any>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'API_ERROR';
    this.details = details;
    this.name = 'ApiError';
  }
}

// Create API client instance
const createApiClient = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};

    try {
      const tokens = localStorage.getItem('auth_tokens');
      const user = localStorage.getItem('auth_user');
      
      if (!tokens || !user) return {};

      const { accessToken } = JSON.parse(tokens);
      const { tenant } = JSON.parse(user);

      return {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-Subdomain': tenant?.subdomain || '',
      };
    } catch (error) {
      console.error('Failed to get auth headers:', error);
      return {};
    }
  };

  return new ApiClient(baseUrl, getAuthHeaders);
};

export const apiClient = createApiClient();

// API service interfaces
export interface LoginRequest {
  email: string;
  password: string;
  tenantSubdomain?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantSubdomain: string;
  role?: string;
}

export interface StudentProfileRequest {
  studentId: string;
  admissionDate: string;
  currentGrade: string;
  section?: string;
  rollNumber?: string;
  medicalInfo?: any;
  academicInfo?: any;
  transportInfo?: any;
}

export interface AcademicYearRequest {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface GradeRequest {
  name: string;
  level: number;
  description?: string;
}

export interface SubjectRequest {
  gradeId: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  credits?: number;
}

// API service methods
export const authApi = {
  login: (data: LoginRequest) => apiClient.post('/auth/login', data),
  register: (data: RegisterRequest) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
  refresh: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),
  verify: () => apiClient.get('/auth/verify'),
};

export const studentApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    grade?: string;
    section?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => apiClient.get('/students', params as Record<string, string>),
  
  getProfile: (userId: string) => apiClient.get(`/students/users/${userId}/profile`),
  
  createProfile: (userId: string, data: StudentProfileRequest) => 
    apiClient.post(`/students/users/${userId}/profile`, data),
    
  updateProfile: (userId: string, data: Partial<StudentProfileRequest>) => 
    apiClient.put(`/students/users/${userId}/profile`, data),
    
  deleteProfile: (userId: string) => 
    apiClient.delete(`/students/users/${userId}/profile`),
};

export const academicApi = {
  // Academic Years
  getAcademicYears: (includeInactive?: boolean) => 
    apiClient.get('/academic/years', includeInactive ? { includeInactive: 'true' } : {}),
  
  createAcademicYear: (data: AcademicYearRequest) => 
    apiClient.post('/academic/years', data),

  // Grades
  getGrades: () => apiClient.get('/academic/grades'),
  
  createGrade: (data: GradeRequest) => 
    apiClient.post('/academic/grades', data),

  // Subjects
  createSubject: (data: SubjectRequest) => 
    apiClient.post('/academic/subjects', data),

  // Classes
  getClasses: (params?: { gradeId?: string; semesterId?: string }) => 
    apiClient.get('/academic/classes', params as Record<string, string>),
    
  createClass: (data: {
    gradeId: string;
    semesterId: string;
    name: string;
    capacity?: number;
  }) => apiClient.post('/academic/classes', data),
};

export { ApiError };