import { useState, useEffect } from 'react'

export default function TrustBar() {
  const [moneySaved, setMoneySaved] = useState(145028450) // ₹14.5 Cr
  useEffect(() => {
    const timer = setInterval(() => {
      setMoneySaved(prev => prev + Math.floor(Math.random() * 850))
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-white border-y border-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-bold text-indigo-600 mb-2 uppercase tracking-widest">Global Impact</p>
            <h2 className="text-4xl font-display font-bold text-slate-900 mb-4">
              ₹{(moneySaved / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h2>
            <p className="text-slate-500 font-medium">Money saved for our clients via accurate ITC reconciliation and early mismatch detection.</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400 mb-8 tracking-wide uppercase">Trusted by 500+ CA Firms & Enterprises</p>
            <div className="flex flex-wrap items-center gap-6">
              {['Deloitte India','EY Advisory','Grant Thornton','BDO India','KPMG GST'].map(name => (
                <div key={name} className="grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                  <span className="font-display font-bold text-slate-400 text-sm hover:text-indigo-600 cursor-default">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
