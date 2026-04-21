import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import ProviderCard from '../../components/common/ProviderCard'
import { ToastProvider } from '../../components/common/Toast'
import { EmptyState } from '../../components/common/Feedback'
import Spinner from '../../components/common/Spinner'
import { getVerifiedProviders, searchProviders, getBySpecialization } from '../../api/providerService'
import { Search, X, Users } from 'lucide-react'

const SPECS = ['All', 'Cardiology', 'Dermatology', 'Orthopedics', 'Neurology', 'Pediatrics', 'Ophthalmology', 'ENT', 'General Medicine']

function BrowseProvidersInner() {
  const navigate = useNavigate()
  const [providers, setProviders] = useState([])
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState('')
  const [activeSpec, setActiveSpec] = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let data
      if (query.trim()) {
        data = (await searchProviders(query.trim())).data
      } else if (activeSpec !== 'All') {
        data = (await getBySpecialization(activeSpec)).data
      } else {
        data = (await getVerifiedProviders()).data
      }
      setProviders(data)
    } catch { setProviders([]) }
    finally  { setLoading(false) }
  }, [query, activeSpec])

  useEffect(() => { load() }, [load])

  const handleSearch = (e) => { e.preventDefault(); setActiveSpec('All') }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Find a Doctor</h1>
          <p className="page-subtitle">{providers.length} verified doctors available</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-5 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search doctors, specializations…"
              className="input-field pl-9"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary">Search</button>
        </form>

        {/* Spec pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {SPECS.map(s => (
            <button key={s} onClick={() => { setActiveSpec(s); setQuery('') }}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                activeSpec === s ? 'bg-navy-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-navy-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : providers.length === 0 ? (
          <EmptyState icon={Users} title="No doctors found" description="Try a different search or specialization." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map(p => (
              <ProviderCard
                key={p.providerId}
                provider={p}
                actionLabel="Book Appointment"
                onAction={() => navigate(`/patient/slots/${p.providerId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function BrowseProviders() {
  return <ToastProvider><BrowseProvidersInner /></ToastProvider>
}
