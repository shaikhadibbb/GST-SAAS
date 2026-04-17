import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Building, Shield, CreditCard, Bell, 
  Key, Globe, Users, Save, CheckCircle2, 
  Smartphone, Database, Lock, Eye, EyeOff
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)

  const tabs = [
    { id: 'profile', label: 'Institutional Profile', icon: Building },
    { id: 'security', label: 'Auth & Encryption', icon: Shield },
    { id: 'billing', label: 'Strategic Tiers', icon: CreditCard },
    { id: 'notifications', label: 'System Alerts', icon: Bell },
  ]

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Institutional configuration updated.')
    }, 1000)
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 selection:bg-emerald-500/20">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-10 py-12">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="flex items-end justify-between border-b border-white/5 pb-10">
            <div>
              <h1 className="text-5xl font-black text-white tracking-tighter leading-none uppercase italic font-display">System Matrix</h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.4em] mt-3">Institutional configuration and compliance logic.</p>
            </div>
            <Button onClick={handleSave} loading={loading} icon={<Save size={20} />} className="shadow-neon">Save Configuration</Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Tab Sidebar */}
            <div className="lg:w-80 space-y-3">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-5 px-6 py-5 rounded-2xl transition-all border font-black uppercase text-[10px] tracking-widest
                    ${activeTab === tab.id ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-neon italic scale-[1.02]' : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'}
                  `}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <Card className="p-12 space-y-12 border-slate-800 bg-slate-900/40 backdrop-blur-xl">
                {activeTab === 'profile' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Institutional Profile</h2>
                    <div className="grid grid-cols-2 gap-10">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] pl-1">Primary Vector</label>
                          <input disabled value={user?.email} className="w-full bg-slate-950 border border-slate-900 rounded-xl py-4 px-6 text-sm font-black text-slate-700 outline-none cursor-not-allowed uppercase" />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Authorized Sentinel</label>
                          <input placeholder="Adib" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-6 text-sm font-bold text-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all outline-none uppercase tracking-widest" />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Entity Identification</label>
                       <input placeholder="Acme Compliance Solutions Pvt Ltd" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-5 px-6 text-sm font-bold text-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all outline-none uppercase tracking-widest" />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Auth & Encryption</h2>
                    <div className="p-8 bg-slate-950 border border-slate-800 rounded-[32px] flex items-center justify-between group hover:border-emerald-500/20 transition-all">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                             <Lock size={28} />
                          </div>
                          <div>
                             <p className="text-sm font-black text-white uppercase tracking-tight">Two-Factor Authentication</p>
                             <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Protect institutional vectors from unauthorized entry.</p>
                          </div>
                       </div>
                       <Button variant="outline" size="sm" className="border-slate-800 text-[10px] tracking-widest uppercase">Enable MFA</Button>
                    </div>

                    <div className="space-y-8 pt-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Current Matrix Key</label>
                          <input type="password" placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-sm focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 outline-none transition-all text-emerald-50 font-bold" />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">New Synthesis Key</label>
                          <input type="password" placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-sm focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 outline-none transition-all text-emerald-50 font-bold" />
                       </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'billing' && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10 text-center py-12">
                    <div className="w-24 h-24 bg-slate-950 border border-slate-800 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-void">
                       <CreditCard className="text-emerald-500" size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Subscription Matrix</h2>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">
                       Active Tier: <span className="text-emerald-400">STARTER MATRIX</span>. 
                       <br/>Credits reset in 12 days.
                    </p>
                    <Button variant="primary" className="mt-8 px-12 py-5 shadow-neon">Upgrade Matrix</Button>
                  </motion.div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

