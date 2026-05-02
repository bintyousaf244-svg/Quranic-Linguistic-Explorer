import React from 'react';
import { SignIn } from '@clerk/react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--grove-cream)' }}>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={basePath || '/'}
      />
    </div>
  );
}

export function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--grove-cream)' }}>
      <SignIn
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={basePath || '/'}
      />
    </div>
  );
}
