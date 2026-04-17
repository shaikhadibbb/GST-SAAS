import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
const plans = [
  { name: 'Starter', mp: 999, yp: 799, desc: 'For small businesses', features: ['1 GSTIN','100 invoices/month','GSTR-2A Reconciliation','Email support'], cta: 'Get Started', highlight: false },
  { name: 'Growth', mp: 2499, yp: 1999, desc: 'For growing businesses', features: ['5 GSTINs','Unlimited invoices','IRN + E-waybill','Priority support','Tally sync','API access'], cta: 'Start Free Trial', highlight: true, badge: 'Most Popular' },
  { name: 'Enterprise', mp: null, yp: null, desc: 'For large enterprises', features: ['Unlimited GSTINs','Dedicated manager','Custom integrations','SLA guarantee'], cta: 'Contact Sales', highlight: false },
]
export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">Pricing</span>
          <h2 className="text-4xl font-display font-bold text-slate-900 mt-3">Simple, transparent pricing</h2>
          <div className="inline-flex items-center gap-3 mt-8 bg-slate-100 p-1.5 rounded-full">
            {['Monthly','Annual'].map(t => (
              <button key={t} onClick={() => setAnnual(t==='Annual')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${(t==='Annual')===annual ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                {t}{t==='Annual' && <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">-20%</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-center">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              className={`relative rounded-2xl p-8 border-2 ${plan.highlight ? 'border-indigo-500 shadow-xl shadow-indigo-100 scale-105 bg-white' : 'border-slate-100 bg-slate-50/50'}`}>
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full"><Zap size={11} fill="white" />{plan.badge}</span>
                </div>
              )}
              <h3 className="font-display font-bold text-xl text-slate-900 mb-1">{plan.name}</h3>
              <p className="text-slate-500 text-sm mb-6">{plan.desc}</p>
              <div className="mb-8">
                {plan.mp ? <><span className="text-4xl font-display font-bold text-slate-900">₹{annual ? plan.yp : plan.mp}</span><span className="text-slate-400 text-sm ml-1">/month</span></> : <span className="text-4xl font-display font-bold text-slate-900">Custom</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600"><Check size={15} className="text-emerald-500 shrink-0" />{f}</li>)}
              </ul>
              <Link to="/register" className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${plan.highlight ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>{plan.cta}</Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
