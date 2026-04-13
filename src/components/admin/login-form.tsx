'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/src/lib/supabase-browser';

type Step = 'idle' | 'sending' | 'sent' | 'error';

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/admin';

  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // If redirected here after a failed session check, show a subtle message
  const [redirected] = useState(() => searchParams.has('next'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('sending');
    setErrorMessage('');

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setStep('error');
    } else {
      setStep('sent');
    }
  };

  if (step === 'sent') {
    return (
      <div className="rounded-sm border border-accent/30 bg-accent/5 px-5 py-4 text-sm text-foreground">
        <p className="font-light">Check your inbox.</p>
        <p className="mt-1 text-muted-foreground">
          A magic link was sent to <span className="text-foreground">{email}</span>.
          Click it to sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {redirected && step === 'idle' && (
        <p className="text-xs text-muted-foreground">
          You need to sign in to access that page.
        </p>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-light tracking-wider uppercase text-muted-foreground mb-2"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={step === 'sending'}
          placeholder="you@example.com"
          className="w-full border-b border-border bg-transparent pb-2 text-foreground placeholder:text-muted-foreground/40 focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
        />
      </div>

      {step === 'error' && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={step === 'sending' || !email}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-foreground bg-foreground px-8 py-3 text-sm font-light tracking-wider uppercase text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {step === 'sending' ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Sending…</span>
          </>
        ) : (
          <span>Send magic link</span>
        )}
      </button>
    </form>
  );
}
