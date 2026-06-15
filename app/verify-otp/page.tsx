'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function VerifyOtp() {
          const [otp, setOtp] = useState('');
          const [message, setMessage] = useState('');
          const searchParams = useSearchParams();
          const email = searchParams.get('email');
          const router = useRouter();

          const handleSubmit = async (e: React.FormEvent) => {
                    e.preventDefault();
                    const res = await fetch('http://localhost:8081/api/auth/verify-otp', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email, otp })
                    });
                    const data = await res.text();
                    setMessage(data);
                    if (res.ok) router.push('/login');
          };

          return (
                    <main style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
                              <h1>Verify OTP</h1>
                              <p>Check your Spring Boot terminal for the 6-digit code</p>
                              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} required />
                                        <button type="submit">Verify</button>
                              </form>
                              <p>{message}</p>
                    </main>
          );
}