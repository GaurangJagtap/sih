import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { ShieldCheck, Building2, UserCheck, Lock, AlertCircle, Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';

const demoAccounts = [
  {
    email: 'institution.sunrise@aicte.gov.in',
    label: 'Institution',
    sublabel: 'Sunrise Institute, Pune',
    icon: <Building2 className="w-3.5 h-3.5" />,
    color: 'border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100',
    labelColor: 'text-blue-700',
  },
  {
    email: 'ro.western@aicte.gov.in',
    label: 'Regional Officer',
    sublabel: 'Western Region (Pune)',
    icon: <UserCheck className="w-3.5 h-3.5" />,
    color: 'border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100',
    labelColor: 'text-emerald-700',
  },
  {
    email: 'bureau.approvals@aicte.gov.in',
    label: 'Bureau Officer',
    sublabel: 'National Monitoring',
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    color: 'border-amber-200 bg-amber-50 hover:border-amber-400 hover:bg-amber-100',
    labelColor: 'text-amber-700',
  },
  {
    email: 'evc.committee@aicte.gov.in',
    label: 'EVC Committee',
    sublabel: 'Inspection Panel',
    icon: <UserCheck className="w-3.5 h-3.5" />,
    color: 'border-purple-200 bg-purple-50 hover:border-purple-400 hover:bg-purple-100',
    labelColor: 'text-purple-700',
  },
  {
    email: 'senior.authority@aicte.gov.in',
    label: 'Senior Authority',
    sublabel: 'AICTE Executive HQ',
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    color: 'border-rose-200 bg-rose-50 hover:border-rose-400 hover:bg-rose-100',
    labelColor: 'text-rose-700',
  },
  {
    email: 'admin@aicte.gov.in',
    label: 'Administrator',
    sublabel: 'System Wide Access',
    icon: <Zap className="w-3.5 h-3.5" />,
    color: 'border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100',
    labelColor: 'text-slate-700',
  },
];

export const Login: React.FC = () => {
  const [email, setEmail] = useState('institution.sunrise@aicte.gov.in');
  const [password, setPassword] = useState('Demo@1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
      setError(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute top-1/3 -left-20 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-indigo-900/40 rounded-full" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">AICTE Portal</div>
              <div className="text-blue-200 text-xs">Ministry of Education, GoI</div>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Approval &amp; Compliance<br />
            <span className="text-blue-200">Workflow Platform</span>
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed max-w-sm">
            Intelligent regulatory workflow automation for technical institution approvals,
            compliance tracking, and AI-powered deadline enforcement.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'End-to-end EoA application tracking',
              'AI Multilingual Voice Reminder Agent',
              'Automated lease & document validity alerts',
              'Real-time escalation & pendency monitoring',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-sm text-blue-100">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-blue-300" />
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-blue-300" />
            <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">Smart India Hackathon 2026</span>
          </div>
          <p className="text-blue-200/60 text-[11px]">Team SIH26262 · Problem Statement: AICTE Approval Workflow Automation</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">AICTE Approval Portal</h2>
            <p className="text-xs text-slate-500 mt-1">Regulatory Workflow Automation · SIH26262</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-200/80 p-7">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-sm text-slate-500 mt-1">Sign in to your AICTE regulatory account</p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2.5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="name@aicte.gov.in"
                />
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary justify-center py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>Sign In to Portal <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Demo Switcher */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Demo Login</p>
                <span className="badge badge-blue">All pass: Demo@1234</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => { setEmail(acc.email); setPassword('Demo@1234'); }}
                    className={`p-2.5 text-left rounded-xl border transition-all duration-150 ${email === acc.email ? acc.color + ' ring-1 ring-current' : acc.color}`}
                  >
                    <div className={`flex items-center gap-1.5 font-semibold text-[11px] ${acc.labelColor}`}>
                      {acc.icon}
                      {acc.label}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">{acc.sublabel}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-4">
            © 2026 All India Council for Technical Education · Ministry of Education, GoI
          </p>
        </div>
      </div>
    </div>
  );
};
