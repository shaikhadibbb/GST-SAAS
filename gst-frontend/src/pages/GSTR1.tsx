import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, CheckCircle, AlertTriangle, ChevronRight, FileJson, ArrowRight } from 'lucide-react'
import { useGSTR1Export } from '@/hooks/useGSTR1'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'

export default function GSTR1() {
  const { user } = useAuth()
  const { exportGSTR1, validate, loading, validating } = useGSTR1Export()

  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const [validationResult, setValidationResult] = useState<{ isValid: boolean; totalInvoices: number; errors: string[] } | null>(null)
  
  const handleValidate = async () => {
    const res = await validate(month, year)
    if (res) {
      setValidationResult(res)
    }
  }

  const handleExport = () => {
    exportGSTR1(month, year)
  }

  const isPeriodValid = month && year

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">GSTR-1 Engine</h1>
        <p className="text-slate-500 mt-1">Generate compliant Phase-1 JSON payloads perfectly tuned for the official GSTN Offline Tool.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Setup & Config */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">1</span>
              Select Return Period
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Filing Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value={2026}>2026-2027</option>
                  <option value={2025}>2025-2026</option>
                  <option value={2024}>2024-2025</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Filing Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {[...Array(12)].map((_, i) => {
                    const date = new Date(year, i, 1)
                    return (
                      <option key={i} value={i + 1}>
                        {date.toLocaleString('default', { month: 'long' })}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="pt-2">
                <Button 
                  className="w-full" 
                  onClick={handleValidate} 
                  loading={validating}
                  disabled={!isPeriodValid}
                >
                  Run Validation Engine
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-slate-900 text-white border-0">
             <div className="flex items-center gap-3 mb-3">
               <FileJson size={20} className="text-indigo-400" />
               <h3 className="font-bold">Offline Tool Setup</h3>
             </div>
             <p className="text-sm text-slate-400 leading-relaxed">
               The JSON compiled here strictly meets the GSTN schema. Simply log into the GST portal, navigate to <strong>Returns &gt; Returns Dashboard &gt; GSTR-1 &gt; Prepare Offline</strong> and upload the exported file.
             </p>
          </Card>
        </div>

        {/* Right Col: Output & Results */}
        <div className="lg:col-span-2">
          {!validationResult ? (
            <Card className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-slate-50 border-dashed border-2">
              <div className="w-16 h-16 bg-slate-200/50 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Awaiting Validation</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Select your return period and run the validation engine. We will systematically parse all matching invoices for HSN and GSTIN schema compliance.
              </p>
            </Card>
          ) : (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* Status Card */}
                <Card className={`p-6 border-l-4 ${validationResult.isValid ? 'border-l-emerald-500 bg-white' : 'border-l-red-500 bg-red-50/30'}`}>
                  <div className="flex items-start gap-4">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${validationResult.isValid ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                       {validationResult.isValid ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                     </div>
                     <div className="flex-1 pt-1">
                       <h2 className="text-xl font-bold text-slate-900 mb-1">
                         {validationResult.isValid ? 'Ready for Export' : 'Validation Failed'}
                       </h2>
                       <p className={`text-sm ${validationResult.isValid ? 'text-slate-600' : 'text-red-700 font-medium'}`}>
                         {validationResult.isValid 
                           ? `Processed ${validationResult.totalInvoices} invoices seamlessly. Zero discrepancies found.` 
                           : `${validationResult.errors.length} fatal errors block compilation.`}
                       </p>
                     </div>
                  </div>
                </Card>

                {/* Error Console */}
                {!validationResult.isValid && (
                  <Card className="p-0 overflow-hidden border-red-200">
                    <div className="bg-red-50 px-5 py-3 border-b border-red-100">
                      <h3 className="text-sm font-bold text-red-900">Diagnostic Logs</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <ul className="divide-y divide-red-50">
                        {validationResult.errors.map((err, idx) => (
                          <li key={idx} className="px-5 py-3 text-sm text-red-700 flex items-start gap-2">
                            <span className="text-red-400 mt-0.5"><ChevronRight size={14}/></span>
                            <span className="font-mono text-xs mt-0.5">{err}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                )}

                {/* Success Export */}
                {validationResult.isValid && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <Card className="p-8 text-center bg-gradient-to-br from-indigo-900 to-indigo-800 text-white relative overflow-hidden">
                      {/* Decorative background glow */}
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen opacity-20 filter blur-3xl"></div>
                      
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                            <Download size={32} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Export Payload</h2>
                        <p className="text-indigo-200 mb-8 max-w-sm">
                          Your GSTR-1 payload is structurally sound and natively bucketed.
                        </p>
                        <button
                          onClick={handleExport}
                          disabled={loading}
                          className="px-8 py-4 bg-white text-indigo-900 font-bold rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all hover:-translate-y-1 flex items-center gap-3 disabled:opacity-50"
                        >
                           {loading ? 'Compiling...' : 'Download Output JSON'}
                           <ArrowRight size={18} className="text-indigo-400" />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
