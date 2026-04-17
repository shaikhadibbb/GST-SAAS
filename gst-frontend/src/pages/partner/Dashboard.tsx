import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePartnerDashboard, usePartnerClients, usePartnerInviteClient } from '@/hooks/usePartner'
import { Users, TrendingUp, AlertTriangle, IndianRupee, Link as LinkIcon, Download, Search, CheckCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export default function PartnerDashboard() {
  const { data: dashboard, isLoading: loadingDash } = usePartnerDashboard()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data: clientsData, isLoading: loadingClients } = usePartnerClients({ page, limit: 10, search })
  const inviteClient = usePartnerInviteClient()

  const [inviteEmail, setInviteEmail] = useState('')

  if (loadingDash) return <div className="p-8 text-center text-slate-500">Loading partner dashboard...</div>

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    try {
      const res = await inviteClient.mutateAsync({ email: inviteEmail })
      toast.success(res.message || 'Invitation sent')
      setInviteEmail('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invite')
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50'
    if (score >= 50) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Partner Portal</h1>
          <p className="text-slate-500 mt-1">Manage ${dashboard?.partner?.firmName}'s clients and commissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 shadow-sm transition-all">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0}} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={20}/></div>
            <h3 className="font-bold text-slate-600 text-sm tracking-tight">Active Clients</h3>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">{dashboard?.activeClients}</p>
        </motion.div>
        
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={20}/></div>
            <h3 className="font-bold text-slate-600 text-sm tracking-tight">At-Risk</h3>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">{dashboard?.atRiskClients}</p>
        </motion.div>

        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="bg-indigo-600 p-5 rounded-2xl text-white shadow-lg shadow-indigo-100 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <CheckCircle size={100} />
          </div>
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-white/20 rounded-lg"><CheckCircle size={20}/></div>
            <h3 className="font-bold text-indigo-100 text-sm tracking-tight">Revenue Recovered</h3>
          </div>
          <p className="text-3xl font-display font-bold relative z-10">₹{(dashboard?.totalItcRecovered / 100).toLocaleString()}</p>
          <p className="text-[10px] uppercase font-bold text-indigo-200 mt-1 relative z-10">Total ITC Matched</p>
        </motion.div>

        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.3}} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><IndianRupee size={20}/></div>
            <h3 className="font-bold text-slate-600 text-sm tracking-tight">Comm (Mtd)</h3>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">₹{(dashboard?.commissionThisMonth / 100).toLocaleString()}</p>
        </motion.div>

        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.4}} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={20}/></div>
            <h3 className="font-bold text-slate-600 text-sm tracking-tight">Pending Payout</h3>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">₹{(dashboard?.pendingCommission / 100).toLocaleString()}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Client List (Takes up 2/3) */}
        <div className="lg:col-span-2 space-y-4 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900">Monitored Clients</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-100">
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Health Score</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Mismatches</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingClients ? (
                  <tr><td colSpan={4} className="p-4 text-center text-slate-500 text-sm">Loading clients...</td></tr>
                ) : clientsData?.data?.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500 text-sm">No clients mapped yet. Invite a client to get started.</td></tr>
                ) : (
                  clientsData?.data?.map((client: any) => (
                    <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 text-sm">{client.companyName || 'Unknown Company'}</p>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">{client.gstin || 'No GSTIN'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${getHealthColor(client.healthScore)}`}>
                          {client.healthScore >= 80 ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                          {client.healthScore}/100
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-slate-700">{client.pendingMismatches}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Link to={`/partner/clients/${client.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1">
                          View details <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Panel (Takes up 1/3) */}
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-sm mb-4">
              <LinkIcon size={24} />
            </div>
            <h2 className="font-display font-bold text-slate-900 text-lg mb-2">Invite a Client</h2>
            <p className="text-sm text-slate-600 mb-6">Send an invitation to a client. When they sign up, they will be automatically mapped to your firm.</p>
            
            <form onSubmit={handleInvite} className="space-y-3">
              <input
                required
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full px-4 py-2.5 border border-indigo-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
              <button
                type="submit"
                disabled={inviteClient.isPending}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center disabled:opacity-50"
              >
                {inviteClient.isPending ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-display font-bold text-slate-900 text-lg mb-4">White-Label Branding</h2>
            <p className="text-sm text-slate-600 mb-4">Customize the portal colors and provide your logo for a branded client experience.</p>
            <button className="w-full px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">
              Configure Branding
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
