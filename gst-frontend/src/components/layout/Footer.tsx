import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
const cols = [
  { title: 'Product', links: ['Features','Pricing','Changelog','Roadmap'] },
  { title: 'Company', links: ['About','Blog','Careers','Press'] },
  { title: 'Resources', links: ['Documentation','API Reference','GST Guide','Support'] },
  { title: 'Legal', links: ['Privacy Policy','Terms of Service','Cookie Policy'] },
]
export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Zap size={16} className="text-white" fill="white" /></div>
              <span className="font-display font-bold text-lg">GST<span className="text-indigo-400">Pro</span></span>
            </Link>
            <p className="text-slate-400 text-sm">Automated GST compliance for modern Indian businesses.</p>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(l => <li key={l}><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">© 2024 GSTPro Technologies Pvt. Ltd. All rights reserved.</p>
          <p className="text-slate-600 text-xs">Made with ❤️ for Indian businesses</p>
        </div>
      </div>
    </footer>
  )
}
