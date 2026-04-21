import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../api/authService'
import { ToastProvider, useToast } from '../../components/common/Toast'
import { FieldError } from '../../components/common/Feedback'
import { Stethoscope, Eye, EyeOff, User, Briefcase, ArrowRight, Check } from 'lucide-react'

function RegisterForm() {
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '', role: 'PATIENT'
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const set = (field, val) => {
    setForm(f => ({...f, [field]: val}))
    setErrors(e => ({...e, [field]: ''}))
  }

  const validate = () => {
    const e = {}
    if (!form.fullName.trim())     e.fullName = 'Full name is required'
    if (!form.email.trim())        e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password)            e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        // Validation error map from backend
        const mapped = {}
        Object.entries(data.errors).forEach(([k, v]) => { mapped[k] = v })
        setErrors(mapped)
      } else {
        toast.error(data?.error || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-navy-700 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="font-serif text-xl text-navy-900">MediBook</span>
          </Link>
        </div>

        <h1 className="font-serif text-3xl text-navy-900 mb-1">Create account</h1>
        <p className="text-slate-500 text-sm mb-8">
          Already have one?{' '}
          <Link to="/login" className="text-navy-600 font-medium hover:underline">Sign in</Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">I am a…</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'PATIENT',  label: 'Patient',  icon: User,      desc: 'Book appointments' },
                { value: 'PROVIDER', label: 'Doctor',   icon: Briefcase, desc: 'Manage my practice' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('role', opt.value)}
                  className={`
                    relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center
                    ${form.role === opt.value
                      ? 'border-navy-600 bg-navy-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                    }
                  `}
                >
                  {form.role === opt.value && (
                    <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-navy-600 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}
                  <opt.icon className={`h-6 w-6 ${form.role === opt.value ? 'text-navy-600' : 'text-slate-400'}`} />
                  <div>
                    <p className={`text-sm font-semibold ${form.role === opt.value ? 'text-navy-700' : 'text-slate-700'}`}>{opt.label}</p>
                    <p className="text-xs text-slate-400">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
            <input
              type="text"
              className={`input-field ${errors.fullName ? 'border-red-300' : ''}`}
              placeholder="Dr. Jane Smith"
              value={form.fullName}
              onChange={e => set('fullName', e.target.value)}
            />
            <FieldError message={errors.fullName} />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
            <input
              type="email"
              className={`input-field ${errors.email ? 'border-red-300' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
            <FieldError message={errors.email} />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className={`input-field pr-10 ${errors.password ? 'border-red-300' : ''}`}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={e => set('password', e.target.value)}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError message={errors.password} />
          </div>

          {form.role === 'PROVIDER' && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
              <strong>Note:</strong> After registering, you'll need to complete your doctor profile. Your account will be reviewed by an admin before you can accept appointments.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base mt-2"
          >
            {loading ? 'Creating account…' : (<>Create Account <ArrowRight className="h-4 w-4" /></>)}
          </button>

          <p className="text-xs text-slate-400 text-center">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return <ToastProvider><RegisterForm /></ToastProvider>
}
