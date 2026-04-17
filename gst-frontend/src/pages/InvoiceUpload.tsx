import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, 
  X, Search, ShieldCheck, Sparkles, Inbox, RefreshCw, ChevronRight, ArrowLeft
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import Sidebar from '@/components/layout/Sidebar'
import api from '@/services/api'
import { toast } from 'sonner'

export default function InvoiceUpload() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles(prev => [...prev, ...droppedFiles])
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    const formData = new FormData()
    files.forEach(f => formData.append('invoices', f))

    try {
      const res = await api.post('/invoices/upload', formData)
      setResults(res.data.data)
      toast.success('AI Extraction Complete')
    } catch (err) {
      toast.error('Extraction failed. Check network integrity.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 selection:bg-emerald-500/20">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-10 py-10">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="flex items-center justify-between border-b border-white/5 pb-10">
             <div className="space-y-3">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-emerald-400 transition-colors font-black uppercase text-[10px] tracking-[0.2em] mb-4">
                  <ArrowLeft size={16} /> Matrix Stream
                </button>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic font-display">Neural Extraction</h1>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Document Intelligence Subsystem</p>
             </div>
             <div className="p-4 bg-emerald-500 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] text-slate-950">
                <Sparkles size={36} strokeWidth={2} />
             </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
               <Card className="p-0 overflow-hidden border-slate-800/50">
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    className="p-20 text-center border-2 border-dashed border-slate-800 bg-slate-950/20 hover:bg-emerald-500/[0.02] hover:border-emerald-500/30 transition-all group m-8 rounded-[40px] relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-slate-800 shadow-void group-hover:scale-110 group-hover:border-emerald-500/50 transition-all">
                        <Upload className="text-emerald-500" size={40} strokeWidth={1.5} />
                     </div>
                     <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter italic">Ingest Matrix Documents</h3>
                     <p className="text-slate-500 font-bold text-xs max-w-sm mx-auto mb-12 uppercase tracking-widest leading-relaxed">PDF • PNG • JPEG • OCR. Gemini 1.5 Pro will synthesize tax vectors in real-time.</p>
                     
                     <div className="flex justify-center gap-5 relative z-10">
                        <input 
                           type="file" multiple id="fileUpload" className="hidden" 
                           onChange={(e) => e.target.files && setFiles(prev => [...prev, ...Array.from(e.target.files!)])} 
                        />
                        <button onClick={() => document.getElementById('fileUpload')?.click()} className="px-10 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-slate-600 transition-all shadow-xl">
                           Manual Vector
                        </button>
                        <Button onClick={handleUpload} loading={uploading} disabled={files.length === 0} icon={<RefreshCw size={20} />} className="px-10 py-5">
                           Initiate Synthesis
                        </Button>
                     </div>
                  </div>

                  <AnimatePresence>
                     {files.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-12 pb-12 space-y-4">
                           <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6">Extraction Pipeline</h4>
                           {files.map((f, i) => (
                              <div key={i} className="flex items-center justify-between p-5 bg-slate-950/50 border border-slate-800 rounded-2xl group transition-all hover:border-emerald-500/20">
                                 <div className="flex items-center gap-5">
                                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                                       <FileText size={20} />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-slate-200 truncate w-64 uppercase tracking-tighter">{f.name}</p>
                                       <p className="text-[10px] font-bold text-slate-600 uppercase mt-1">VECTOR SIZE: {(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                 </div>
                                 <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-2 text-slate-700 hover:text-red-500 transition-colors">
                                    <X size={20} />
                                 </button>
                              </div>
                           ))}
                        </motion.div>
                     )}
                  </AnimatePresence>
               </Card>
            </div>

            <div className="space-y-8">
                <Card className="p-10 border-l-4 border-l-emerald-500 bg-slate-900">
                   <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                     <ShieldCheck className="text-emerald-500" size={20} /> Neural Standards
                   </h3>
                   <div className="space-y-6">
                     {[
                       'OCR Recursive Logic',
                       'HSN Semantic Mapping',
                       'SHA-512 Audit Integrity',
                       'GSTN Matrix Sync'
                     ].map((t, i) => (
                       <div key={i} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                         <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={12} />
                         </div>
                         {t}
                       </div>
                     ))}
                   </div>
                </Card>

                <Card className="p-10 bg-slate-900 border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                   <h3 className="text-xl font-black text-white mb-3 italic uppercase tracking-tighter">Mobile Ingest</h3>
                   <p className="text-xs text-slate-500 leading-relaxed font-bold uppercase tracking-widest mb-8 opacity-80">Sync matrix documents directly from your authorized mobile vector center.</p>
                   <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-[0.2em] border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950">Mobile Config</Button>
                </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

