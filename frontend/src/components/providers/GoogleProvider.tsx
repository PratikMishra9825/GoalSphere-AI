"use client";

import { GoogleOAuthProvider } from '@react-oauth/google';

export function GoogleProvider({ children }: { children: React.ReactNode }) {
  // Use env variable or fallback for safety in build environments
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '958393575512-fj2ppdgn1q8s4cvng19a3e35lvh9psd5.apps.googleusercontent.com';
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
