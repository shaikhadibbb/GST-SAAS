import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, FileText, GitMerge, Settings, LogOut, Zap, 
  Menu, X, ChevronRight, Users, FileJson, Upload, Building, 
  ChevronDown, FileCheck, ExternalLink
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOnboarding } from '@/hooks/useOnboarding'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'Upload Invoice', href: '/upload-invoice', icon: Upload }, // NEW
  { label: 'Reconciliation', href: '/reconciliation', icon: GitMerge },
  { label: 'GSTR-1 Filing', href: '/gstr1-filing', icon: FileCheck }, // NEW link & icon
  { label: 'Companies', href: '/companies', icon: Building }, // NEW
  { label: 'Settings', href: '/settings', icon: Settings },
]

const partnerNav = [
  { label: 'Partner Portal', href: '/partner', icon: Users },
]

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'text-indigo-600',
  COMPLIANCE_OFFICER: 'text-amber-600',
  CA: 'text-blue-600',
  ACCOUNTANT: 'text-slate-500',
  VIEWER: 'text-slate-400',
}

export default function Sidebar() {
  const { user, logout, switchCompany } = useAuth()
  const { data: onboarding } = useOnboarding()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showCompanySwitch, setShowCompanySwitch] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const setupProgress = onboarding || { percentage: 0, completedCount: 0, totalSteps: 5 }
  const plan = user?.subscription?.plan || 'STARTER'

  const Content = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ─── Logo & Company Switcher ─── */}
      <div className="px-5 py-6 border-b border-slate-100 shrink-0">
        <Link to="/" className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <Zap size={15} className="text-white" fill="white"/>
          </div>
          <span className="font-display font-bold text-lg">GST<span className="text-indigo-600">Pro</span></span>
        </Link>

        {user?.company && (
          <div className="relative">
            <button 
              onClick={() => setShowCompanySwitch(!showCompanySwitch)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors group text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Building size={14} className="text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user.company.name}</p>
                <p className="text-[10px] font-mono-gstin text-indigo-600 truncate">{user.company.gstin}</p>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showCompanySwitch ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showCompanySwitch && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1 overflow-hidden"
                >
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Companies</div>
                  {(user.companies || []).map((c) => (
                    <button 
                      key={c.id} 
                      onClick={() => {
                        setShowCompanySwitch(false)
                        if (c.id !== user.company?.id) {
                          switchCompany(c.id)
                        }
                      }} 
                      className={`w-full flex flex-col px-3 py-2 hover:bg-slate-50 transition-colors text-left border-l-2 ${c.id === user.company?.id ? 'border-indigo-500 bg-indigo-50/30' : 'border-transparent hover:border-indigo-500'}`}
                    >
                      <span className={`text-xs font-semibold truncate ${c.id === user.company?.id ? 'text-indigo-900' : 'text-slate-800'}`}>{c.name}</span>
                      <span className="text-[10px] font-mono-gstin text-slate-500">{c.gstin}</span>
                    </button>
                  ))}
                  <div className="border-t border-slate-50 mt-1">
                    <Link to="/companies" onClick={() => setShowCompanySwitch(false)} className="flex items-center justify-center p-2.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
                      Manage Companies <ExternalLink size={10} className="ml-1.5" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {nav.map(item => {
          if (item.href === '/gstr1-filing' && user?.role === 'VIEWER') return null

          const active = location.pathname === item.href
          return (
            <Link key={item.label} to={item.href} onClick={()=>setOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${active?'bg-indigo-600 text-white shadow-md':'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <item.icon size={17} className={active?'text-white':'text-slate-400 group-hover:text-slate-600'}/>
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto text-indigo-200"/>}
            </Link>
          )
        })}

        {(user?.role === 'CA_PARTNER' || user?.role === 'CA' || user?.role === 'ADMIN') && partnerNav.map(item => {
          const active = location.pathname.startsWith(item.href)
          return (
            <Link key={item.label} to={item.href} onClick={()=>setOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all group mt-6 ${active?'bg-emerald-600 text-white shadow-md':'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}>
              <item.icon size={17} className={active?'text-white':'text-emerald-600'}/>
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto text-emerald-200"/>}
            </Link>
          )
        })}
      </nav>
      
      {/* ─── Bottom Sections ─── */}
      <div className="shrink-0 p-4 space-y-4">
        {/* Setup Progress */}
        {setupProgress.percentage < 100 && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Setup: {setupProgress.completedCount}/{setupProgress.totalSteps} ⚡</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${setupProgress.percentage}%` }}
                className="h-full bg-indigo-500 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Subscription */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Active Plan</span>
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black">{plan}</span>
          </div>
          {plan === 'STARTER' && (
            <Link to="/pricing" onClick={()=>setOpen(false)} className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-white text-indigo-600 text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm">
              Upgrade <Zap size={12} fill="currentColor"/>
            </Link>
          )}
        </div>

        {/* User & Sign Out */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 p-0.5">
              <div className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.email[0].toUpperCase()}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">{user?.email}</p>
              <p className={`text-[10px] font-medium uppercase tracking-tighter ${ROLE_COLORS[user?.role ?? ''] || 'text-slate-400'}`}>
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={14}/>Sign Out
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-100 bg-white h-screen sticky top-0 shrink-0"><Content/></aside>
      <button onClick={()=>setOpen(true)} className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center">
        <Menu size={18} className="text-slate-600"/>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setOpen(false)} className="lg:hidden fixed inset-0 bg-black/40 z-40"/>
            <motion.aside initial={{x:-280}} animate={{x:0}} exit={{x:-280}} transition={{type:'spring',stiffness:300,damping:30}}
              className="lg:hidden fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-2xl">
              <button onClick={()=>setOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100"><X size={16} className="text-slate-500"/></button>
              <Content/>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
