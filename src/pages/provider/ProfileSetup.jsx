import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { ToastProvider, useToast } from '../../components/common/Toast'
import { FieldError } from '../../components/common/Feedback'
import { useAuth } from '../../context/AuthContext'
import { registerProvider, getMyProviderProfile } from '../../api/providerService'
import { ArrowRight, CheckCircle } from 'lucide-react'

const SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Dermatology', 'Orthopedics',
  'Neurology', 'Pediatrics', 'Ophthalmology', 'ENT', 'Psychiatry',
  'Gynecology', 'Urology', 'Oncology', 'Endocrinology', 'Nephrology',
  'Pulmonology', 'Gastroenterology', 'Rheumatology', 'Hematology'
]

function ProfileSetupInner() {
  const { user }  = useAuth()
  const toast     = useToast()
  const navigate  = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [checking, setChecking] = useState(true)
  const [errors, setErrors]     = useState({})

  const [form, setForm] = useState({
    specialization:  '',
    qualification:   '',
    experienceYears: '',
    bio:             '',
    clinicName:      '',
    clinicAddress:   '',
    consultationFee: '',
    profilePicUrl:   '',
  })

  // Redirect if profile already exists
  useEffect(() => {
    if (!user?.userId) return
    getMyProviderProfile(user.userId)
      .then(() => navigate('/provider/dashboard', { replace: true }))
      .catch(err => { if (err.response?.status === 404) setChecking(false) })
  }, [user])

  const set = (field, val) => {
    setForm(f => ({...f, [field]: val}))
    setErrors(e => ({...e, [field]: ''}))
  }

  const validate = () => {
    const e = {}
    if (!form.specialization)        e.specialization  = 'Specialization is required'
    if (!form.qualification.trim())  e.qualification   = 'Qualification is required'
    if (form.experienceYears === '' || isNaN(Number(form.experienceYears)) || Number(form.experienceYears) < 0)
                                     e.experienceYears = 'Enter valid years of experience'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await registerProvider({
        userId:          user.userId,
        specialization:  form.specialization,
        qualification:   form.qualification.trim(),
        experienceYears: Number(form.experienceYears),
        bio:             form.bio.trim() || undefined,
        clinicName:      form.clinicName.trim() || undefined,
        clinicAddress:   form.clinicAddress.trim() || undefined,
        consultationFee: Number(form.consultationFee) || 0,
        profilePicUrl:   form.profilePicUrl.trim() || undefined,
      })
      toast.success('Profile submitted! Awaiting admin approval.')
      navigate('/provider/dashboard', { replace: true })
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setErrors(data.errors)
      else toast.error(data?.error || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return <DashboardLayout><div className="flex justify-center py-20" /></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-2xl">
        <div className="page-header">
          <h1 className="page-title">Set Up Your Profile</h1>
          <p className="page-subtitle">Complete your doctor profile to get started. It will be reviewed by an admin.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Specialization */}
          <div className="card">
            <h2 className="font-serif text-base text-navy-900 mb-4">Professional Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Specialization <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.specialization}
                  onChange={e => set('specialization', e.target.value)}
                  className={`input-field ${errors.specialization ? 'border-red-300' : ''}`}
                >
                  <option value="">Select specialization…</option>
                  {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <FieldError message={errors.specialization} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Qualification <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. MBBS, MD, MS, DNB…"
                  value={form.qualification}
                  onChange={e => set('qualification', e.target.value)}
                  className={`input-field ${errors.qualification ? 'border-red-300' : ''}`}
                />
                <FieldError message={errors.qualification} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Years of Experience <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 8"
                    value={form.experienceYears}
                    onChange={e => set('experienceYears', e.target.value)}
                    className={`input-field ${errors.experienceYears ? 'border-red-300' : ''}`}
                  />
                  <FieldError message={errors.experienceYears} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={form.consultationFee}
                    onChange={e => set('consultationFee', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio / About</label>
                <textarea
                  rows={3}
                  placeholder="Write a short bio about your practice and expertise…"
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  className="input-field resize-none"
                />
              </div>
            </div>
          </div>

          {/* Clinic info */}
          <div className="card">
            <h2 className="font-serif text-base text-navy-900 mb-4">Clinic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Clinic / Hospital Name</label>
                <input
                  type="text"
                  placeholder="e.g. City Heart Care Clinic"
                  value={form.clinicName}
                  onChange={e => set('clinicName', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Clinic Address</label>
                <input
                  type="text"
                  placeholder="e.g. 12 MG Road, Bengaluru, Karnataka 560001"
                  value={form.clinicAddress}
                  onChange={e => set('clinicAddress', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Profile Picture URL</label>
                <input
                  type="url"
                  placeholder="https://…"
                  value={form.profilePicUrl}
                  onChange={e => set('profilePicUrl', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Info note */}
          <div className="rounded-xl bg-navy-50 border border-navy-200 p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-navy-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-navy-700">
              After submission, an admin will review and approve your profile. You'll be able to add slots once approved.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting…' : (<>Submit for Review <ArrowRight className="h-4 w-4" /></>)}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default function ProfileSetup() {
  return <ToastProvider><ProfileSetupInner /></ToastProvider>
}
