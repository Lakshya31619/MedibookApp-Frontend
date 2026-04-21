import React from 'react'
import { AlertCircle, SearchX, Calendar, Inbox } from 'lucide-react'

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-700">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-semibold text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="font-serif text-xl text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-xs mb-5">{description}</p>}
      {action}
    </div>
  )
}

export function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-500">{message}</p>
}
