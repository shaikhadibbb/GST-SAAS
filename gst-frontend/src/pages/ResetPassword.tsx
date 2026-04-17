import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { toast } from 'sonner'
import api from '@/services/api'
import type { ApiErrorResponse } from '@/services/api'
import type { AxiosError } from 'axios'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Min 8 chars', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special char', pass: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.pass).length
  const color = score <= 1 ? 'bg-red-400' : score <= 2 ? 'bg-orange-400' : score <= 3 ? 'bg-yellow-400' : 'bg-emerald-400'
  const label = ['', 'Weak', 'Fair', 'Good', 'Strong'][score]

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= score ? color : 'bg-slate-200'}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map(c => (
          <span key={c.label} className={`text-xs flex items-center gap-1 ${c.pass ? 'text-emerald-600' : 'text-slate-400'}`}>
            <CheckCircle size={10} className={c.pass ? 'opacity-100' : 'opacity-0'} />
            {c.label}
          </span>
        ))}
        {password && <span className={`text-xs font-medium ml-auto ${color.replace('bg-', 'text-')}`}>{label}</span>}
      </div>
    </div>
  )
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.newPassword.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email: form.email, otp: form.otp, newPassword: form.newPassword })
      toast.success('Password reset successfully! Please login.')
      navigate('/login')
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>
      setError(axiosErr?.response?.data?.message || 'Invalid OTP or request failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap size={15} className="text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-lg">GST<span className="text-indigo-600">Pro</span></span>
          </Link>

          <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Reset Password</h1>
          <p className="text-slate-500 text-sm mb-6">Enter the OTP sent to your email and set a new password.</p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-700">
              <AlertCircle size={15} className="shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                placeholder="admin@company.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">6-Digit OTP</label>
              <input value={form.otp} onChange={e => set('otp', e.target.value.replace(/\D/g, '').slice(0, 6))} required
                placeholder="123456" maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-center font-mono text-xl tracking-widest" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.newPassword} onChange={e => set('newPassword', e.target.value)} required
                  placeholder="Min 8 chars, uppercase, number, special"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.newPassword && <PasswordStrength password={form.newPassword} />}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required
                placeholder="Repeat new password"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${form.confirmPassword && form.newPassword !== form.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
              {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            <Button type="submit" loading={loading} className="w-full justify-center py-3">
              Reset Password
            </Button>
          </form>

          <div className="flex items-center justify-between mt-4">
            <Link to="/login" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeft size={14} /> Back to login
            </Link>
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">
              Resend OTP
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
