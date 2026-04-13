import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/src/components/admin/login-form';

export const metadata: Metadata = {
  title: 'Sign In — The Zen Zone',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="mb-12 text-center">
          <a href="/" className="text-sm font-light tracking-widest uppercase text-foreground">
            The Zen Zone
          </a>
          <div className="mx-auto mt-3 h-px w-8 bg-accent" />
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wide text-foreground">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email to receive a magic link.
          </p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-xs text-muted-foreground/50">
          Admin access only
        </p>
      </div>
    </main>
  );
}
