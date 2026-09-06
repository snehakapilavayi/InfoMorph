'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Sparkles,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface AuthScreenProps {
  onDemoLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onDemoLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    if (!supabase) {
      setErrorMessage('Supabase is not configured yet. You can use Quick Demo Access to explore InfoMorph immediately.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (error) throw error;

        if (data.session) {
          setInfoMessage('Account created and signed in successfully!');
        } else {
          setInfoMessage('Registration successful! Please check your email inbox to confirm your account.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });
        if (error) throw error;
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please check your credentials.';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setErrorMessage('Incorrect email or password. Please try again or create a new account.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address first to receive a password reset link.');
      return;
    }

    if (!supabase) {
      setErrorMessage('Supabase is not configured yet. Please use Quick Demo Access.');
      return;
    }

    setIsResettingPassword(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`
      });
      if (error) throw error;
      setInfoMessage(`Password reset link sent to ${email.trim()}. Please check your email.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to send password reset email.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F7F9F6] text-[#172019] relative overflow-hidden p-6 select-none antialiased">
      {/* Subtle Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#8DBF67]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#477A3C]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="max-w-md w-full bg-white border border-[#DCE7D9] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 relative z-10 flex flex-col items-center animate-fadeIn">
        {/* Logo & Headline */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#38622F] to-[#5C944F] flex items-center justify-center text-white shadow-md shadow-[#477A3C]/20 mb-3.5">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172019]">
            {isSignUp ? 'Create your Account' : 'Welcome to InfoMorph'}
          </h1>
          <p className="text-xs text-[#627063] mt-1 max-w-xs leading-relaxed">
            Multi-modal content transformation &amp; grounding verification platform
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="w-full flex p-1 bg-[#F2F6F0] rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isSignUp
                ? 'bg-white text-[#172019] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isSignUp
                ? 'bg-white text-[#172019] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="w-full mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="w-full mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Primary Action: Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-[#DCE7D9] focus:outline-none focus:border-[#477A3C] focus:ring-2 focus:ring-[#477A3C]/20 bg-[#FAFDF9] transition"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isResettingPassword}
                  className="text-[11px] text-[#477A3C] hover:text-[#345B2B] font-medium transition cursor-pointer disabled:opacity-50"
                >
                  {isResettingPassword ? 'Sending reset link...' : 'Forgot password?'}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-[#DCE7D9] focus:outline-none focus:border-[#477A3C] focus:ring-2 focus:ring-[#477A3C]/20 bg-[#FAFDF9] transition"
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {isSignUp && (
              <p className="text-[11px] text-gray-400 mt-1">Must be at least 6 characters</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#477A3C] hover:bg-[#3A6331] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="w-full flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#EDF3EB]" />
          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-[#EDF3EB]" />
        </div>

        {/* Quick Demo Access Button */}
        <button
          onClick={onDemoLogin}
          className="w-full h-11 bg-[#EAF4E3] hover:bg-[#DEEED4] text-[#345B2B] border border-[#8DBF67]/50 rounded-xl px-4 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-[0.99]"
          type="button"
        >
          <UserCheck className="w-4 h-4 text-[#477A3C]" />
          <span>Quick Demo Access (Instant Entry)</span>
        </button>

        {/* Grounding Compliance Badge */}
        <div className="mt-7 pt-4 border-t border-[#F0F5EE] w-full flex items-center justify-center gap-1.5 text-[11px] text-[#657563]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#477A3C]" />
          <span>Secured with Supabase Auth &amp; RLS Policies</span>
        </div>
      </div>
    </div>
  );
};
