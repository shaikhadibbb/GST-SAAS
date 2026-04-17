import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Download, Trash2, ShieldCheck, 
  Building, Mail, Share2, FileText, CheckCircle2
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import Sidebar from '@/components/layout/Sidebar'
import api from '@/services/api'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/invoices/${id}`).then(res => setInvoice(res.data.data)).catch(() => toast.error('Document sync failed')).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex bg-sky-50 h-screen items-center justify-center font-bold text-sky-600">Syncing Record...</div>

  return (
    <div className="flex h-screen bg-sky-50 overflow-hidden text-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-10 py-12">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="flex items-center justify-between border-b border-sky-200 pb-8">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold uppercase text-[11px] tracking-widest">
               <ArrowLeft size={16} /> Back to Stream
            </button>
            <div className="flex items-center gap-3">
               <Button variant="outline" size="sm" icon={<Share2 size={16}/>} />
               <Button variant="outline" size="sm" icon={<Download size={16}/>} />
               <Button icon={<Mail size={16}/>}>Mail Vendor</Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
               <Card className="p-0 overflow-hidden">
                  <div className="px-10 py-8 bg-sky-50/50 border-b border-sky-100 flex items-center justify-between">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white border border-sky-100 rounded-2xl flex items-center justify-center text-sky-500 shadow-sm">
                           <FileText size={32} />
                        </div>
                        <div>
                           <h2 className="text-2xl font-extrabold tracking-tight uppercase leading-none">{invoice?.invoiceNumber}</h2>
                           <p className="text-[11px] font-extrabold text-sky-600 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                              <ShieldCheck size={14} /> Cryptographic Record
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Document Date</p>
                        <p className="text-sm font-bold text-slate-900 mt-1">{invoice?.invoiceDate ? format(new Date(invoice.invoiceDate), 'PPP') : 'N/A'}</p>
                     </div>
                  </div>

                  <div className="p-10 space-y-12">
                     <div className="grid md:grid-cols-2 gap-12 border-b border-sky-100 pb-12">
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-l-2 border-sky-200 pl-3">Merchant</h4>
                           <p className="text-lg font-extrabold">{invoice?.gstinReg?.company?.name || 'My Firm'}</p>
                           <p className="text-sm text-sky-600 font-bold uppercase tracking-tight">GSTIN: {invoice?.gstinReg?.gstin}</p>
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-l-2 border-sky-200 pl-3">Authorized Vendor</h4>
                           <p className="text-lg font-extrabold">{invoice?.customerName}</p>
                           <p className="text-sm text-slate-500 font-medium">Place of Supply: <span className="text-slate-900 font-bold">{invoice?.placeOfSupply}</span></p>
                        </div>
                     </div>

                     <div className="rounded-2xl border border-sky-100 overflow-hidden">
                        <table className="w-full text-left">
                           <thead className="bg-sky-50/50 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-sky-100">
                              <tr>
                                 <th className="px-8 py-4">Accounting Head</th>
                                 <th className="px-4 py-4 text-center">HSN</th>
                                 <th className="px-4 py-4 text-right">Taxable</th>
                                 <th className="px-8 py-4 text-right">GST Settlement</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-sky-100">
                              <tr className="text-sm">
                                 <td className="px-8 py-6 font-bold text-slate-900 uppercase tracking-tight">Standard Commercial Supply</td>
                                 <td className="px-4 py-6 text-center text-slate-500 font-semibold">{invoice?.hsnCode || '—'}</td>
                                 <td className="px-4 py-6 text-right text-slate-600 font-bold">₹{Number(invoice?.taxableValue).toLocaleString()}</td>
                                 <td className="px-8 py-6 text-right text-sky-600 font-black">₹{Number(invoice?.totalTax).toLocaleString()}</td>
                              </tr>
                           </tbody>
                        </table>
                        <div className="px-10 py-10 bg-sky-50/30 flex items-center justify-between border-t border-sky-100">
                           <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Settlement Total</span>
                           <h3 className="text-5xl font-black text-slate-900 tracking-tighter">₹{Number(invoice?.totalAmount).toLocaleString()}</h3>
                        </div>
                     </div>
                  </div>
               </Card>
            </div>

            <div className="space-y-8">
               <Card className="p-8">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                     <Building size={16} className="text-sky-500" /> Administrative Logic
                  </h3>
                  <div className="space-y-6">
                     <div className="flex justify-between">
                        <span className="text-xs text-slate-400 font-bold uppercase">Taxability</span>
                        <span className="text-xs text-success-dark font-black uppercase bg-success-light px-3 py-1 rounded-lg">Regular</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-xs text-slate-400 font-bold uppercase">IRN Status</span>
                        <span className="flex items-center gap-1.5 text-sky-600 font-black text-[10px] uppercase">
                           <CheckCircle2 size={14} /> Registered
                        </span>
                     </div>
                  </div>
               </Card>

               <Card className="p-8">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-10">Verification Stream</h3>
                  <div className="relative pl-6 space-y-10 border-l-2 border-sky-100">
                     {[
                        { t: 'Record Created', d: 'Indexed in institutional ledger', time: '2h ago', status: 'done' },
                        { t: 'Tax Verification', d: 'Validation complete', time: '2h ago', status: 'done' },
                        { t: 'Signature Applied', d: 'PKI Certificate attached', time: '1h ago', status: 'active' },
                        { t: 'Filing Queue', d: 'Batch processing scheduled', time: 'Pending', status: 'waiting' }
                     ].map((step, i) => (
                        <div key={i} className="relative">
                           <div className={`absolute -left-[32px] top-0 w-4 h-4 rounded-full border-4 border-white ${
                              step.status === 'done' ? 'bg-success-main shadow-lg' : 
                              step.status === 'active' ? 'bg-sky-500 animate-pulse' : 'bg-sky-100'
                           }`} />
                           <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-900 mb-1 leading-none">{step.t}</p>
                           <p className="text-xs text-slate-400 font-medium">{step.d}</p>
                           <p className="text-[10px] font-black text-sky-600 mt-2 uppercase">{step.time}</p>
                        </div>
                     ))}
                  </div>
               </Card>
               <Button variant="danger" className="w-full">Void Document Record</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
