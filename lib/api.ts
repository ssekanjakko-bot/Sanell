const BASE_URL = 'http://localhost:8081/api';

export interface RegisterResponse {
  message: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  role: string;
}

export interface VerifyOtpResponse {
  message: string;
  email: string;
}

export interface MomoResponse {
  success: boolean;
  message: string;
  reference?: string;
}

// 1. Register
export const register = async (email: string): Promise<RegisterResponse> => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role: 'freelancer' }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Registration failed');
  }
  return res.json();
};

// 2. Verify OTP
export const verifyOtp = async (email: string, otp: string, password: string): Promise<VerifyOtpResponse> => {
  const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'OTP verification failed');
  }
  return res.json();
};

// 3. Login
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Login failed');
  }
  return res.json();
};

// 4. LIVE PAYMENT - FIXED - No more Load failed
export const payWithMomo = async (phone: string, amount: number, orderId: string): Promise<MomoResponse> => {
  const res = await fetch('/api/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, amount, orderId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Momo request failed - check phone & balance');
  }
  return res.json();
};
