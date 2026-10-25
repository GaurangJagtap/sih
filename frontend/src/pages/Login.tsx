import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { ShieldCheck, Building2, UserCheck, Lock, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('institution.sunrise@aicte.gov.in');
  const [password, setPassword] = useState('Demo@1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data;
      login(data.access_token, {
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        region: data.region,
        institution_id: data.institution_id,
      });

      if (data.role === 'INSTITUTION') {
        navigate('/institution/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to authenticate. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Demo@1234');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <ShieldCheck className="w-10 h-10" />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">AICTE Approval & Compliance System</h2>
        <p className="mt-2 text-sm text-slate-400">
          Integrated Regulatory Workflow Automation & AI Alert Platform (SIH26262)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-800 py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-700">
          {error && (
            <div className="mb-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Official AICTE Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="name@aicte.gov.in or principal@sunrise.edu.in"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Secure Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Authenticating Official Session...' : 'Sign In to Portal'}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-slate-700/80 pt-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              One-Click Demo Account Switcher:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickRole('institution.sunrise@aicte.gov.in')}
                className="p-2 text-left bg-slate-900/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-semibold text-blue-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Institution Portal
                </div>
                <div className="text-[10px] text-slate-400">Sunrise Inst. (Dr. Sharma)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('ro.western@aicte.gov.in')}
                className="p-2 text-left bg-slate-900/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Regional Officer
                </div>
                <div className="text-[10px] text-slate-400">Western Region (RO Pune)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('bureau.approvals@aicte.gov.in')}
                className="p-2 text-left bg-slate-900/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-semibold text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Bureau Officer
                </div>
                <div className="text-[10px] text-slate-400">Consolidated Monitoring</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('senior.authority@aicte.gov.in')}
                className="p-2 text-left bg-slate-900/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-semibold text-purple-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Senior Authority
                </div>
                <div className="text-[10px] text-slate-400">AICTE Executive HQ</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 text-center">
              All demo passwords: <code className="text-slate-300 font-mono">Demo@1234</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
