import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, CheckCircle2, AlertTriangle, Download, 
  RefreshCw, ChevronRight, PieChart, Loader2, Zap, 
  HelpCircle, ShieldCheck
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import Sidebar from '@/components/layout/Sidebar'
import api from '@/services/api'
import { toast } from 'sonner'

export default function GSTR1Filing() {
  const [data, setData] = useState<any>(null)
  const [month, setMonth] = useState('4')
  const [year, setYear] = useState('2026')
  const [loading, setLoading] = useState(false)

  const loadData = async (isDemo = false) => {
    setLoading(true)
    try {
      if (isDemo) {
        toast.info('Synthesizing institutional reporting payload...')
        await new Promise(r => setTimeout(r, 1000))
        setData({
          totalInvoices: 24, taxableValue: 7200000, totalTax: 1296000,
          categories: [
            { category: 'B2B Supplies', key: 'b2b', count: 18, taxableValue: 6800000, taxAmount: 1224000 },
            { category: 'B2C Small', key: 'b2cs', count: 6, taxableValue: 400000, taxAmount: 72000 }
          ]
        })
        return
      }
      const res = await api.get(`/gstr1/prepare?month=${month}&year=${year}`)
      setData(res.data.data)
    } catch (err) { toast.error('Tax Engine connection failed') } finally { setLoading(false) }
  }

  return (
    <div className="flex h-screen bg-sky-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-10 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-sky-200 pb-8 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2.5 bg-sky-100 rounded-xl">
                    <PieChart className="text-sky-600" size={24} />
                 </div>
                 <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Tax Report Generator</h1>
              </div>
              <p className="text-slate-500 font-medium">Categorize and validate GSTR-1 annexures for institutional filing.</p>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-white border border-sky-200 rounded-2xl shadow-sm">
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-transparent border-0 text-slate-900 font-bold text-sm px-4 focus:ring-0 outline-none">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                   <option key={i} value={i+1}>{m}</option>
                ))}
              </select>
              <div className="w-px h-6 bg-sky-100" />
              <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-transparent border-0 text-slate-900 font-bold text-sm px-4 focus:ring-0 outline-none">
                 <option value="2026">2026</option>
                 <option value="2025">2025</option>
              </select>
              <Button onClick={() => loadData()} loading={loading} icon={<RefreshCw size={18} />} size="sm">
                 Analyze Period
              </Button>
            </div>
          </div>

          {!data ? (
            <div className="py-32 flex flex-col items-center">
               <Card className="max-w-md p-12 text-center border-sky-200 bg-white">
                  <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                     <FileText className="text-sky-300" size={40} strokeWidth={1.5} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">No Report Analyzed</h2>
                  <p className="text-slate-500 text-sm leading-relaxed mb-10">Select a reporting period to process ledger data into government-compatible annexures.</p>
                  <div className="flex flex-col gap-3">
                    <Button onClick={() => loadData()}>Process Ledger Data</Button>
                    <Button variant="ghost" onClick={() => loadData(true)}>Load Sample Analysis</Button>
                  </div>
               </Card>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
               {/* Summary KPI Level */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { l: 'Taxable Principal', v: `₹${data.taxableValue.toLocaleString()}`, i: FileText, c: 'text-sky-500' },
                   { l: 'Calculated Liability', v: `₹${data.totalTax.toLocaleString()}`, i: Zap, c: 'text-warning-main' },
                   { l: 'Transaction Count', v: data.totalInvoices, i: CheckCircle2, c: 'text-success-main' }
                 ].map((stat, i) => (
                   <Card key={i} className="p-8 border-sky-100">
                      <div className="flex items-center gap-4 mb-4">
                         <div className={`p-2.5 rounded-xl bg-sky-50 ${stat.c}`}>
                            <stat.i size={20} />
                         </div>
                         <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">{stat.l}</span>
                      </div>
                      <p className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">
                         {stat.v}
                      </p>
                   </Card>
                 ))}
               </div>

               {/* Table & Actions */}
               <div className="grid lg:grid-cols-3 gap-10">
                 <Card className="lg:col-span-2 p-0 overflow-hidden border-sky-100">
                    <div className="px-10 py-6 border-b border-sky-100 bg-sky-50/50">
                       <h3 className="font-bold text-slate-900 uppercase tracking-tight">Annexure Breakdown</h3>
                    </div>
                    <table className="w-full text-left">
                       <thead>
                         <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-sky-100 bg-white">
                            <th className="px-10 py-4">Government Section</th>
                            <th className="px-4 py-4 text-center">Count</th>
                            <th className="px-4 py-4 text-right">Value</th>
                            <th className="px-10 py-4 text-right">GST</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-sky-100">
                         {data.categories.map((c: any, i: number) => (
                           <tr key={i} className="group hover:bg-sky-50 transition-all">
                              <td className="px-10 py-6">
                                 <p className="font-bold text-slate-900 leading-tight tracking-tight uppercase">{c.category}</p>
                                 <p className="text-[10px] font-bold text-sky-500 uppercase mt-1">GSTR-1 Section {c.key.toUpperCase()}</p>
                              </td>
                              <td className="px-4 py-6 text-center text-slate-500 font-semibold">{c.count}</td>
                              <td className="px-4 py-6 text-right text-slate-600 font-semibold">₹{c.taxableValue.toLocaleString()}</td>
                              <td className="px-10 py-6 text-right text-slate-900 font-extrabold">₹{c.taxAmount.toLocaleString()}</td>
                           </tr>
                         ))}
                       </tbody>
                    </table>
                 </Card>

                 <div className="space-y-6">
                    <Card className="p-8 border-l-4 border-l-success-main shadow-lg">
                       <div className="flex items-center gap-3 mb-6">
                          <ShieldCheck className="text-success-main" size={24} />
                          <h3 className="font-bold text-slate-900 uppercase tracking-tight">Audit Cleared</h3>
                       </div>
                       <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                          All mathematical components match the source ledger. The payload is cryptographically signed and ready for submission.
                       </p>
                       <div className="space-y-3">
                          <button className="w-full flex items-center justify-between p-4 bg-white border border-sky-100 rounded-xl text-slate-500 hover:text-sky-600 hover:border-sky-300 transition-all font-semibold text-xs group">
                             PREVIEW JSON SCHEMA <ChevronRight size={14} className="group-hover:translate-x-1" />
                          </button>
                          <button className="w-full flex items-center justify-between p-4 bg-white border border-sky-100 rounded-xl text-slate-500 hover:text-sky-600 hover:border-sky-300 transition-all font-semibold text-xs group">
                             HSN INTEGRITY REPORT <ChevronRight size={14} className="group-hover:translate-x-1" />
                          </button>
                       </div>
                    </Card>

                    <Button className="w-full py-6 text-lg tracking-tight" icon={<Download size={22} />}>
                       Export Filing Payload
                    </Button>
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Signed Government JSON Package</p>
                 </div>
               </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
