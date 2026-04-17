import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Play, Shield, Zap, TrendingUp } from 'lucide-react'

const badges = [
  { icon: Zap, label: 'Auto IRN Generation', color: 'text-yellow-400', pos: 'top-1/4 left-12' },
  { icon: Shield, label: 'GSTN Compliant', color: 'text-emerald-400', pos: 'top-1/3 right-16' },
  { icon: TrendingUp, label: 'Real-time Analytics', color: 'text-blue-400', pos: 'bottom-1/3 left-20' },
]

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-navy via-slate-900 to-indigo-900 flex items-center overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.3) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
      {badges.map((b, i) => (
        <motion.div key={b.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + i * 0.2 }}
          className={`absolute ${b.pos} hidden lg:flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-medium`}>
          <b.icon size={14} className={b.color} />{b.label}
        </motion.div>
      ))}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Trusted by 500+ CA Firms across India
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-display font-bold text-white leading-tight tracking-tight mb-6">
          Automated GST{' '}
          <span className="text-gradient">Compliance</span>
          <br />for Modern India
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Generate IRN, reconcile GSTR-2A, file returns — automatically. Built for Indian businesses, CAs, and accountants.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl transition-all hover:-translate-y-0.5">
            Start Free Trial <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#features" className="flex items-center gap-2 border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-full text-lg font-semibold transition-all">
            <Play size={16} fill="white" />See How It Works
          </a>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[{value:'10L+',label:'Invoices Generated'},{value:'99.9%',label:'Uptime SLA'},{value:'500+',label:'CA Firms'}].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-display font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
