import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, Users, Plus, Mail, Shield, UserX, 
  ChevronRight, LayoutGrid, CreditCard, Search, X, Zap, ArrowLeft
} from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useCompanies } from '@/hooks/useCompanies'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export default function Companies() {
  const { user, switchCompany, activeCompanyId } = useAuth()
  const { list: firms, details, create, invite, removeMember } = useCompanies()
  const [selectedId, setSelectedId] = useState(activeCompanyId)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const { data: company, isLoading: dl } = details(selectedId)

  const [newName, setNewName] = useState('')
  const [newGSTIN, setNewGSTIN] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('VIEWER')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const gstin = newGSTIN.toUpperCase()
      await create.mutateAsync({ name: newName, gstin, pan: gstin.substring(2, 12), stateCode: gstin.substring(0, 2) })
      toast.success('Institutional entity registered.')
      setShowAddModal(false)
      setNewName(''); setNewGSTIN('')
    } catch { toast.error('Entity registration failed.') }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await invite.mutateAsync({ id: selectedId, email: inviteEmail, role: inviteRole })
      toast.success('Authorized invitation dispatched.')
      setShowInviteModal(false)
      setInviteEmail('')
    } catch { toast.error('Invitation dispatch failed.') }
  }

  return (
    <div className="flex h-screen bg-sky-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Entity Directory */}
        <div className="w-80 lg:w-96 border-r border-sky-200 bg-white flex flex-col shrink-0 shadow-sm relative z-20">
          <div className="p-8 border-b border-sky-100 bg-sky-50/30">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">Registry</h1>
              <button 
                onClick={() => setShowAddModal(true)}
                className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors" />
              <input type="text" placeholder="Search registry..." className="w-full pl-11 pr-4 py-3 bg-white border border-sky-100 rounded-xl text-sm focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500 transition-all outline-none shadow-sm" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {firms.isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 bg-sky-50 rounded-2xl animate-pulse" />)
            ) : firms.data?.map(f => (
              <button 
                key={f.id} 
                onClick={() => setSelectedId(f.id)}
                className={`w-full text-left p-5 rounded-2xl border transition-all relative group shadow-sm ${
                  selectedId === f.id 
                    ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/10' 
                    : 'bg-white border-transparent hover:border-sky-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all ${
                    selectedId === f.id ? 'bg-sky-600 text-white scale-110' : 'bg-sky-50 text-sky-400'
                  }`}>
                    <Building2 size={24} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-sm truncate tracking-tight ${selectedId === f.id ? 'text-slate-900' : 'text-slate-600'}`}>{f.name}</p>
                    <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mt-1">{f.gstin}</p>
                    <div className="flex items-center gap-2 mt-4">
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border shadow-sm ${
                         f.subscriptionPlan === 'PRO' ? 'bg-warning-light text-warning-dark border-warning-main/10' : 'bg-sky-50 text-sky-400 border-sky-100'
                       }`}>{f.subscriptionPlan} Tier</span>
                       <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{f.userRole}</span>
                    </div>
                  </div>
                  {f.id === activeCompanyId && (
                    <div className="absolute top-5 right-5 text-sky-600">
                      <Zap size={12} fill="currentColor" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel: Management Interface */}
        <div className="flex-1 overflow-y-auto p-12 bg-sky-50/50">
          {!selectedId ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center mb-6">
                 <Building2 size={48} strokeWidth={1} className="text-sky-200" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Select Entity Interface</p>
            </div>
          ) : dl ? (
             <div className="space-y-8 max-w-5xl mx-auto">
                <div className="h-40 bg-white rounded-3xl animate-pulse shadow-sm" />
                <div className="grid grid-cols-2 gap-8"><div className="h-80 bg-white rounded-3xl animate-pulse shadow-sm" /><div className="h-80 bg-white rounded-3xl animate-pulse shadow-sm" /></div>
             </div>
          ) : company && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-8">
              {/* Profile Header */}
              <Card className="p-10 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-2xl shadow-sky-600/20 shrink-0">
                      <Building2 size={40} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">{company.name}</h2>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-[11px] font-black text-sky-500 uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-lg">{company.gstin}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{company.stateCode} Regional Domain</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {activeCompanyId !== company.id && (
                      <Button onClick={() => switchCompany(company.id)} variant="outline">Activate Context</Button>
                    )}
                    <Button>Edit Credentials</Button>
                  </div>
                </div>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl pointer-events-none" />
              </Card>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Organizational Overview */}
                <div className="lg:col-span-1 space-y-8">
                  <Card className="p-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[.25em] mb-6 flex items-center gap-2">
                       <LayoutGrid size={14} className="text-sky-500" /> Record Data
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest">Legal PAN Identification</p>
                        <p className="text-md font-bold text-slate-900 font-mono tracking-tighter">{company.pan}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest">Compliance Status</p>
                        <p className="text-sm font-black text-success-main uppercase flex items-center gap-1.5 focus:ring-4">
                           <CheckCircle2 size={14} /> Synchronized
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-8 bg-gradient-to-br from-sky-600 to-sky-800 text-white border-0 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                    <h3 className="text-[10px] font-black text-sky-200 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <CreditCard size={14} /> Licensing Tier
                    </h3>
                    <div className="flex items-center justify-between">
                       <span className="text-2xl font-black tracking-tighter uppercase">{company.subscriptionPlan}</span>
                       <Button size="sm" variant="outline" className="text-white border-white/20 bg-white/10 hover:bg-white/20">Upgrade Access</Button>
                    </div>
                    <p className="text-[10px] font-bold text-sky-300 mt-4 uppercase">Next Billing Cycle: May 01, 2026</p>
                  </Card>
                </div>

                {/* Authorized Team Cluster */}
                <div className="lg:col-span-2">
                  <Card className="h-full flex flex-col p-0 overflow-hidden">
                    <div className="p-8 border-b border-sky-100 flex items-center justify-between bg-white text-slate-900">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 leading-none">
                          <Users size={16} className="text-sky-500" /> Authorized Personnel
                       </h3>
                       <Button size="sm" icon={<Mail size={16}/>} onClick={() => setShowInviteModal(true)}>Dispatch Invitation</Button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="bg-sky-50/50 text-[10px] text-slate-500 uppercase font-black tracking-wider border-b border-sky-100">
                                <th className="px-8 py-4">Security Principal</th>
                                <th className="px-5 py-4">Auth Scope</th>
                                <th className="px-5 py-4">State</th>
                                <th className="px-8 py-4 text-right">Integrity</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-sky-100">
                             {company.members?.map(m => (
                               <tr key={m.id} className="hover:bg-sky-50/50 transition-all">
                                  <td className="px-8 py-5">
                                     <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center font-black text-xs text-sky-600 shadow-sm">
                                           {m.user?.email[0].toUpperCase()}
                                        </div>
                                        <span className="font-bold text-slate-900 text-sm">{m.user?.email}</span>
                                     </div>
                                  </td>
                                  <td className="px-5 py-5">
                                     <span className={`text-[10px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-lg border shadow-sm ${
                                       m.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                                       m.role === 'CA' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                                       m.role === 'ACCOUNTANT' ? 'bg-success-light text-success-dark border-success-main/10' : 'bg-slate-50 text-slate-400 border-slate-100'
                                     }`}>{m.role}</span>
                                  </td>
                                  <td className="px-5 py-5">
                                     <span className="flex items-center gap-2 text-[10px] text-success-dark font-black uppercase whitespace-nowrap">
                                        <div className="w-2 h-2 rounded-full bg-success-main shadow-lg shadow-success-main/20" /> Active
                                     </span>
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                     {m.userId !== user?.id && (
                                       <button 
                                          onClick={() => toast.info('Removing member ' + m.user?.email)}
                                          className="p-2 rounded-xl text-slate-300 hover:text-error-main hover:bg-error-light transition-all"
                                       >
                                          <UserX size={18} />
                                       </button>
                                     )}
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Institutional Modals */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
             <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onSubmit={handleCreate}
               className="relative bg-white rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] w-full max-w-md overflow-hidden border border-white">
                <div className="px-10 py-8 border-b border-sky-100 flex items-center justify-between">
                   <h2 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">Register Entity</h2>
                   <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={24}/></button>
                </div>
                <div className="p-10 space-y-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Legal Designation</label>
                      <input required value={newName} onChange={e=>setNewName(e.target.value)} type="text" placeholder="e.g. Acme Compliance" className="w-full px-5 py-3.5 rounded-2xl bg-sky-50 border border-sky-100 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-sm font-bold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Entity GSTIN Identification</label>
                      <input required value={newGSTIN} onChange={e=>setNewGSTIN(e.target.value)} type="text" placeholder="27XXXXX0000X1Z5" className="w-full px-5 py-3.5 rounded-2xl bg-sky-50 border border-sky-100 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 font-mono text-sm tracking-wider font-bold" />
                   </div>
                </div>
                <div className="p-10 bg-sky-50 flex gap-4">
                   <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                   <Button type="submit" variant="primary" className="flex-1" loading={create.isPending}>Authorize Firm</Button>
                </div>
             </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
