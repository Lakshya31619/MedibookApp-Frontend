import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ToastProvider, useToast } from '../../components/common/Toast'
import { FieldError } from '../../components/common/Feedback'
import { Stethoscope, Eye, EyeOff, ArrowRight } from 'lucide-react'

function LoginForm() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const from = location.state?.from?.pathname

  const validate = () => {
    const e = {}
    if (!form.email)    e.email    = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.fullName}!`)
      const dest = from || (
        user.role === 'ADMIN'    ? '/admin/dashboard' :
        user.role === 'PROVIDER' ? '/provider/dashboard' :
        '/patient/dashboard'
      )
      navigate(dest, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.'
      toast.error(msg)
      if (msg.toLowerCase().includes('password')) setErrors({ password: msg })
      else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account')) setErrors({ email: msg })
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = () => {
    window.location.href = `${import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8081'}/oauth2/authorization/google`
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{
                width: `${200 + i * 80}px`, height: `${200 + i * 80}px`,
                top: '50%', left: '50%',
                transform: `translate(-50%, -50%)`,
                opacity: 1 - i * 0.15
              }}
            />
          ))}
        </div>
        <div className="relative flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span className="font-serif text-2xl text-white">MediBook</span>
        </div>
        <div className="relative">
          <h2 className="font-serif text-4xl text-white leading-snug mb-4">
            Your health,<br />in trusted hands.
          </h2>
          <p className="text-navy-300 text-base leading-relaxed max-w-sm">
            Book appointments with verified doctors, manage your health schedule, and connect with healthcare professionals — all in one place.
          </p>
        </div>
        <div className="relative flex items-center gap-6">
          {[['500+', 'Doctors'], ['10k+', 'Patients'], ['98%', 'Satisfaction']].map(([n, l]) => (
            <div key={l}>
              <p className="font-serif text-2xl text-white">{n}</p>
              <p className="text-xs text-navy-400 font-medium">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-navy-700 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="font-serif text-xl text-navy-900">MediBook</span>
          </div>

          <h1 className="font-serif text-3xl text-navy-900 mb-1">Sign in</h1>
          <p className="text-slate-500 text-sm mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-navy-600 font-medium hover:underline">Create one</Link>
          </p>

          {/* Google OAuth */}
          <button
            onClick={googleLogin}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 mb-6"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-50 px-3 text-xs text-slate-400 font-medium">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                className={`input-field ${errors.email ? 'border-red-300 focus:ring-red-200' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={e => { setForm(f => ({...f, email: e.target.value})); setErrors(e2 => ({...e2, email: ''})) }}
              />
              <FieldError message={errors.email} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`input-field pr-10 ${errors.password ? 'border-red-300 focus:ring-red-200' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => { setForm(f => ({...f, password: e.target.value})); setErrors(e2 => ({...e2, password: ''})) }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError message={errors.password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base mt-2"
            >
              {loading ? 'Signing in…' : (<>Sign In <ArrowRight className="h-4 w-4" /></>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <ToastProvider><LoginForm /></ToastProvider>
}
