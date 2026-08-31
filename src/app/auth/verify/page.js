'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../supabase';
import Image from 'next/image';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('Verifying your secure link...');
  const [error, setError] = useState(false);

  useEffect(() => {
    // Only run this in the browser, preventing email scanners from triggering it
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    
    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
        if (error) {
          setError(true);
          setStatus('This link has expired or is invalid. Please request a new one.');
        } else {
          setStatus('Verified securely! Redirecting...');
          setTimeout(() => {
            router.push('/reset-password');
          }, 1500);
        }
      });
    } else {
      setError(true);
      setStatus('Invalid secure link.');
    }
  }, [router, searchParams]);

  return (
    <main style={{ 
      minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", 
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)", padding: "20px" 
    }}>
      <div style={{
        maxWidth: "400px", width: "100%", background: "rgba(20, 20, 20, 0.95)",
        padding: "40px", borderRadius: "16px", textAlign: "center",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.15)",
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <div style={{ width: "60px", height: "60px", background: "#ffffff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #d4af37", padding: "8px" }}>
            <Image src="/images/logo.jpg" alt="Logo" width={40} height={40} style={{ objectFit: 'contain' }} />
          </div>
        </div>
        
        {error ? (
          <i className="fa-solid fa-circle-xmark" style={{ fontSize: "2rem", color: "#f87171", marginBottom: "15px" }}></i>
        ) : (
          <i className="fa-solid fa-shield-check fa-fade" style={{ fontSize: "2rem", color: "#d4af37", marginBottom: "15px" }}></i>
        )}
        
        <h2 style={{ color: "#ffffff", fontFamily: "var(--font-serif)", margin: "0 0 10px 0", letterSpacing: "1px" }}>
          Security Check
        </h2>
        <p style={{ color: error ? "#f87171" : "#9ca3af", fontSize: "0.95rem", margin: 0, lineHeight: "1.5" }}>
          {status}
        </p>

        {error && (
          <button 
            onClick={() => router.push('/auth')}
            style={{
              background: "transparent", color: "#d4af37", border: "1px solid #d4af37",
              padding: "10px 20px", borderRadius: "6px", marginTop: "20px",
              cursor: "pointer", fontWeight: "600", width: "100%"
            }}
          >
            Back to Login
          </button>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ background: "#0a0a0a", minHeight: "100vh" }}></div>}>
      <VerifyContent />
    </Suspense>
  );
}
