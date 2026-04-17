import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Building, Users, IndianRupee, Activity, 
  ExternalLink, ShieldCheck, 
  Handshake, LayoutDashboard, Briefcase, AlertTriangle, ChevronRight
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import Sidebar from '@/components/layout/Sidebar'
import { toast } from 'sonner'

export default function PartnerPortal() {
  const [isApproved, setIsApproved] = useState(false)
  const [loading, setLoading] = useState(false)

  const applyAsPartner = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Institutional partner application submitted for review.')
    }, 1500)
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }

  if (!isApproved) {
    return (
      <div className="flex h-screen bg-white overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-10 py-16">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-sky-50 text-sky-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                <Handshake size={40} strokeWidth={1.5} />
              </div>
              <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-none">Become an Institutional Partner</h1>
              <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">Digitize client portfolios with our multi-tenant compliance infrastructure.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div className="space-y-10">
                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Partner Advantages</h2>
                {[
                  { title: 'Recurring Revenue Model', desc: 'Secure lifetime commissions for high-volume portfolio management.', icon: IndianRupee },
                  { title: 'Institutional Branding', desc: 'Generate reports and invoices using your own corporate guidelines.', icon: Briefcase },
                  { title: 'Enterprise SLA', desc: 'Dedicated institutional support channel for complex compliance audits.', icon: ShieldCheck },
                  { title: 'Fleet Control', desc: 'Aggregate view to monitor tax liability across your entire firm.', icon: LayoutDashboard }
                ].map((b, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110">
                      <b.icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">{b.title}</h3>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed mt-1">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Card className="p-10 shadow-2xl border-sky-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-8 tracking-tight">Access Application</h2>
                <form onSubmit={applyAsPartner} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Legal Firm Identity</label>
                    <input required type="text" placeholder="e.g. Sterling & Associate CAs" className="w-full px-5 py-3.5 rounded-xl bg-sky-50/50 border border-sky-100 focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none text-sm transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">CA Reg Number</label>
                      <input required type="text" className="w-full px-5 py-3.5 rounded-xl bg-sky-50/50 border border-sky-100 focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none text-sm transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Experience (Yrs)</label>
                      <input required type="number" className="w-full px-5 py-3.5 rounded-xl bg-sky-50/50 border border-sky-100 focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none text-sm transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Portfolio Scale</label>
                    <select className="w-full px-5 py-3.5 rounded-xl bg-sky-50/50 border border-sky-100 focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none text-sm appearance-none transition-all">
                      <option>1-20 institutional clients</option>
                      <option>20-100 institutional clients</option>
                      <option>100+ Enterprise clients</option>
                    </select>
                  </div>
                  <Button type="submit" loading={loading} className="w-full py-4 text-sm uppercase tracking-widest font-black">Submit Credentials</Button>
                </form>
              </Card>
            </div>
            
            <div className="mt-20 border-t border-sky-100 pt-10 text-center">
                <button onClick={() => setIsApproved(true)} className="text-xs font-bold text-slate-300 hover:text-sky-500 transition-colors uppercase tracking-widest">
                    Dev: Trigger Approved State
                </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-sky-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-10 py-12">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-10">
          
          <div className="flex items-center justify-between border-b border-sky-200 pb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Partner Control</h1>
              <p className="text-slate-500 font-medium mt-1">Institutional fleet management and portfolio metrics.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-sky-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-sky-600/20">
                 CA PARTNER
              </div>
              <Button icon={<Users size={18} />}>Register Client</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Active Fleet', value: '12', icon: Building, color: 'text-sky-600', bg: 'bg-sky-50' },
              { label: 'Revenue Recovered', value: '₹14.2L', icon: IndianRupee, color: 'text-success-main', bg: 'bg-success-light/30' },
              { label: 'At-Risk Portfolios', value: '3', icon: AlertTriangle, color: 'text-error-main', bg: 'bg-error-light/30', urgent: true },
              { label: 'Fleet Health', value: '88/100', icon: Activity, color: 'text-sky-500', bg: 'bg-sky-50' }
            ].map((c, i) => (
              <motion.div key={i} variants={item}>
                <Card className={`p-8 ${c.urgent ? 'border-error-main ring-4 ring-error-light/10' : ''}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${c.bg} ${c.color}`}><c.icon size={22} strokeWidth={2.5}/></div>
                  <p className="text-3xl font-extrabold text-slate-900 font-display tracking-tight leading-none mb-3">{c.value}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="overflow-hidden p-0 border-sky-100">
            <div className="p-10 border-b border-sky-100 flex items-center justify-between bg-white text-slate-900">
                <h2 className="text-xl font-extrabold tracking-tight uppercase">Fleet Directory</h2>
                <div className="text-right">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Monthly Yield Projection</p>
                    <p className="text-xl font-black text-success-main tracking-tighter">₹18,400</p>
                </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-sky-50 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-sky-100">
                    <th className="px-10 py-5">Company Identity</th>
                    <th className="px-4 py-5 uppercase">Licensing</th>
                    <th className="px-4 py-5 text-center">Score</th>
                    <th className="px-4 py-5">ITC Exposure</th>
                    <th className="px-10 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 bg-white">
                  {[
                    { name: 'Acme Corp', gstin: '24ABCDE...', plan: 'Growth', health: 92, risk: 0 },
                    { name: 'Nexus Logistics', gstin: '27FGHIJ...', plan: 'Starter', health: 74, risk: 18400 },
                    { name: 'Fae Bot Inc', gstin: '29KLMNO...', plan: 'Growth', health: 45, risk: 125000 }
                  ].map((client, i) => (
                    <motion.tr key={i} whileHover={{ backgroundColor: 'rgba(240, 249, 255, 0.5)' }} className="transition-all cursor-pointer">
                      <td className="px-10 py-6">
                        <p className="font-bold text-slate-900 text-md tracking-tight">{client.name}</p>
                        <p className="text-xs font-bold text-sky-500 font-mono tracking-tighter mt-1">{client.gstin}</p>
                      </td>
                      <td className="px-4 py-6">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-sky-50 text-sky-600 px-3 py-1 rounded-lg border border-sky-100">
                           {client.plan}
                        </span>
                      </td>
                      <td className="px-4 py-6 text-center">
                        <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border shadow-sm ${
                          client.health > 80 ? 'text-success-dark bg-success-light border-success-main/20' : 
                          client.health > 50 ? 'text-warning-dark bg-warning-light border-warning-main/20' : 'text-error-dark bg-error-light border-error-main/20'}`}>
                            {client.health}% Rating
                        </span>
                      </td>
                      <td className="px-4 py-6">
                        <span className={`font-display font-extrabold text-sm ${client.risk > 0 ? 'text-error-main' : 'text-success-main'}`}>
                            ₹{client.risk.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button className="p-2.5 bg-sky-50 border border-sky-100 text-sky-600 rounded-xl hover:bg-sky-500 hover:text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all font-bold">
                           <ExternalLink size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
