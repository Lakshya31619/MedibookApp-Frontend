import React from 'react'
import { Link } from 'react-router-dom'
import PublicNav from '../../components/layout/PublicNav'
import { ToastProvider } from '../../components/common/Toast'
import { Search, Shield, Clock, Star, ArrowRight, Stethoscope, HeartPulse, Activity } from 'lucide-react'

const SPECIALIZATIONS = [
  'Cardiology', 'Dermatology', 'Orthopedics', 'Neurology',
  'Pediatrics', 'Ophthalmology', 'ENT', 'General Medicine'
]

const FEATURES = [
  {
    icon: Search,
    title: 'Find the Right Doctor',
    desc: 'Search by specialization, location, or availability. Browse verified profiles with ratings.'
  },
  {
    icon: Shield,
    title: 'Admin-Verified Providers',
    desc: 'Every doctor on MediBook is reviewed and approved by our admin team before going live.'
  },
  {
    icon: Clock,
    title: 'Real-Time Slot Booking',
    desc: 'See live availability, pick a slot that suits you, and confirm your appointment instantly.'
  },
]

export default function LandingPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-white">
        <PublicNav />

        {/* Hero */}
        <section className="relative bg-navy-900 overflow-hidden">
          {/* Decorative rings */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <div key={i}
                className="absolute rounded-full border border-white/5"
                style={{
                  width: `${500 + i * 200}px`, height: `${500 + i * 200}px`,
                  top: '-20%', right: '-15%',
                  transform: 'translate(20%, -20%)',
                }}
              />
            ))}
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-32">
            <div className="max-w-3xl animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-6 border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
                Trusted by 10,000+ patients
              </div>
              <h1 className="font-serif text-5xl lg:text-6xl text-white leading-tight mb-6">
                Healthcare appointments,<br />
                <span className="text-emerald-400">simplified.</span>
              </h1>
              <p className="text-navy-300 text-lg mb-10 max-w-xl leading-relaxed">
                Connect with verified healthcare professionals. Book, manage, and track your appointments — all from one secure platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/providers" className="inline-flex items-center justify-center gap-2 bg-white text-navy-900 font-semibold px-6 py-3.5 rounded-xl hover:bg-slate-100 transition-colors">
                  <Search className="h-4.5 w-4.5" />
                  Find a Doctor
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-emerald-600 transition-colors">
                  Get Started
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <div className="bg-navy-800 border-y border-navy-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-3 divide-x divide-navy-700">
            {[['500+', 'Verified Doctors'], ['10k+', 'Appointments'], ['50+', 'Specializations']].map(([n, l]) => (
              <div key={l} className="flex flex-col items-center py-1">
                <span className="font-serif text-2xl text-white">{n}</span>
                <span className="text-xs text-navy-400 font-medium">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Specializations */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="page-header text-center">
            <p className="section-label">Browse by Specialty</p>
            <h2 className="font-serif text-3xl text-navy-900">Find care for every need</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SPECIALIZATIONS.map(spec => (
              <Link
                key={spec}
                to={`/providers?spec=${encodeURIComponent(spec)}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-navy-300 hover:shadow-card transition-all duration-200 group"
              >
                <div className="h-9 w-9 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0 group-hover:bg-navy-100 transition-colors">
                  <HeartPulse className="h-4.5 w-4.5 text-navy-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-navy-700">{spec}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
            <div className="page-header text-center">
              <p className="section-label">Why MediBook</p>
              <h2 className="font-serif text-3xl text-navy-900">Built for better healthcare</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map(f => (
                <div key={f.title} className="card">
                  <div className="h-11 w-11 rounded-xl bg-navy-700 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-serif text-lg text-navy-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="bg-navy-900 rounded-3xl px-8 py-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <Activity className="absolute h-64 w-64 text-white -top-8 -right-8" />
            </div>
            <div className="relative">
              <h2 className="font-serif text-4xl text-white mb-4">Ready to take charge of your health?</h2>
              <p className="text-navy-300 mb-8 max-w-md mx-auto">Join thousands of patients and doctors who trust MediBook for seamless healthcare.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register?role=PATIENT"  className="inline-flex items-center justify-center gap-2 bg-white text-navy-900 font-semibold px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors">
                  Book an Appointment
                </Link>
                <Link to="/register?role=PROVIDER" className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
                  Join as a Doctor
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-100 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-navy-700 flex items-center justify-center">
                <Stethoscope className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-serif text-base text-navy-900">MediBook</span>
            </div>
            <p className="text-xs text-slate-400">© 2024 MediBook. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </ToastProvider>
  )
}
