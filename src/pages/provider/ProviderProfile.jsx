import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { ToastProvider, useToast } from '../../components/common/Toast'
import { FieldError } from '../../components/common/Feedback'
import Spinner from '../../components/common/Spinner'
import { useAuth } from '../../context/AuthContext'
import { getMyProviderProfile, updateProvider, setAvailability } from '../../api/providerService'
import { updateProfile, changePassword } from '../../api/authService'
import { Eye, EyeOff, Save, ToggleLeft, ToggleRight } from 'lucide-react'

const SPECIALIZATIONS = [
  'General Medicine','Cardiology','Dermatology','Orthopedics','Neurology',
  'Pediatrics','Ophthalmology','ENT','Psychiatry','Gynecology','Urology',
  'Oncology','Endocrinology','Nephrology','Pulmonology','Gastroenterology'
]

function ProviderProfileInner() {
  const { user, updateUser } = useAuth()
  const toast = useToast()

  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [toggling, setToggling]   = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const [pForm, setPForm] = useState({
    specialization: '', qualification: '', experienceYears: '',
    bio: '', clinicName: '', clinicAddress: '', consultationFee: '', profilePicUrl: ''
  })
  const [uForm, setUForm] = useState({ fullName: '', phone: '', profilePicUrl: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!user?.userId) return
    getMyProviderProfile(user.userId)
      .then(res => {
        const p = res.data
        setProfile(p)
        setPForm({
          specialization:  p.specialization || '',
          qualification:   p.qualification || '',
          experienceYears: p.experienceYears?.toString() || '',
          bio:             p.bio || '',
          clinicName:      p.clinicName || '',
          clinicAddress:   p.clinicAddress || '',
          consultationFee: p.consultationFee?.toString() || '',
          profilePicUrl:   p.profilePicUrl || '',
        })
        setUForm({
          fullName:      user.fullName || '',
          phone:         user.phone || '',
          profilePicUrl: user.profilePicUrl || '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const handleProviderSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateProvider(profile.providerId, {
        ...pForm,
        experienceYears: Number(pForm.experienceYears) || 0,
        consultationFee: Number(pForm.consultationFee) || 0,
      })
      setProfile(res.data)
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed.')
    } finally { setSaving(false) }
  }

  const handleUserSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateProfile(user.userId, uForm)
      updateUser(res.data.user)
      toast.success('Account details updated.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed.')
    } finally { setSaving(false) }
  }

  const handleAvailability = async () => {
    setToggling(true)
    try {
      await setAvailability(profile.providerId, !profile.isAvailable)
      setProfile(p => ({...p, isAvailable: !p.isAvailable}))
      toast.success(profile.isAvailable ? 'You are now on leave.' : 'You are now available.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Toggle failed.')
    } finally { setToggling(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword.length < 8) { setErrors({ newPassword: 'Min 8 characters' }); return }
    setPwLoading(true)
    try {
      await changePassword(pwForm)
      toast.success('Password changed.')
      setPwForm({ currentPassword: '', newPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password change failed.')
    } finally { setPwLoading(false) }
  }

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-2xl space-y-6">
        <div className="page-header">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your profile and account settings</p>
        </div>

        {/* Availability toggle */}
        {profile && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-base text-navy-900">Availability Status</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {profile.isAvailable ? 'You are currently accepting appointments.' : 'You are marked as on leave.'}
                </p>
              </div>
              <button
                onClick={handleAvailability}
                disabled={toggling || profile.verificationStatus !== 'APPROVED'}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  profile.isAvailable
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {profile.isAvailable
                  ? <ToggleRight className="h-4.5 w-4.5" />
                  : <ToggleLeft className="h-4.5 w-4.5" />
                }
                {toggling ? 'Updating…' : profile.isAvailable ? 'Available' : 'On Leave'}
              </button>
            </div>
          </div>
        )}

        {/* Doctor profile form */}
        {profile && (
          <div className="card">
            <h2 className="font-serif text-base text-navy-900 mb-5">Professional Details</h2>
            <form onSubmit={handleProviderSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialization</label>
                  <select className="input-field" value={pForm.specialization}
                    onChange={e => setPForm(f => ({...f, specialization: e.target.value}))}>
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Qualification</label>
                  <input type="text" className="input-field" value={pForm.qualification}
                    onChange={e => setPForm(f => ({...f, qualification: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience (years)</label>
                  <input type="number" min="0" className="input-field" value={pForm.experienceYears}
                    onChange={e => setPForm(f => ({...f, experienceYears: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Consultation Fee (₹)</label>
                  <input type="number" min="0" className="input-field" value={pForm.consultationFee}
                    onChange={e => setPForm(f => ({...f, consultationFee: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
                <textarea rows={3} className="input-field resize-none" value={pForm.bio}
                  onChange={e => setPForm(f => ({...f, bio: e.target.value}))} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Clinic Name</label>
                  <input type="text" className="input-field" value={pForm.clinicName}
                    onChange={e => setPForm(f => ({...f, clinicName: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Clinic Address</label>
                  <input type="text" className="input-field" value={pForm.clinicAddress}
                    onChange={e => setPForm(f => ({...f, clinicAddress: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Profile Picture URL</label>
                <input type="url" className="input-field" value={pForm.profilePicUrl}
                  onChange={e => setPForm(f => ({...f, profilePicUrl: e.target.value}))} />
              </div>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
                <Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Account details */}
        <div className="card">
          <h2 className="font-serif text-base text-navy-900 mb-5">Account Details</h2>
          <form onSubmit={handleUserSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input type="text" className="input-field" value={uForm.fullName}
                onChange={e => setUForm(f => ({...f, fullName: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input type="tel" className="input-field" value={uForm.phone}
                onChange={e => setUForm(f => ({...f, phone: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" className="input-field bg-slate-50 cursor-not-allowed" value={user?.email || ''} disabled />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
              <Save className="h-4 w-4" />{saving ? 'Saving…' : 'Update Account'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="card">
          <h2 className="font-serif text-base text-navy-900 mb-5">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
              <input type="password" className="input-field" value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({...f, currentPassword: e.target.value}))} placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'}
                  className={`input-field pr-10 ${errors.newPassword ? 'border-red-300' : ''}`}
                  value={pwForm.newPassword}
                  onChange={e => { setPwForm(f => ({...f, newPassword: e.target.value})); setErrors({}) }}
                  placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError message={errors.newPassword} />
            </div>
            <button type="submit" disabled={pwLoading} className="btn-primary flex items-center gap-2 text-sm">
              <Save className="h-4 w-4" />{pwLoading ? 'Updating…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function ProviderProfile() {
  return <ToastProvider><ProviderProfileInner /></ToastProvider>
}
