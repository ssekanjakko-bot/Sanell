export const dynamic = 'force-dynamic'
'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function VerifyOtpForm() {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    // ... rest of your logic
  };

  return (
    // ... your JSX form here
    <form onSubmit={handleSubmit}>...</form>
  )
}

export default function VerifyOtp() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpForm />
    </Suspense>
  )
}
