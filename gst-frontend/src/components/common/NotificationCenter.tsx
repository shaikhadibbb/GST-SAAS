import { useState, useRef, useEffect } from 'react'
import { Bell, AlertTriangle, CheckCircle2, FileText, AlertCircle, X, Check, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

interface Notification {
  id: string
  title: string
  subtitle: string
  timestamp: string
  type: 'warning' | 'error' | 'success' | 'info'
  actionLabel?: string
  actionPath?: string
  read: boolean
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'GSTR-1 due in 3 days',
      subtitle: 'April 2026 filing deadline is April 20',
      timestamp: '2 hours ago',
      type: 'warning',
      actionLabel: 'File Now',
      actionPath: '/gstr1-filing',
      read: false
    },
    {
      id: '2',
      title: '₹1.8K ITC at risk',
      subtitle: '1 unmatched invoice found in GSTR-2A',
      timestamp: '5 hours ago',
      type: 'error',
      actionLabel: 'Reconcile',
      actionPath: '/reconciliation',
      read: false
    },
    {
      id: '3',
      title: 'Invoice INV-928640 generated',
      subtitle: 'Successfully sent to client via email',
      timestamp: '1 day ago',
      type: 'success',
      actionLabel: 'View',
      actionPath: '/invoices',
      read: true
    },
    {
      id: '4',
      title: 'Weekly compliance report ready',
      subtitle: 'Review your summary for last week',
      timestamp: '2 days ago',
      type: 'info',
      actionLabel: 'View Report',
      actionPath: '/dashboard',
      read: true
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const dismiss = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning': return <div className="p-2 bg-amber-100 text-amber-600 rounded-full"><AlertTriangle size={16} /></div>
      case 'error': return <div className="p-2 bg-red-100 text-red-600 rounded-full"><AlertCircle size={16} /></div>
      case 'success': return <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full"><CheckCircle2 size={16} /></div>
      default: return <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full"><FileText size={16} /></div>
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all relative">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden transform origin-top-right">
            
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Notifications</h3>
              <button onClick={markAllRead} className="text-xs font-bold text-indigo-600 hover:underline">Mark all read</button>
            </div>

            <div className="max-h-[420px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Bell size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">All caught up!</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`p-4 group relative flex gap-4 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-indigo-50/30' : ''}`}>
                    <div className="shrink-0">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="text-sm font-bold text-slate-900 mb-0.5 leading-tight">{n.title}</h4>
                      <p className="text-xs text-slate-500 leading-normal mb-2">{n.subtitle}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {n.timestamp}
                        </span>
                        {n.actionLabel && (
                          <Link to={n.actionPath ?? '#'} onClick={() => setIsOpen(false)}
                            className="text-[11px] font-bold text-indigo-600 hover:underline uppercase tracking-wider">
                            {n.actionLabel}
                          </Link>
                        )}
                      </div>
                    </div>
                    <button onClick={() => dismiss(n.id)}
                      className="absolute right-3 top-4 p-1 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-100 text-center">
              <Link to="/settings" className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">
                Notification Settings
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
