import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import PublicNav from '../../components/layout/PublicNav'
import ProviderCard from '../../components/common/ProviderCard'
import { ToastProvider } from '../../components/common/Toast'
import { EmptyState } from '../../components/common/Feedback'
import Spinner from '../../components/common/Spinner'
import { getVerifiedProviders, searchProviders, getBySpecialization } from '../../api/providerService'
import { Search, Filter, X, Users } from 'lucide-react'

const SPECS = [
  'All', 'Cardiology', 'Dermatology', 'Orthopedics', 'Neurology',
  'Pediatrics', 'Ophthalmology', 'ENT', 'General Medicine', 'Psychiatry', 'Gynecology'
]

function ProviderDirectoryInner() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [providers, setProviders] = useState([])
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState(searchParams.get('q') || '')
  const [activeSpec, setActiveSpec] = useState(searchParams.get('spec') || 'All')
  const [availOnly, setAvailOnly] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let data
      if (query.trim()) {
        const res = await searchProviders(query.trim())
        data = res.data
      } else if (activeSpec && activeSpec !== 'All') {
        const res = await getBySpecialization(activeSpec)
        data = res.data
      } else {
        const res = await getVerifiedProviders()
        data = res.data
      }
      setProviders(availOnly ? data.filter(p => p.isAvailable) : data)
    } catch {
      setProviders([])
    } finally {
      setLoading(false)
    }
  }, [query, activeSpec, availOnly])

  useEffect(() => { load() }, [load])

  const handleSearch = (e) => {
    e.preventDefault()
    setActiveSpec('All')
  }

  const handleSpecClick = (spec) => {
    setActiveSpec(spec)
    setQuery('')
    setSearchParams(spec !== 'All' ? { spec } : {})
  }

  const clearFilters = () => {
    setQuery('')
    setActiveSpec('All')
    setAvailOnly(false)
    setSearchParams({})
  }

  const hasFilters = query || activeSpec !== 'All' || availOnly

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />

      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="font-serif text-3xl text-navy-900 mb-1">Find a Doctor</h1>
          <p className="text-slate-500 text-sm mb-6">Browse {providers.length} verified healthcare providers</p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, specialization, clinic…"
                className="input-field pl-9"
              />
            </div>
            <button type="submit" className="btn-primary px-5">Search</button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-6">
          {/* Spec pills — scrollable */}
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1 scrollbar-hide">
            {SPECS.map(s => (
              <button
                key={s}
                onClick={() => handleSpecClick(s)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  activeSpec === s
                    ? 'bg-navy-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-navy-300 hover:text-navy-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {/* Available toggle */}
          <label className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
            <div
              onClick={() => setAvailOnly(!availOnly)}
              className={`relative w-9 h-5 rounded-full transition-colors ${availOnly ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${availOnly ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-xs font-medium text-slate-600">Available only</span>
          </label>
          {hasFilters && (
            <button onClick={clearFilters} className="flex-shrink-0 flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : providers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No providers found"
            description="Try adjusting your search or filters."
            action={hasFilters && <button onClick={clearFilters} className="btn-secondary text-sm">Clear filters</button>}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {providers.map(p => (
              <ProviderCard key={p.providerId} provider={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProviderDirectory() {
  return <ToastProvider><ProviderDirectoryInner /></ToastProvider>
}
