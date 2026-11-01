import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  ShieldCheck, Building2, UserCheck, Lock,
  AlertCircle, Eye, EyeOff, ArrowRight
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    email: 'institution.sunrise@aicte.gov.in',
    label: 'Institution',
    sub: 'Sunrise Institute, Pune',
    icon: <Building2 size={13} />,
    dot: '#2864A5',
  },
  {
    email: 'ro.western@aicte.gov.in',
    label: 'Regional Officer',
    sub: 'Western Region · Pune',
    icon: <UserCheck size={13} />,
    dot: '#268568',
  },
  {
    email: 'bureau.approvals@aicte.gov.in',
    label: 'Bureau Officer',
    sub: 'National Monitoring',
    icon: <ShieldCheck size={13} />,
    dot: '#D99A32',
  },
  {
    email: 'evc.committee@aicte.gov.in',
    label: 'EVC Committee',
    sub: 'Inspection Panel',
    icon: <UserCheck size={13} />,
    dot: '#7C3AED',
  },
  {
    email: 'senior.authority@aicte.gov.in',
    label: 'Senior Authority',
    sub: 'AICTE Executive HQ',
    icon: <ShieldCheck size={13} />,
    dot: '#C64C4C',
  },
  {
    email: 'admin@aicte.gov.in',
    label: 'Administrator',
    sub: 'System-Wide Access',
    icon: <Lock size={13} />,
    dot: '#697586',
  },
];

const FEATURES = [
  'End-to-end EoA application workflow tracking',
  'AI Multilingual Voice Compliance Reminder Agent',
  'Automated lease deed & document validity alerts',
  'Real-time pendency monitoring & auto-escalation',
  'Role-based dashboards for all regulatory tiers',
];

export const Login: React.FC = () => {
  const [email, setEmail]               = useState('institution.sunrise@aicte.gov.in');
  const [password, setPassword]         = useState('Demo@1234');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res  = await api.post('/auth/login', { email, password });
      const data = res.data;
      login(data.access_token, {
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        region: data.region,
        institution_id: data.institution_id,
      });
      navigate(data.role === 'INSTITUTION' ? '/institution/dashboard' : '/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#F5F7FA',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{
          width: '46%',
          minWidth: 420,
          background: 'linear-gradient(160deg, #172B4D 0%, #1D3559 50%, #244B73 100%)',
          padding: '48px 52px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 320, height: 320,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -40,
          width: 240, height: 240,
          borderRadius: '50%',
          background: 'rgba(40,100,165,0.20)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '40%', right: -30,
          width: 160, height: 160,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          pointerEvents: 'none',
        }} />

        {/* Top brand */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 44 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
                AICTE Portal
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginTop: 2 }}>
                Ministry of Education, Government of India
              </div>
            </div>
          </div>

          <h1 style={{
            fontSize: 34, fontWeight: 800, color: '#FFFFFF',
            lineHeight: 1.18, letterSpacing: '-0.02em', marginBottom: 14,
          }}>
            Approval &amp; Compliance<br />
            <span style={{ color: 'rgba(145,179,211,0.90)' }}>Workflow Platform</span>
          </h1>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, maxWidth: 380, marginBottom: 36 }}>
            Intelligent regulatory workflow automation for technical institution approvals,
            compliance monitoring, and AI-powered deadline enforcement.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(71,127,184,0.30)',
                  border: '1px solid rgba(71,127,184,0.50)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#477FB8' }} />
                </div>
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom SIH tag */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 14px', borderRadius: 99,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Smart India Hackathon 2026 · SIH26262
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)' }}>
            Problem Statement: AICTE Approval Workflow Automation & Compliance Monitoring
          </div>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }} className="animate-in">

          {/* Mobile branding */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, margin: '0 auto 12px',
              background: 'linear-gradient(135deg, #172B4D, #2864A5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={24} color="#fff" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy-text)' }}>AICTE Approval Portal</h2>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>Regulatory Workflow Automation · SIH26262</p>
          </div>

          {/* Login card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(23,43,77,0.10)',
            padding: '28px 32px',
          }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy-text)', marginBottom: 4 }}>Sign in</h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Access your AICTE regulatory account</p>
            </div>

            {/* Error alert */}
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: 18 }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="name@aicte.gov.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: 38 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: 4,
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              >
                {loading ? (
                  <>
                    <svg style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating…
                  </>
                ) : (
                  <>Sign In to Portal <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            {/* Demo Accounts */}
            <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Quick Demo Access
                </span>
                <span className="badge badge-blue" style={{ fontSize: 10 }}>Password: Demo@1234</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                {DEMO_ACCOUNTS.map(acc => {
                  const isActive = email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => { setEmail(acc.email); setPassword('Demo@1234'); }}
                      style={{
                        padding: '9px 11px',
                        borderRadius: 9,
                        border: `1.5px solid ${isActive ? acc.dot : 'var(--border)'}`,
                        background: isActive ? acc.dot + '12' : 'var(--bg-surface-2)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 150ms',
                      }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 11.5, fontWeight: 700,
                        color: isActive ? acc.dot : 'var(--text-primary)',
                        marginBottom: 2,
                      }}>
                        <span style={{ color: acc.dot, flexShrink: 0 }}>{acc.icon}</span>
                        {acc.label}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {acc.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 18 }}>
            © 2026 All India Council for Technical Education &nbsp;·&nbsp; Ministry of Education, GoI
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
