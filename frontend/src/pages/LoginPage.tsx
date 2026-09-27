import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Button } from '../components/UI/Button';

export const LoginPage: React.FC = () => {
  const [username, setUsernameInput] = useState('admin');
  const [password, setPasswordInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await authApi.login(username, password);
      login(res.username, res.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-fin-text flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 rounded-lg border border-fin-border bg-white shadow-sm overflow-hidden">
        
        {/* Left Identity Section */}
        <div className="p-8 bg-[#F8FAFC] border-b md:border-b-0 md:border-r border-fin-border flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-1.5 rounded bg-blue-50 border border-blue-200 text-fin-accent">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-sans font-bold text-base text-fin-text tracking-tight">
                FIN<span className="text-fin-accent">TRACE</span>
              </span>
            </div>

            <h1 className="text-base font-semibold text-fin-text mb-2 leading-snug">
              Financial Crime & Insider Risk Intelligence
            </h1>
            <p className="text-xs text-fin-subtext leading-relaxed">
              Investigation platform combining rule detection engines, Isolation Forest anomaly scoring, and entity relationship graph analysis.
            </p>
          </div>

          <div className="pt-4 border-t border-fin-border text-xs text-fin-muted">
            FINTRACE Platform • 2026
          </div>
        </div>

        {/* Right Auth Section */}
        <div className="p-8 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-fin-text flex items-center gap-2 font-sans">
                <KeyRound className="h-4 w-4 text-fin-accent" />
                Sign In
              </h2>
              <p className="text-xs text-fin-subtext mt-1">
                Enter credentials to access investigation workspaces.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-sans flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fin-subtext mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-fin-muted" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-white border border-fin-border rounded px-3 py-2 pl-9 text-xs text-fin-text focus:border-fin-accent focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="admin"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-fin-subtext mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-fin-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-white border border-fin-border rounded px-3 py-2 pl-9 text-xs text-fin-text focus:border-fin-accent focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-fin-border text-center">
            <span className="text-xs text-fin-muted">
              Security: <span className="text-fin-subtext">Enterprise Token Authentication</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
