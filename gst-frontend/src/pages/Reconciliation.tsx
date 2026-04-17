import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  RefreshCw, CheckCircle2, AlertTriangle, 
  Search, Filter, ExternalLink, Download, 
  ShieldCheck, Info, Sparkles, Database, FileText
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import Sidebar from '@/components/layout/Sidebar'
import { toast } from 'sonner'

export default function Reconciliation() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[] | null>(null)

  const startRecon = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setData([
        { vendor: 'Acme Cloud Services', gstin: '27ABCDE1234F1Z5', yourData: 45000, gstnData: 0, diff: -45000, status: 'LEAKAGE' },
        { vendor: 'Global Logistics Pvt', gstin: '24FGHIJ5678K2Z9', yourData: 12000, gstnData: 12000, diff: 0, status: 'MATCHED' },
        { vendor: 'Sterling Hardware', gstin: '29LMNOP9012M3Z0', yourData: 8500, gstnData: 8200, diff: -300, status: 'PARTIAL' }
      ])
      toast.success('GSTR-2A Matching Engine complete.')
    }, 2000)
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 selection:bg-emerald-500/20">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-10 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-white/5 pb-10 gap-8">
            <div className="space-y-3">
              <h1 className="text-5xl font-black text-white tracking-tighter leading-none uppercase italic font-display">Neural Matching</h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-1">Cross-matrix Ledger Synchronization (GSTR-2A).</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-1 border border-slate-800 bg-slate-900 rounded-2xl flex items-center shadow-void">
                <button className="px-6 py-2.5 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 rounded-xl tracking-widest transition-all">Monthly</button>
                <button className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-600 hover:text-slate-400 transition-all tracking-widest">Quarterly</button>
              </div>
              <Button onClick={startRecon} loading={loading} icon={<RefreshCw size={20} />} className="shadow-neon">Sync GSTN Matrix</Button>
            </div>
          </div>

          {!data ? (
            <div className="py-32 flex flex-col items-center justify-center">
              <Card className="max-w-lg p-12 text-center border-slate-800/80 bg-slate-900 shadow-void">
                <div className="w-20 h-20 bg-slate-950 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                  <Database size={36} />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter italic">Initialize Neural Match</h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed mb-12">Synthesize real-time GSTR-2A data from government vectors to detect fiscal leakage with AES-512 integrity.</p>
                <Button onClick={startRecon} icon={<Sparkles size={20} />} className="px-10 py-5">Start Synchronization</Button>
              </Card>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { l: 'Total ITC Claimable', v: '₹65,500', icon: FileText, color: 'text-emerald-500' },
                   { l: 'Verified Matches', v: '₹12,000', icon: CheckCircle2, color: 'text-emerald-400' },
                   { l: 'Potential Leakage', v: '₹45,300', icon: AlertTriangle, color: 'text-red-500' }
                 ].map((s, i) => (
                   <Card key={i} className="p-10 border-slate-800/60">
                     <div className="flex items-center gap-4 mb-6">
                        <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 ${s.color}`}><s.icon size={22} strokeWidth={2.5}/></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{s.l}</span>
                     </div>
                     <p className="text-5xl font-black text-white font-display tracking-tighter italic">{s.v}</p>
                   </Card>
                 ))}
               </div>

               <Card className="p-0 overflow-hidden border-slate-800/50 shadow-void">
                  <div className="px-12 py-8 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                     <h2 className="font-black text-white uppercase italic tracking-tighter text-xl">Ingestion Matrix</h2>
                     <Button variant="outline" size="sm" icon={<Download size={16}/>} className="border-slate-800 text-[10px] tracking-widest uppercase">Export Vector</Button>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-900/80 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] border-b border-slate-800">
                        <th className="px-12 py-6">Verified Vendor Entity</th>
                        <th className="px-4 py-6 text-right">Internal Vector</th>
                        <th className="px-4 py-6 text-right">GSTN Matrix</th>
                        <th className="px-4 py-6 text-right">Differential</th>
                        <th className="px-12 py-6 text-center">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {data.map((row, i) => (
                        <tr key={i} className="hover:bg-emerald-500/[0.02] transition-all group">
                          <td className="px-12 py-8">
                             <p className="text-white font-black uppercase tracking-tight text-sm leading-none">{row.vendor}</p>
                             <p className="text-[9px] font-black text-emerald-500/60 mt-2 uppercase tracking-[0.2em] leading-none">{row.gstin}</p>
                          </td>
                          <td className="px-4 py-8 text-right text-slate-500 font-mono font-bold italic">₹{row.yourData.toLocaleString()}</td>
                          <td className="px-4 py-8 text-right text-slate-500 font-mono font-bold italic">₹{row.gstnData.toLocaleString()}</td>
                          <td className={`px-4 py-8 text-right font-display font-black text-sm italic ${row.diff < 0 ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}>
                             {row.diff !== 0 ? `₹${row.diff.toLocaleString()}` : '—'}
                          </td>
                          <td className="px-12 py-8 text-center">
                             <span className={`status-pill ${
                                row.status === 'MATCHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                row.status === 'LEAKAGE' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                             }`}>
                                {row.status}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

