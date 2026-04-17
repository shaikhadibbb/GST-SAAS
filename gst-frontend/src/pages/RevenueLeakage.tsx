import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, TrendingDown, IndianRupee, AlertTriangle, 
  ArrowUpRight, ShieldCheck, PieChart, CheckCircle2,
  RefreshCw, DollarSign, Target, BarChart3
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import Sidebar from '@/components/layout/Sidebar'
import api from '@/services/api'
import { toast } from 'sonner'

export default function RevenueLeakage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  const scanLeakage = async () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setData({
        potentialRecovery: 125400,
        leakageRate: 3.4,
        mismatchedInvoices: 12,
        history: [
           { month: 'Jan', leakage: 45000 },
           { month: 'Feb', leakage: 32000 },
           { month: 'Mar', leakage: 88000 }
        ]
      })
      toast.success('Strategy scan complete. Revenue leakage identified.')
    }, 1800)
  }

  return (
    <div className="flex h-screen bg-sky-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-10 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-sky-200 pb-8 gap-6">
            <div>
              <div className="flex items-center gap-4 mb-3">
                 <div className="p-3 bg-sky-600 rounded-2xl text-white shadow-lg shadow-sky-600/20">
                    <Target size={28} strokeWidth={2.5} />
                 </div>
                 <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Leakage Monitor</h1>
                    <p className="text-slate-500 font-medium mt-1">AI-driven identification of unclaimed ITC and vendor mismatches.</p>
                 </div>
              </div>
            </div>
            <Button onClick={scanLeakage} loading={loading} icon={<RefreshCw size={20} />}>Sync Intelligence</Button>
          </div>

          {!data ? (
            <div className="py-32 flex flex-col items-center justify-center">
              <Card className="max-w-lg p-12 text-center bg-white border-sky-100 shadow-2xl relative overflow-hidden group hover:border-sky-300 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full -mr-16 -mt-16 group-hover:scale-120 transition-transform" />
                <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                   <TrendingDown className="text-sky-300" size={48} strokeWidth={1} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Initialize Yield Extraction</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-10">Scan your entire transaction history to recover unclaimed tax credits and optimize your institutional cash flow.</p>
                <Button onClick={scanLeakage} size="lg" className="w-full">Initiate Strategic Scan</Button>
              </Card>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { l: 'Recoverable Assets', v: `₹${data.potentialRecovery.toLocaleString()}`, i: IndianRupee, c: 'text-success-main', sub: 'Calculated Recovery' },
                   { l: 'Contention Rate', v: `${data.leakageRate}%`, i: AlertTriangle, c: 'text-error-main', sub: 'Portfolio Mismatches' },
                   { l: 'Verified Claims', v: data.mismatchedInvoices, i: CheckCircle2, c: 'text-sky-500', sub: 'Actionable Invoices' }
                 ].map((s, i) => (
                   <Card key={i} className="p-10 relative overflow-hidden group">
                      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-sky-50/50 rounded-full group-hover:scale-110 transition-transform" />
                      <div className="flex items-center gap-4 mb-6">
                         <div className={`p-3 rounded-2xl bg-sky-50 ${s.c} shadow-sm`}><s.icon size={24} strokeWidth={2.5}/></div>
                         <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{s.l}</h3>
                      </div>
                      <p className="text-4xl font-extrabold text-slate-900 font-display tracking-tighter leading-none">{s.v}</p>
                      <p className="text-xs font-bold text-slate-400 mt-3">{s.sub}</p>
                   </Card>
                 ))}
               </div>

               <div className="grid lg:grid-cols-2 gap-10">
                  <Card className="p-10 space-y-8">
                     <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Strategy Protocol</h3>
                     <div className="space-y-6">
                        {[
                          { t: 'Bulk GSTR-2A Matching', d: 'Fuzzy match across all fiscal quarters.', s: 'done' },
                          { t: 'Vendor Compliance Audit', d: 'Verification of supplier filing status.', s: 'done' },
                          { t: 'Draft Recovery Notice', d: 'Automated legal communication suite.', s: 'active' }
                        ].map((step, i) => (
                          <div key={i} className="flex gap-4">
                             <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${step.s === 'done' ? 'bg-success-main shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-sky-500 animate-pulse'}`} />
                             <div>
                                <p className="text-sm font-bold text-slate-900">{step.t}</p>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">{step.d}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                     <Button className="w-full py-4 mt-4" icon={<ArrowUpRight size={18}/>}>Launch Recovery Suite</Button>
                  </Card>

                  <Card className="p-10 bg-white border-sky-100 flex flex-col justify-between">
                     <div>
                        <div className="flex items-center gap-3 mb-6">
                           <Zap size={20} className="text-warning-main" fill="currentColor" />
                           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Yield Summary</h3>
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">Identify unclaimed capital with <span className="text-sky-600">zero manual effort.</span></h2>
                        <p className="text-slate-500 font-medium text-sm mt-4 leading-relaxed">
                           Our institutional matching engine monitors GSTR-2A updates every 24 hours. When a vendor files late, we're the first to identify your newly claimable ITC.
                        </p>
                     </div>
                     <div className="pt-10 flex items-center gap-6">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Fee</p>
                           <p className="text-lg font-black text-success-main italic">₹2,499 Flat</p>
                        </div>
                        <div className="w-px h-10 bg-sky-100" />
                        <p className="text-[10px] text-slate-400 font-medium leading-tight">Pay only when you successfully recover unclaimed credits.</p>
                     </div>
                  </Card>
               </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
