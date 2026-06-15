const MOCK_MODE = true;
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

const mockDelay = () => new Promise(resolve => setTimeout(resolve, 500));

// 1. Register - Only freelancers allowed
export const register = async (email: string, role: string = 'freelancer'): Promise<RegisterResponse> => {
          if (MOCK_MODE) {
                    await mockDelay();

                    // Enforce freelancer only in mock mode too
                    if (role !== 'freelancer') {
                              throw new Error('Only freelancer accounts can be created');
                    }

                    console.log(`[MOCK] Register: ${email} as ${role}`);
                    return {
                              message: 'OTP sent to your email',
                              email,
                              role: 'freelancer'
                    };
          }

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
          if (MOCK_MODE) {
                    await mockDelay();

                    if (otp !== '123456') {
                              throw new Error('Invalid OTP. Use 123456 for mock mode');
                    }

                    console.log(`[MOCK] Verify OTP for: ${email}`);
                    return {
                              message: 'Account verified successfully',
                              email
                    };
          }

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
          if (MOCK_MODE) {
                    await mockDelay();

                    if (password.length < 6) {
                              throw new Error('Password must be at least 6 characters');
                    }

                    console.log(`[MOCK] Login: ${email} as freelancer`);
                    return {
                              token: 'mock-jwt-token-freelancer',
                              email,
                              role: 'freelancer'
                    };
          }

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