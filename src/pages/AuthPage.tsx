import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/auth';
import { User, Lock, Mail, Loader2 } from 'lucide-react';
import axios from 'axios';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const data = await authApi.login(username, password);
        // After login, fetch user info to put in store
        // We temporarily set token to apiClient through store by calling login
        // But getMe needs the token. We can just set token first.
        useAuthStore.setState({ token: data.access_token });
        const user = await authApi.getMe();
        login(data.access_token, user);
        navigate('/');
      } else {
        await authApi.register({ username, email, password });
        // Automatically login after register
        const data = await authApi.login(username, password);
        useAuthStore.setState({ token: data.access_token });
        const user = await authApi.getMe();
        login(data.access_token, user);
        navigate('/');
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : 'Validation error');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      useAuthStore.setState({ token: null }); // Clear temporary token if failed
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 selection:bg-red-500/30 selection:text-red-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">
            GTR <span className="text-red-500">Hub</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            {isLogin ? 'Sign in to access your presets' : 'Create an account to save presets'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              {isLogin ? 'Username or Email' : 'Username'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                placeholder={isLogin ? 'Enter your username or email' : 'Choose a username'}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                placeholder={isLogin ? 'Enter your password' : 'Create a strong password (min 8 chars)'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-zinc-400 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
