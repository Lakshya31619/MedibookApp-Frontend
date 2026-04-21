import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/common/Spinner'
import { Stethoscope, AlertCircle } from 'lucide-react'

export default function OAuth2Callback() {
  const [searchParams] = useSearchParams()
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('No authentication token received. Please try signing in again.')
      return
    }

    loginWithToken(token)
      .then(user => {
        const dest =
          user.role === 'ADMIN'    ? '/admin/dashboard' :
          user.role === 'PROVIDER' ? '/provider/dashboard' :
          '/patient/dashboard'
        navigate(dest, { replace: true })
      })
      .catch(() => {
        setError('Authentication failed. Please try again.')
      })
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="font-serif text-xl text-slate-900 mb-2">Sign-in failed</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <a href="/login" className="btn-primary inline-block">Back to Login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="h-9 w-9 rounded-xl bg-navy-700 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span className="font-serif text-2xl text-navy-900">MediBook</span>
        </div>
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-slate-500">Completing sign-in…</p>
      </div>
    </div>
  )
}
