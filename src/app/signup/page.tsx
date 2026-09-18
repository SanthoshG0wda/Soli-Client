'use client';

import React, { useState } from 'react';
import { AuthCard } from '@/components/auth/auth-card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/auth/password-input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { formatErrorMessage } from '@/lib/api';

export default function SignupPage() {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live password validation checks
  const isLengthValid = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }
    if (!isLengthValid || !hasLetter || !hasNumber) {
      setError('Password must be at least 8 characters long and contain both letters and digits.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });
    } catch (err: unknown) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Create your Soli account"
      subtitle="Access Indian criminal law & cybercrime intelligence"
      errorMessage={error}
      footerPrompt="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/login"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
        {/* Full Name */}
        <Input
          label="Full Name"
          type="text"
          id="full_name"
          name="name"
          autoComplete="name"
          required
          placeholder="Advocate Priya Sen"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={isSubmitting}
        />

        {/* Email */}
        <Input
          label="Work Email"
          type="email"
          id="email"
          name="email"
          autoComplete="username"
          required
          placeholder="priya.sen@highcourt.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />

        {/* Password */}
        <PasswordInput
          label="Password"
          id="new-password"
          name="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
        />

        {/* Password requirement checklist */}
        {password.length > 0 && (
          <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/70 text-[11px] flex flex-col gap-1 text-stone-500">
            <span className={isLengthValid ? 'text-emerald-700 font-medium' : ''}>
              {isLengthValid ? '✓' : '•'} At least 8 characters
            </span>
            <span className={hasLetter && hasNumber ? 'text-emerald-700 font-medium' : ''}>
              {hasLetter && hasNumber ? '✓' : '•'} Contains both letters and numbers
            </span>
          </div>
        )}

        {/* Confirm Password */}
        <PasswordInput
          label="Confirm Password"
          id="confirm-password"
          name="confirm-password"
          autoComplete="new-password"
          required
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isSubmitting}
        />
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-xs text-rose-600 font-medium -mt-2">
            Passwords do not match
          </p>
        )}

        {/* Submit CTA */}
        <Button
          type="submit"
          size="md"
          isLoading={isSubmitting}
          className="w-full mt-3"
        >
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
