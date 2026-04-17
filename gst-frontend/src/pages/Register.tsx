import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, AlertCircle, CheckCircle, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/common/Button'

const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$/
const STATES = [
  {code:'07',name:'Delhi'},{code:'08',name:'Rajasthan'},{code:'09',name:'Uttar Pradesh'},
  {code:'19',name:'West Bengal'},{code:'24',name:'Gujarat'},{code:'27',name:'Maharashtra'},
  {code:'29',name:'Karnataka'},{code:'32',name:'Kerala'},{code:'33',name:'Tamil Nadu'},
  {code:'36',name:'Telangana'},{code:'37',name:'Andhra Pradesh'},
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ email:'', password:'', companyName:'', gstin:'', pan:'', stateCode:'' })
  const [errs, setErrs] = useState<Record<string,string>>({})

  const set = (k: string, v: string) => { setForm(f => ({...f,[k]:v})); setErrs(e => ({...e,[k]:''})) }

  const v1 = () => {
    const e: Record<string,string> = {}
    if (!form.email) e.email='Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email='Invalid email'
    if (!form.password) e.password='Required'
    else if (form.password.length < 8) e.password='Min 8 chars'
    else if (!/[A-Z]/.test(form.password)) e.password='Need uppercase'
    else if (!/[0-9]/.test(form.password)) e.password='Need number'
    else if (!/[^A-Za-z0-9]/.test(form.password)) e.password='Need special char'
    setErrs(e); return !Object.keys(e).length
  }

  const v2 = () => {
    const e: Record<string,string> = {}
    if (!form.companyName) e.companyName='Required'
    if (!form.gstin) e.gstin='Required'
    else if (!GSTIN_REGEX.test(form.gstin)) e.gstin='Invalid GSTIN'
    if (!form.pan || !/^[A-Z]{5}\d{4}[A-Z]$/.test(form.pan)) e.pan='Invalid PAN'
    if (!form.stateCode) e.stateCode='Required'
    else if (form.gstin && form.gstin.substring(0,2) !== form.stateCode) e.gstin='GSTIN must match state'
    setErrs(e); return !Object.keys(e).length
  }

  const next = () => { if (step===1 && !v1()) return; if (step===2 && !v2()) return; setStep(s=>s+1) }

  const submit = async () => {
    setError(''); setLoading(true)
    try {
      await register({ company:{name:form.companyName,gstin:form.gstin,pan:form.pan,stateCode:form.stateCode}, user:{email:form.email,password:form.password,role:'ADMIN'} })
      setStep(4)
    } catch (err: any) { setError(err?.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Zap size={15} className="text-white" fill="white" /></div>
              <span className="font-display font-bold text-lg">GST<span className="text-indigo-600">Pro</span></span>
            </Link>
            <div className="flex items-center gap-2">
              {['Account','Company','Review','Done'].map((s,i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i+1<step?'bg-emerald-500 text-white':i+1===step?'bg-indigo-600 text-white':'bg-slate-100 text-slate-400'}`}>
                    {i+1<step ? <CheckCircle size={14}/> : i+1}
                  </div>
                  {i<3 && <div className={`h-0.5 flex-1 rounded ${i+1<step?'bg-emerald-400':'bg-slate-100'}`} />}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8">
            {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-700"><AlertCircle size={15}/>{error}</div>}
            <AnimatePresence mode="wait">
              {step===1 && (
                <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
                  <h2 className="text-xl font-display font-bold mb-4">Create your account</h2>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@company.com"
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errs.email?'border-red-300':'border-slate-200'}`} />
                    {errs.email && <p className="text-red-500 text-xs mt-1">{errs.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPw?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                        className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errs.password?'border-red-300':'border-slate-200'}`} />
                      <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
                      </button>
                    </div>
                    {errs.password && <p className="text-red-500 text-xs mt-1">{errs.password}</p>}
                  </div>
                </motion.div>
              )}
              {step===2 && (
                <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
                  <h2 className="text-xl font-display font-bold mb-4">Company details</h2>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
                    <input value={form.companyName} onChange={e=>set('companyName',e.target.value)} placeholder="Acme Technologies Pvt Ltd"
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errs.companyName?'border-red-300':'border-slate-200'}`} />
                    {errs.companyName && <p className="text-red-500 text-xs mt-1">{errs.companyName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">GSTIN</label>
                    <input value={form.gstin} onChange={e=>set('gstin',e.target.value.toUpperCase())} placeholder="27AABCU9603R1ZX" maxLength={15}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-mono-gstin focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errs.gstin?'border-red-300':'border-slate-200'}`} />
                    {errs.gstin && <p className="text-red-500 text-xs mt-1">{errs.gstin}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">PAN</label>
                    <input value={form.pan} onChange={e=>set('pan',e.target.value.toUpperCase())} placeholder="AABCU9603R" maxLength={10}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-mono-gstin focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errs.pan?'border-red-300':'border-slate-200'}`} />
                    {errs.pan && <p className="text-red-500 text-xs mt-1">{errs.pan}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                    <select value={form.stateCode} onChange={e=>set('stateCode',e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errs.stateCode?'border-red-300':'border-slate-200'}`}>
                      <option value="">Select state</option>
                      {STATES.map(s=><option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
                    </select>
                    {errs.stateCode && <p className="text-red-500 text-xs mt-1">{errs.stateCode}</p>}
                  </div>
                </motion.div>
              )}
              {step===3 && (
                <motion.div key="s3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
                  <h2 className="text-xl font-display font-bold mb-5">Review & confirm</h2>
                  <div className="bg-slate-50 rounded-2xl p-5 space-y-3 text-sm mb-6">
                    {[{l:'Email',v:form.email},{l:'Company',v:form.companyName},{l:'GSTIN',v:form.gstin,m:true},{l:'PAN',v:form.pan,m:true},{l:'State',v:STATES.find(s=>s.code===form.stateCode)?.name??form.stateCode}].map(r=>(
                      <div key={r.l} className="flex justify-between gap-4">
                        <span className="text-slate-500">{r.l}</span>
                        <span className={`font-medium text-slate-800 ${r.m?'font-mono-gstin':''}`}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <Button onClick={submit} loading={loading} className="w-full justify-center py-3">Create Account</Button>
                </motion.div>
              )}
              {step===4 && (
                <motion.div key="s4" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="text-center py-4">
                  <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:200}}
                    className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle size={40} className="text-emerald-500"/>
                  </motion.div>
                  <h2 className="text-2xl font-display font-bold mb-2">You're all set!</h2>
                  <p className="text-slate-500 text-sm mb-8">Your GSTPro account is ready.</p>
                  <Button onClick={()=>navigate('/dashboard')} className="w-full justify-center py-3">Go to Dashboard <ArrowRight size={16}/></Button>
                </motion.div>
              )}
            </AnimatePresence>
            {step<3 && (
              <div className="flex items-center justify-between mt-8">
                {step>1 ? <Button variant="secondary" onClick={()=>setStep(s=>s-1)} icon={<ArrowLeft size={15}/>}>Back</Button> : <div/>}
                <Button onClick={next} icon={<ArrowRight size={15}/>}>{step===1?'Next: Company':'Review'}</Button>
              </div>
            )}
            {step<4 && <p className="text-center text-xs text-slate-400 mt-6">Already have an account? <Link to="/login" className="text-indigo-600 font-medium">Sign in</Link></p>}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
