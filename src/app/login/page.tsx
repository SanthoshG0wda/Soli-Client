'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/auth/password-input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { formatErrorMessage } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
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
      title="Welcome back"
      subtitle="Sign in to continue to Soli"
      errorMessage={error}
      footerPrompt="Don't have an account?"
      footerLinkText="Create one"
      footerLinkHref="/signup"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Email Field */}
        <Input
          label="Work Email"
          type="email"
          id="email"
          name="email"
          autoComplete="username"
          required
          placeholder="counsel@chambers.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <PasswordInput
            label="Password"
            id="current-password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between mt-1 text-xs">
          <label className="flex items-center gap-2 text-stone-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-[#CC6242] focus:ring-[#CC6242] accent-[#CC6242]"
            />
            <span>Remember me</span>
          </label>

          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Password reset link will be sent to your registered email address when configured.');
            }}
            className="text-stone-500 hover:text-stone-900 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit CTA */}
        <Button
          type="submit"
          size="md"
          isLoading={isSubmitting}
          className="w-full mt-2"
        >
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
