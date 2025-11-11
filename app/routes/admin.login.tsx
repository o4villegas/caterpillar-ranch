/**
 * Admin Login Page
 *
 * Route: /admin/login
 * Purpose: Admin authentication UI for Caterpillar Ranch admin portal
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      // Verify token is still valid
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            // Already authenticated, redirect to admin dashboard
            navigate('/admin/dashboard');
          } else {
            // Token expired, clear it
            localStorage.removeItem('admin_token');
          }
        })
        .catch(() => {
          // Network error, clear token
          localStorage.removeItem('admin_token');
        });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json() as {
        token?: string;
        user?: { id: number; email: string; name: string | null };
        error?: string;
      };

      if (!response.ok) {
        // Login failed
        toast.error(data.error || 'Login failed');
        return;
      }

      // Login successful
      if (!data.token || !data.user) {
        toast.error('Invalid response from server');
        return;
      }

      const { token, user } = data;

      // Store token in localStorage
      localStorage.setItem('admin_token', token);

      // Store user info (without password)
      localStorage.setItem('admin_user', JSON.stringify(user));

      toast.success(`Welcome back, ${user.name || user.email}!`);

      // Redirect to admin dashboard
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Network error - please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 px-4">
      {/* Background horror elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-lime-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-lime-400 mb-2">
            🐛 The RANCCH
          </h1>
          <p className="text-gray-400 text-lg">Admin Portal</p>
          <p className="text-gray-500 text-sm mt-2">
            Enter the colony...
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-lime-400/30 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/80 border-2 border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all"
                placeholder="admin@caterpillar-ranch.com"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/80 border-2 border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-lime-500 to-cyan-500 hover:from-lime-400 hover:to-cyan-400 disabled:from-gray-700 disabled:to-gray-600 text-gray-900 font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none shadow-lg hover:shadow-lime-500/50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Enter the Colony'
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-center text-xs text-gray-500">
              Admin access only. Unauthorized entry will be... noticed.
            </p>
          </div>
        </div>

        {/* Back to Store Link */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-lime-400 transition-colors text-sm underline"
          >
            ← Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}
