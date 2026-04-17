import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, ArrowLeft, AlertCircle, Mail } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { toast } from 'sonner'
import api from '@/services/api'
import type { ApiErrorResponse } from '@/services/api'
import type { AxiosError } from 'axios'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
      toast.success('OTP sent! Check your email.')
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>
      setError(axiosErr?.response?.data?.message || 'Failed to send OTP')
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

          {!sent ? (
            <>
              <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Forgot Password?</h1>
              <p className="text-slate-500 text-sm mb-6">Enter your email and we'll send a 6-digit OTP to reset your password.</p>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-700">
                  <AlertCircle size={15} className="shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="admin@company.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <Button type="submit" loading={loading} className="w-full justify-center py-3">
                  Send Reset OTP
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-indigo-600" />
              </div>
              <h2 className="text-xl font-display font-bold text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-500 text-sm mb-6">
                We sent a 6-digit OTP to <strong>{email}</strong>.<br/>
                Use it to reset your password.
              </p>
              <Link
                to="/reset-password"
                className="block w-full text-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Enter OTP → Reset Password
              </Link>
            </div>
          )}

          <Link to="/login" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mt-6">
            <ArrowLeft size={14} /> Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
