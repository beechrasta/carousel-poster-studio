import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, User, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

const DEFAULT_USER = 'rachit';
const DEFAULT_PASS = 'Studio2026!Poster#98';

export const AUTH_STORAGE_KEY = 'cps-studio-authenticated-session';

export function isStudioAuthenticated() {
  try {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return true;
    }
    const val = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export function setStudioAuthenticated(remember = true) {
  try {
    if (remember) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
    }
  } catch {}
}

export function lockStudio() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
}

export default function AppLockScreen({ onUnlock }) {
  const [username, setUsername] = useState('rachit');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const expectedUser = (import.meta.env.VITE_APP_USERNAME || import.meta.env.VITE_STUDIO_USER || DEFAULT_USER).trim();
  const expectedPass = (import.meta.env.VITE_APP_PASSWORD || import.meta.env.VITE_STUDIO_PASSWORD || DEFAULT_PASS).trim();

  const handleLogin = (e) => {
    e?.preventDefault();
    setError('');

    if (username.trim().toLowerCase() === expectedUser.toLowerCase() && password === expectedPass) {
      setStudioAuthenticated(rememberMe);
      onUnlock();
    } else {
      setError('Invalid username or password');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'radial-gradient(circle at 50% 20%, #1a1829 0%, #0B0B0B 75%, #050505 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: 20,
      fontFamily: 'Inter, -apple-system, sans-serif'
    }}>
      <div 
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(18, 18, 22, 0.85)',
          border: '1px solid rgba(205, 255, 60, 0.25)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(205, 255, 60, 0.08)',
          backdropFilter: 'blur(20px)',
          padding: '36px 32px',
          animation: isShaking ? 'shake 0.5s ease-in-out' : 'none',
          color: '#FFF'
        }}
      >
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'rgba(205, 255, 60, 0.12)',
            border: '1px solid rgba(205, 255, 60, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            boxShadow: '0 0 20px rgba(205, 255, 60, 0.2)'
          }}>
            <Lock size={26} style={{ color: 'var(--accent-lime, #CDFF3C)' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.04em', margin: 0, color: '#FFF' }}>
            CAROUSEL POSTER STUDIO
          </h1>
          <p style={{ fontSize: 12, color: '#888', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Protected Access • Private Studio
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Username Input */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#AAA', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
              Username
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#09090C',
              border: '1px solid #282830',
              borderRadius: 8,
              padding: '0 12px',
              height: 44
            }}>
              <User size={16} style={{ color: '#666', marginRight: 10 }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. rachit)"
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFF',
                  fontSize: 14,
                  fontWeight: 500
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#AAA', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
              Password
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#09090C',
              border: '1px solid #282830',
              borderRadius: 8,
              padding: '0 12px',
              height: 44
            }}>
              <KeyRound size={16} style={{ color: '#666', marginRight: 10 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter studio password"
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFF',
                  fontSize: 14,
                  fontWeight: 500
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#777',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 6,
              background: 'rgba(255, 60, 60, 0.12)',
              border: '1px solid rgba(255, 60, 60, 0.3)',
              color: '#FF7777',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Remember Me */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#888' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#CDFF3C', width: 15, height: 15 }}
              />
              <span>Remember this browser</span>
            </label>
          </div>

          {/* Unlock Button */}
          <button
            type="submit"
            style={{
              height: 46,
              borderRadius: 8,
              background: 'var(--accent-lime, #CDFF3C)',
              color: '#000',
              fontWeight: 700,
              fontSize: 14,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(205, 255, 60, 0.3)'
            }}
          >
            <span>Unlock Studio</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer info */}
        <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid #222', paddingTop: 16 }}>
          <p style={{ fontSize: 11, color: '#555', margin: 0 }}>
            API endpoints (<code style={{ color: '#888' }}>/api/*</code>) remain open for ChatGPT Actions.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
