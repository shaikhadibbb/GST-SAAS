import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, ShieldCheck, ArrowRight, Shield } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { Card } from '@/components/common/Card'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Access granted to institutional environment.')
      navigate('/dashboard')
    } catch (err) {
      toast.error('Authentication failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden selection:bg-emerald-500/20">
      {/* Background Decorative Matrix */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -ml-20 -mb-20" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.4)] text-slate-950 border-2 border-emerald-400">
             <Shield size={32} />
          </motion.div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic font-display">Void Access</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.4em] mt-4">Authorized Personnel Only • Layer 7 Secure</p>
        </div>

        <Card className="p-12 border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl shadow-void">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Identity Vector</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="USER@MATRIX.VOID"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-14 pr-4 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-800 uppercase tracking-widest text-emerald-50"
                />
              </div>
            </div>

            <div className="space-y-3">
               <div className="flex justify-between items-center pl-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Access Key</label>
                  <Link to="/forgot-password" size="sm" className="text-[10px] font-black text-emerald-500/60 uppercase tracking-tight hover:text-emerald-400 hover:underline transition-all">Sync Failure?</Link>
               </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-14 pr-4 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-800 text-emerald-50"
                />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full py-5 text-[11px] font-black uppercase tracking-[0.3em] shadow-neon mt-4" icon={<LogIn size={20} />}>
              Grant Access
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Matrix unlinked? <Link to="/register" className="text-emerald-500 font-black hover:text-emerald-400 transition-colors">Register Firm</Link>
            </p>
          </div>
        </Card>

        <div className="mt-12 flex items-center justify-center gap-3 text-slate-600">
           <ShieldCheck size={16} className="text-emerald-500/40" />
           <p className="text-[9px] font-black uppercase tracking-[0.3em]">AES-512 Matrix Encrypted Session</p>
        </div>
      </motion.div>
    </div>
  )

}
