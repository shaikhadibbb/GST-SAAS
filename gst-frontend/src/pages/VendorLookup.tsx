import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShieldCheck, AlertTriangle, Info, Zap, ArrowRight, Loader2, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import api from '@/services/api'
import { toast } from 'sonner'

export default function VendorLookup() {
  const [gstin, setGstin] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!gstin || gstin.length < 15) {
        toast.error('Enter a valid 15-digit GSTIN')
        return
    }

    setLoading(true)
    try {
      const { data } = await api.get(`/vendor/${gstin.toUpperCase()}/health`)
      setResult(data.data)
      toast.success('Vendor health report loaded')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-50 border-emerald-100'
    if (score >= 50) return 'text-amber-500 bg-amber-50 border-amber-100'
    return 'text-red-500 bg-red-50 border-red-100'
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Public Header */}
      <header className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" fill="white" />
           </div>
           <span className="font-bold text-lg text-slate-900 tracking-tighter">GST<span className="text-indigo-600">Pro</span> Lookup</span>
        </Link>
        <Link to="/register">
          <Button variant="outline" size="sm" className="font-bold text-xs uppercase tracking-widest">Client Login</Button>
        </Link>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-20">
        <div className="text-center mb-16">
          <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 mb-4 px-4 py-1">Community Compliance Tool</Badge>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Protect Your ITC Cashflow</h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">Verify any vendor's filing consistency before making payments. Powered by anonymized data from the GSTPro network.</p>
        </div>

        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-20">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Enter 15-digit GSTIN (e.g. 27AAAAA0000A1Z5)"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              className="w-full pl-14 pr-40 py-5 bg-white rounded-3xl border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all text-lg font-bold uppercase placeholder:normal-case placeholder:text-slate-300 shadow-xl shadow-slate-200/50"
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            <div className="absolute right-3 top-3 bottom-3">
              <Button 
                type="submit" 
                className="h-full px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Search'}
              </Button>
            </div>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <Card className="p-8 border-2 border-indigo-600/5 bg-gradient-to-br from-white to-indigo-50/30">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                     <ShieldCheck size={24} className="text-indigo-600" />
                  </div>
                  <div className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest ${getScoreColor(result.healthScore)}`}>
                     Score: {result.healthScore}/100
                  </div>
                </div>
                
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendor GSTIN</p>
                <h2 className="text-2xl font-mono text-slate-900 font-black mb-6">{result.gstin}</h2>
                
                <div className="space-y-4">
                   <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-500">Network Consistency</span>
                      <span className="text-xs font-black text-slate-900">{result.filingConsistency} Match</span>
                   </div>
                   <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-500">Risk Recommendation</span>
                      <span className={`text-xs font-black ${result.healthScore < 40 ? 'text-red-600' : 'text-emerald-600'}`}>{result.recommendation}</span>
                   </div>
                </div>
              </Card>

              <div className="space-y-6">
                <Card className="p-6 border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Info size={16} className="text-slate-400" /> Why this matters?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    If this vendor fails to file GSTR-1, your business cannot claim ITC. A score below 75 indicates potential compliance gaps that could freeze your working capital.
                  </p>
                </Card>

                <Card className="p-8 bg-slate-900 text-white border-0 shadow-2xl shadow-slate-300">
                    <h3 className="text-lg font-bold mb-2">Automate Compliance</h3>
                    <p className="text-xs text-slate-400 mb-6 font-medium">Connect your GSTIN to automatically monitor 1000+ vendors in real-time and recover lost revenue.</p>
                    <Link to="/register">
                      <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 py-6 font-black text-sm uppercase tracking-widest">
                        Start FREE Trial <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </Link>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-32 pt-10 border-t border-slate-100 flex flex-col items-center gap-8">
            <div className="flex items-center gap-8 opacity-40 grayscale">
               <Globe size={24} />
               <span className="font-black text-xl tracking-tighter">TRUSTED NETWORK</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Secure • Anonymized • Real-time Compliance</p>
        </div>
      </main>
    </div>
  )
}
