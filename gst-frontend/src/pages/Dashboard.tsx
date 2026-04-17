import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, FileText, AlertTriangle, Calendar, Plus, 
  RefreshCw, Shield, DollarSign, HeartPulse, 
  Upload, Loader2, CheckCircle2, ChevronRight, X, 
  Search, Bell, ArrowUpRight, ShieldAlert, Sparkles, Zap
} from 'lucide-react'
import { format } from 'date-fns'
import Sidebar from '@/components/layout/Sidebar'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts'
import api from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [healthData, setHealthData] = useState<{ score: number; grade: string; breakdown: any[] } | null>(null)
  
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }

  useEffect(() => {
    api.get('/health/score').then(res => setHealthData(res.data.data)).finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total Tax Credit', val: '₹4,18,000', icon: TrendingUp, color: 'text-sky-500', trend: '+12.4%', sub: 'vs last month' },
    { label: 'ITC Protected', val: '₹1,24,000', icon: Shield, color: 'text-success-main', trend: '+5.2%', sub: 'Live compliance' },
    { label: 'Audit Risk', val: 'Minimal', icon: ShieldAlert, color: 'text-sky-400', trend: 'Low', sub: 'Calculated Grade A' },
  ]

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-10 py-12 relative selection:bg-emerald-500/20">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-12">
          
          {/* Header Section */}
          <div className="flex items-end justify-between border-b border-white/5 pb-10">
            <div>
              <motion.h1 className="text-5xl font-black text-white tracking-tighter font-display uppercase italic">
                VOID COMMAND: {user?.email.split('@')[0]}
              </motion.h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.4em] mt-3">Compliance Matrix • April 2026</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative group w-80">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                 <input type="text" placeholder="SCAN SUBSYSTEMS..." className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700" />
              </div>
              <button className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group">
                <Bell size={22} className="text-slate-500 group-hover:text-emerald-400" />
                <span className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              </button>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div variants={item}>
              <Card className="p-10 h-full bg-slate-900 border-slate-800 shadow-void relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] -mr-20 -mt-20 rounded-full group-hover:bg-emerald-500/10 transition-colors duration-700" />
                 <Zap size={48} className="text-emerald-500 mb-8 opacity-80" />
                 <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Sync Fidelity</p>
                    <h2 className="text-6xl font-black font-display italic text-white">{healthData?.grade || 'S'}</h2>
                    <div className="flex items-center gap-3 mt-6">
                       <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${healthData?.score || 98}%` }} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                       </div>
                       <span className="text-[10px] font-black text-emerald-400">{healthData?.score || 98}%</span>
                    </div>
                 </div>
              </Card>
            </motion.div>

            {stats.map((s, i) => (
              <motion.div key={i} variants={item}>
                <Card className="p-10 h-full flex flex-col justify-between border-slate-800/50">
                   <div className="flex justify-between items-start">
                      <div className={`p-4 rounded-2xl bg-slate-950 border border-slate-800 ${s.color}`}>
                        <s.icon size={28} strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 italic">
                        {s.trend} <TrendingUp size={12} />
                      </span>
                   </div>
                   <div className="mt-10">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mb-4">{s.label}</p>
                      <h2 className="text-4xl font-black text-white font-display tabular-nums leading-none tracking-tighter">
                        {s.val}
                      </h2>
                      <p className="text-[10px] font-bold text-slate-600 mt-4 uppercase tracking-widest">{s.sub}</p>
                   </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-3 gap-10">
            <motion.div variants={item} className="lg:col-span-2">
              <Card className="p-10 border-slate-800/80">
                 <div className="flex items-center justify-between mb-12">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Tax Momentum</h2>
                    <Button variant="secondary" size="sm" className="bg-slate-800 border-slate-700 text-[10px] tracking-widest uppercase">Stream Export</Button>
                 </div>
                 <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartMock}>
                          <defs>
                             <linearGradient id="neonEmerald" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800, textAnchor: 'middle'}} dy={15} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} />
                          <Tooltip content={<CustomTooltip />} cursor={{stroke: '#10b981', strokeWidth: 1}} />
                          <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} fill="url(#neonEmerald)" dot={{fill: '#10b981', r: 5, strokeWidth: 3, stroke: '#020617'}} activeDot={{ r: 8, fill: '#050505', stroke: '#10b981', strokeWidth: 3 }} />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </Card>
            </motion.div>

            <motion.div variants={item} className="space-y-8">
               <Card className="p-10 border-l-4 border-l-emerald-500 bg-slate-900 shadow-void">
                  <h3 className="font-black text-white uppercase tracking-widest text-xs mb-8">System Audit</h3>
                  <div className="space-y-8">
                    {[
                      { l: 'Identity Verified: GSTR-1', t: '2h ago', i: CheckCircle2, c: 'text-emerald-500' },
                      { l: 'Discrepancy: Void #402', t: '5h ago', i: AlertTriangle, c: 'text-error-main' },
                      { l: 'Matrix Scan Complete', t: 'Yesterday', i: Shield, c: 'text-emerald-400' }
                    ].map((act, i) => (
                      <div key={i} className="flex gap-5">
                         <div className={`mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 ${act.c}`}>
                            <act.i size={18} />
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-200 leading-tight uppercase tracking-tight">{act.l}</p>
                            <p className="text-[9px] font-black text-slate-500 uppercase mt-2 tracking-[0.2em]">{act.t}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-10 border-slate-800 text-[10px] tracking-widest uppercase" size="sm">Access Vault</Button>
               </Card>

               <Card className="p-10 bg-emerald-500 text-slate-950 relative overflow-hidden group">
                  <div className="relative z-10 transition-transform group-hover:scale-[1.02] duration-500">
                     <h3 className="text-2xl font-black mb-3 italic uppercase tracking-tighter">AI Defense</h3>
                     <p className="text-slate-900 font-bold text-xs mb-10 leading-relaxed uppercase tracking-wide opacity-80">Analyze GST notices and synthesize institutional responses with Gemini.</p>
                     <Button variant="outline" className="bg-slate-950 text-white border-transparent shadow-xl hover:bg-slate-900 px-6 py-4">
                        SYNTHESIZE <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={18} />
                     </Button>
                  </div>
                  <Sparkles size={120} className="absolute right-[-30px] bottom-[-30px] text-slate-950/20 rotate-12" />
               </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}


const chartMock = [
  { name: 'Jan', value: 2400 }, { name: 'Feb', value: 1398 }, { name: 'Mar', value: 9800 },
  { name: 'Apr', value: 3908 }, { name: 'May', value: 4800 }, { name: 'Jun', value: 3800 },
]

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-void backdrop-blur-md">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{payload[0].payload.name}</p>
        <p className="text-xl font-black text-emerald-400 font-display italic">₹{payload[0].value.toLocaleString()}</p>
      </div>
    )

  }
  return null
}
