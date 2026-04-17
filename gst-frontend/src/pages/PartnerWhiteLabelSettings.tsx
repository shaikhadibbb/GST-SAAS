import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, Upload, Palette, Globe, Mail, 
  CheckCircle2, Camera, Eye, Zap, Save, Loader2 
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { toast } from 'sonner'
import api from '@/services/api'

export default function PartnerWhiteLabelSettings() {
  const [loading, setLoading] = useState(false)
  const [previewPlan, setPreviewPlan] = useState<'MOBILE' | 'DESKTOP'>('DESKTOP')
  
  const [config, setConfig] = useState({
     firmName: 'Artha Tax Advisory',
     subdomain: 'artha',
     primaryColor: '#4F46E5',
     customSenderName: 'Aditya from Artha',
     customEmailDomain: 'reports.arthatax.com'
  })

  const handleSave = async () => {
     setLoading(true)
     try {
        await api.patch('/partner/settings/whitelabel', config)
        toast.success('Whitelabel configuration saved successfully!')
     } catch (err) {
        toast.error('Failed to save settings')
     } finally {
        setLoading(false)
     }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               <Settings className="text-indigo-600" /> Whitelabel Settings
            </h1>
            <p className="text-slate-500 font-medium">Control how your portal appears to your clients.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="font-bold border-slate-200">Reset Defaults</Button>
             <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 px-8">
                {loading ? <Loader2 className="animate-spin" /> : <><Save size={16} className="mr-2" /> Save Changes</>}
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Settings Section */}
          <div className="lg:col-span-4 space-y-6">
             <Card className="p-6">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                   <Palette size={18} className="text-indigo-600" /> Brand Identity
                </h3>
                
                <div className="space-y-6">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Portal Logo</label>
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-all cursor-pointer">
                            <Camera size={20} />
                            <span className="text-[8px] font-bold mt-1 uppercase">Upload</span>
                         </div>
                         <p className="text-[10px] text-slate-500 font-medium">PNG or SVG only.<br/>Transparent background recommended.</p>
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Primary Color</label>
                      <div className="flex items-center gap-3">
                         <input 
                           type="color" 
                           value={config.primaryColor}
                           onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                           className="w-10 h-10 rounded-xl border-0 cursor-pointer p-0 overflow-hidden" 
                         />
                         <input 
                           type="text" 
                           value={config.primaryColor}
                           onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                           className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-2 font-mono text-xs font-bold text-slate-700"
                         />
                      </div>
                   </div>
                </div>
             </Card>

             <Card className="p-6">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                   <Globe size={18} className="text-indigo-600" /> Subdomain & Domain
                </h3>
                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Custom Subdomain</label>
                      <div className="flex items-center gap-2">
                         <input 
                           type="text" 
                           value={config.subdomain}
                           onChange={(e) => setConfig({...config, subdomain: e.target.value})}
                           className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-2 text-xs font-bold"
                         />
                         <span className="text-xs font-black text-slate-400">.gstpro.in</span>
                      </div>
                   </div>
                   <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-3 rounded-lg flex gap-2">
                      <CheckCircle2 size={12} className="shrink-0" /> Redirects artha.gstpro.in to your profile.
                   </p>
                </div>
             </Card>

             <Card className="p-6">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                   <Mail size={18} className="text-indigo-600" /> Email Whitelabeling
                </h3>
                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sender Name</label>
                      <input 
                        type="text" 
                        value={config.customSenderName}
                        onChange={(e) => setConfig({...config, customSenderName: e.target.value})}
                        className="w-full bg-slate-100 border-0 rounded-xl px-4 py-2 text-xs font-bold"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email Domain</label>
                      <input 
                        type="text" 
                        value={config.customEmailDomain}
                        onChange={(e) => setConfig({...config, customEmailDomain: e.target.value})}
                        placeholder="reports.yourfirm.com"
                        className="w-full bg-slate-100 border-0 rounded-xl px-4 py-2 text-xs font-bold"
                      />
                   </div>
                </div>
             </Card>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-8">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                   <Eye size={18} className="text-indigo-600" /> Live Preview
                </h3>
                <div className="bg-white border border-slate-100 p-1 rounded-xl flex gap-1">
                   {['DESKTOP', 'MOBILE'].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setPreviewPlan(p as any)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all ${previewPlan === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}
                      >
                         {p}
                      </button>
                   ))}
                </div>
             </div>

             <div className={`w-full bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden transition-all duration-500 ${previewPlan === 'MOBILE' ? 'max-w-[360px] mx-auto' : ''}`}>
                {/* Mock Portal Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ borderLeft: `4px solid ${config.primaryColor}` }}>
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: config.primaryColor }}>
                         <Zap size={16} fill="white" />
                      </div>
                      <span className="font-bold text-base text-slate-900 tracking-tight">{config.firmName}</span>
                   </div>
                   <div className="w-6 h-6 rounded-full bg-slate-100" />
                </div>

                {/* Mock Dashboard Body */}
                <div className="bg-slate-50/50 p-8 min-h-[500px]">
                   <div className="flex items-center justify-between mb-10">
                      <div>
                         <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back, Aditya</h2>
                         <p className="text-[10px] text-slate-500 font-medium">Compliance Dashboard by {config.firmName}</p>
                      </div>
                      <div className="px-4 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] border border-emerald-100">
                         System Active
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-10">
                      {[1, 2].map(i => (
                         <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100">
                            <div className="w-4 h-4 bg-slate-100 rounded mb-2" />
                            <div className="h-4 w-1/2 bg-slate-100 rounded" />
                         </div>
                      ))}
                   </div>

                   <div className="bg-white rounded-2xl border border-slate-100 p-10 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full mb-4" style={{ background: `${config.primaryColor}15` }}>
                         <div className="w-full h-full flex items-center justify-center" style={{ color: config.primaryColor }}>
                            <CheckCircle2 size={24} />
                         </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">No pending items</h4>
                      <Button style={{ background: config.primaryColor, border: 0 }} className="text-[10px] px-8 py-2 rounded-xl text-white font-bold opacity-90">
                         View All Clients
                      </Button>
                   </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-100 text-center">
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Powered by GSTPro Technology</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
