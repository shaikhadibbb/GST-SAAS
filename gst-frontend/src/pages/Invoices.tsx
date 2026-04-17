import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Filter, Download, MoreVertical, 
  ChevronRight, FileText, CheckCircle2, AlertCircle, 
  Trash2, Copy, FileCode, ArrowUpRight, Inbox
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import Sidebar from '@/components/layout/Sidebar'
import { useInvoices } from '@/hooks/useInvoices'

export default function Invoices() {
  const navigate = useNavigate()
  const { data: invoices, isLoading } = useInvoices()

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'GENERATED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'DRAFT':
        return 'bg-slate-800 text-slate-300 border-slate-700'
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-slate-900 text-slate-500 border-slate-800'
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-2">
              <h1 className="text-5xl font-black text-white tracking-tighter font-display uppercase italic">Void Ledger</h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Institutional Record Stream</p>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="relative group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                  <input type="text" placeholder="QUERY STREAM..." className="bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all w-72 placeholder:text-slate-700" />
               </div>
               <Button variant="outline" size="md" icon={<Filter size={18} />} />
               <Button onClick={() => navigate('/upload-invoice')} icon={<Plus size={20} />}>Sync Record</Button>
            </div>
          </div>

          {/* Ledger Table Section */}
          <Card className="p-0 border-slate-800/50 shadow-void">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/80 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] border-b border-slate-800">
                  <th className="px-8 py-6">Identity / Sequence</th>
                  <th className="px-4 py-6 font-display">Principal</th>
                  <th className="px-4 py-6 font-display">Taxation</th>
                  <th className="px-4 py-6 text-center">Status</th>
                  <th className="px-4 py-6">Verification</th>
                  <th className="px-8 py-6 text-right">Sequence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                ) : (
                  invoices?.data.map((inv: any, idx: number) => (
                    <motion.tr 
                      key={inv.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-emerald-500/[0.02] transition-all cursor-pointer"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-600 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all shadow-inner border border-slate-800 group-hover:border-emerald-400">
                              <FileText size={20} />
                           </div>
                           <div>
                              <p className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-widest">{inv.invoiceNumber}</p>
                              <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">{inv.customerName}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-4 py-8 font-mono font-bold text-sm text-slate-400 italic">₹{Number(inv.taxableValue).toLocaleString()}</td>
                      <td className="px-4 py-8 font-display font-black text-sm text-white drop-shadow-sm">₹{Number(inv.totalTax).toLocaleString()}</td>
                      <td className="px-4 py-8 text-center">
                        <span className={`status-pill ${getStatusStyles(inv.status)}`}>
                           {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-8">
                         <div className="flex items-center gap-2 text-emerald-500">
                            <CheckCircle2 size={14} fill="currentColor" className="text-slate-950" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">PKI SECURE</span>
                         </div>
                      </td>
                      <td className="px-8 py-8 text-right">
                         <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                            <button className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"><Download size={16}/></button>
                            <button className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"><Copy size={16}/></button>
                            <button className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all"><Trash2 size={16}/></button>
                         </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
            
            {!isLoading && (!invoices || invoices.data.length === 0) && (
              <div className="py-48 text-center flex flex-col items-center bg-slate-950/30">
                 <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-8 border border-slate-800 shadow-void">
                    <Inbox size={48} className="text-slate-700" strokeWidth={1} />
                 </div>
                 <h3 className="text-white font-black text-2xl uppercase tracking-tighter italic">Ledger Empty</h3>
                 <p className="text-slate-500 text-xs font-bold max-w-sm mx-auto mt-3 uppercase tracking-widest leading-relaxed">Initialize your institutional ledger by generating your first e-invoice or uploading a batch payload.</p>
                 <Button onClick={() => navigate('/upload-invoice')} className="mt-12" size="lg">Start Ledger</Button>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )

}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100" />
          <div className="space-y-2">
            <div className="h-4 w-28 bg-sky-100 rounded" />
            <div className="h-3 w-36 bg-sky-100 rounded" />
          </div>
        </div>
      </td>
      <td colSpan={5} className="px-4 py-6"><div className="h-4 w-full bg-sky-50 rounded" /></td>
    </tr>
  )
}
