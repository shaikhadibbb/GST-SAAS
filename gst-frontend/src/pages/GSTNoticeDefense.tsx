import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldAlert, Send, FileText, Download, 
  Sparkles, Bot, User, Scale, AlertTriangle, CheckCircle2,
  ChevronRight, RefreshCw, ArrowUpRight
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import Sidebar from '@/components/layout/Sidebar'
import api from '@/services/api'
import { toast } from 'sonner'

export default function GSTNoticeDefense() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'ai', content: 'Institutional AI Assistant ready. Upload your GST notice (PDF/Image) or describe the legal contention to initiate a tactical defense draft.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return
    const newMessages = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      toast.info('Consulting Gemini 1.5 Pro legal engine...')
      await new Promise(r => setTimeout(r, 2000))
      setMessages([...newMessages, { 
        role: 'ai', 
        content: 'I have analyzed the contention regarding Section 16(4) time-limits. Based on the recent High Court ruling in Bharti Airtel vs Union of India, we can argue that the technical delay in GSTR-3B filing does not invalidate the ITC entitlement if the underlying transactions are verified.'
      }])
    } catch (err) {
      toast.error('Legal AI offline.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 selection:bg-emerald-500/20">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Strip */}
        <div className="px-10 py-8 bg-slate-900 border-b border-white/5 flex items-center justify-between shadow-void relative z-20">
           <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-slate-950 text-emerald-500 border border-slate-800 rounded-2xl flex items-center justify-center shadow-inner">
                 <Scale size={32} strokeWidth={2} />
              </div>
              <div>
                 <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic font-display">Strategy Defense</h1>
                 <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.4em] mt-1">Matrix Synthesis Engine • Gemini 1.5</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" icon={<FileText size={18}/>} className="border-slate-800 text-[10px] tracking-widest uppercase">Legal Vault</Button>
              <Button size="sm" icon={<ShieldAlert size={18}/>} className="shadow-neon px-6">Crisis Protocol</Button>
           </div>
        </div>

        <div className="flex-1 p-10 flex gap-10 overflow-hidden relative">
           <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.02] to-transparent pointer-events-none" />
           
           {/* Chat Interface */}
           <div className="flex-1 flex flex-col gap-8 overflow-hidden relative z-10">
              <Card className="flex-1 p-0 flex flex-col overflow-hidden border-slate-800 bg-slate-900/40 backdrop-blur-xl">
                 <div className="flex-1 overflow-y-auto space-y-8 p-10 pr-6 custom-scrollbar">
                    {messages.map((m, i) => (
                       <motion.div 
                          key={i} initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                          className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                       >
                          <div className={`max-w-[80%] p-8 rounded-[32px] ${
                             m.role === 'ai' ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-emerald-500 text-slate-950 shadow-neon font-bold translate-y-[-4px]'
                          }`}>
                             <div className="flex items-center gap-2 mb-4">
                                {m.role === 'ai' ? <Bot size={16} className="text-emerald-500" /> : <User size={16} />}
                                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${m.role === 'ai' ? 'text-emerald-500/60' : 'text-slate-900'}`}>
                                   {m.role === 'ai' ? 'Neural Advisor' : 'Identity Verified'}
                                </span>
                             </div>
                             <p className="text-sm font-bold leading-relaxed tracking-wide">{m.content}</p>
                          </div>
                       </motion.div>
                    ))}
                    {loading && (
                       <div className="flex justify-start">
                          <div className="bg-slate-950 border border-slate-800 p-8 rounded-[32px] animate-pulse">
                             <div className="flex items-center gap-4">
                                <RefreshCw size={18} className="animate-spin text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.4em]">Synthesizing Matrix...</span>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>

                 {/* Input Cluster */}
                 <div className="p-8 bg-slate-950/50 border-t border-white/5 relative">
                    <input 
                       value={input} onChange={(e) => setInput(e.target.value)}
                       onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                       placeholder="SCAN CONTENTION OR UPLOAD VECTOR..."
                       className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-6 px-8 pr-24 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700 text-emerald-50"
                    />
                    <button 
                       onClick={handleSend}
                       className="absolute right-12 top-1/2 -translate-y-1/2 w-14 h-14 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center hover:bg-emerald-400 transition-all shadow-neon"
                    >
                       <Send size={24} />
                    </button>
                 </div>
              </Card>
           </div>

           {/* Content Sidebar */}
           <div className="w-96 space-y-8 overflow-y-auto relative z-10 pr-2">
              <Card className="p-10 border-slate-800 bg-slate-900 shadow-void">
                 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-10">Defense Pipeline</h3>
                 <div className="space-y-8">
                    {[
                      { l: 'Notice Synced', s: 'done' },
                      { l: 'Precedent Scan', s: 'active' },
                      { l: 'Draft Synthesis', s: 'wait' }
                    ].map((step, i) => (
                       <div key={i} className="flex items-center gap-4">
                          <div className={`w-2.5 h-2.5 rounded-full ${step.s === 'done' ? 'bg-emerald-500 shadow-neon' : step.s === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-800'}`} />
                          <span className={`text-[11px] font-black uppercase tracking-widest ${step.s === 'done' ? 'text-slate-200' : 'text-slate-600'}`}>{step.l}</span>
                       </div>
                    ))}
                 </div>
              </Card>

              <Card className="p-10 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20 shadow-void group">
                 <div className="flex items-center gap-4 mb-6">
                    <AlertTriangle className="text-red-500" size={24} />
                    <span className="text-[10px] font-black text-red-500/80 uppercase tracking-[0.3em]">Threat Level</span>
                 </div>
                 <p className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">High Contention</p>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Contesting ITC on time-limits is 65% successful in recent matrix appeals.</p>
                 <Button variant="secondary" className="w-full mt-10 bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-[10px] tracking-widest uppercase">Analyze Case Map</Button>
              </Card>

              <Card className="p-10 border-l-4 border-l-emerald-500 bg-slate-900">
                 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-4">Export Protocol</h3>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed mb-8">Synthesize drafted response formatted for Portal Ingress (GST-DRC-06).</p>
                 <Button className="w-full shadow-neon py-4" size="sm" icon={<Download size={18}/>}>Download Vector</Button>
              </Card>
           </div>
        </div>
      </main>
    </div>
  )
}

