import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building, LayoutDashboard, FileText, RefreshCw, 
  Menu, X, Shield, Bell, Settings, LogOut, ChevronDown, 
  Zap, Crown, ShieldAlert
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()
  const { user, signOut } = useAuth()

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Transactions', icon: FileText, path: '/invoices' },
    { label: 'Reconciliation', icon: RefreshCw, path: '/reconciliation' },
    { label: 'Notice Defense', icon: ShieldAlert, path: '/notice-defense' },
    { label: 'Compliances', icon: Shield, path: '/gstr1-filing' },
    { label: 'Value Tiers', icon: Crown, path: '/pricing' },
  ]

  const activePath = location.pathname

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 88 : 280 }}
      className="relative flex flex-col h-screen bg-slate-950 border-r border-slate-900 z-50 transition-all duration-300 shadow-void"
    >
      {/* Brand Logo Area */}
      <div className="flex items-center gap-4 h-24 px-6 border-b border-slate-900 mb-8">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] text-slate-950 font-black text-2xl">
          G
        </div>
        {!isCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
            <span className="font-extrabold text-2xl text-white tracking-tighter leading-none font-display">GSTPro</span>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1.5">Compliance Void</span>
          </motion.div>
        )}
      </div>

      {/* Navigation Layer */}
      <nav className="flex-1 px-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = activePath === item.path
          return (
            <Link key={item.path} to={item.path}>
              <div className={`
                relative group flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300
                ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/50'}
              `}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-slate-500 group-hover:text-slate-300 transition-colors'} />
                {!isCollapsed && <span className={`font-bold text-sm tracking-tight ${isActive ? 'text-white' : ''}`}>{item.label}</span>}
                {isActive && (
                   <motion.div layoutId="navGlow" className="absolute -left-1 w-2 h-6 bg-emerald-500 rounded-full blur-[4px]" />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User Session Area */}
      <div className="p-4 border-t border-slate-900">
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full p-2.5 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-3 transition-all hover:border-slate-700"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 font-bold shrink-0">
              {user?.email[0].toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user?.email.split('@')[0]}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Master Admin</p>
              </div>
            )}
            {!isCollapsed && <ChevronDown size={14} className={`text-slate-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />}
          </button>

          <AnimatePresence>
            {showUserMenu && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 w-full mb-3 p-2 bg-white border border-sky-200 rounded-2xl shadow-xl z-[60]"
              >
                <button 
                   onClick={() => signOut()}
                   className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-error-main hover:bg-error-light transition-all font-bold text-sm"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}
