import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Clock, IndianRupee, User } from 'lucide-react'

export default function ProviderCard({ provider, actionLabel, onAction, linkTo }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onAction) { onAction(provider); return }
    if (linkTo)   { navigate(linkTo); return }
    navigate(`/providers/${provider.providerId}`)
  }

  const initials = provider.clinicName
    ? provider.clinicName.slice(0, 2).toUpperCase()
    : 'DR'

  return (
    <div className="card-hover cursor-pointer group" onClick={handleClick}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-500 flex items-center justify-center text-white font-serif text-lg flex-shrink-0 overflow-hidden">
          {provider.profilePicUrl
            ? <img src={provider.profilePicUrl} alt="" className="h-full w-full object-cover" />
            : <span>{initials}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-base text-navy-900 truncate">
            {provider.clinicName || 'Medical Clinic'}
          </h3>
          <p className="text-sm text-emerald-600 font-medium">{provider.specialization}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs text-slate-600 font-medium">
              {provider.avgRating > 0 ? provider.avgRating.toFixed(1) : 'New'}
            </span>
          </div>
        </div>
        {!provider.isAvailable && (
          <span className="flex-shrink-0 text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">
            On Leave
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1.5 mb-4">
        {provider.clinicAddress && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{provider.clinicAddress}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{provider.experienceYears} yrs experience</span>
        </div>
        {provider.consultationFee > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <IndianRupee className="h-3.5 w-3.5 flex-shrink-0" />
            <span>₹{provider.consultationFee} consultation</span>
          </div>
        )}
      </div>

      <button className="w-full text-sm font-medium text-navy-700 border border-navy-200 rounded-lg py-2 hover:bg-navy-700 hover:text-white hover:border-navy-700 transition-all duration-200">
        {actionLabel || 'View Profile'}
      </button>
    </div>
  )
}
