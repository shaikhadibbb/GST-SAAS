import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePartnerStatus, usePartnerApply } from '@/hooks/usePartner'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Building, Globe, Fingerprint, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import DashboardV2 from './Dashboard'

export default function PartnerApply() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: status, isLoading } = usePartnerStatus()
  const apply = usePartnerApply()
  
  const [formData, setFormData] = useState({
    firmName: '',
    firmGstin: '',
    firmWebsite: '',
  })

  // If already active, show the dashboard
  if (status?.status === 'ACTIVE') {
    return <DashboardV2 />
  }

  // If pending, show a pending screen
  if (status?.status === 'PENDING_APPROVAL') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
          <Fingerprint size={32} />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">Application Under Review</h2>
        <p className="text-slate-500 max-w-md">
          Your CA Partner application for <strong>{status.firmName}</strong> is currently being reviewed by our team. We'll notify you via email once approved.
        </p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apply.mutateAsync(formData)
      toast.success('Partner application submitted successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application')
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-3">Join the GSTPro CA Partner Program</h1>
        <p className="text-slate-500">
          Earn a 20% commission on client subscriptions, manage all your clients from a single dashboard, and provide a white-labeled experience.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-8 py-6">
          <h2 className="text-lg font-bold text-slate-900">Firm Profile</h2>
          <p className="text-sm text-slate-500">Tell us about your practice to get verified.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <Building size={16} className="text-slate-400"/> Firm Name *
              </label>
              <input
                required
                type="text"
                value={formData.firmName}
                onChange={e => setFormData({ ...formData, firmName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                placeholder="e.g. Sharma & Associates"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                  <Fingerprint size={16} className="text-slate-400"/> Firm GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={formData.firmGstin}
                  onChange={e => setFormData({ ...formData, firmGstin: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-sm"
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                  <Globe size={16} className="text-slate-400"/> Website (Optional)
                </label>
                <input
                  type="url"
                  value={formData.firmWebsite}
                  onChange={e => setFormData({ ...formData, firmWebsite: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="https://"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={apply.isPending || !formData.firmName}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {apply.isPending ? 'Submitting...' : 'Submit Application'}
              {!apply.isPending && <ArrowRight size={18} />}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
