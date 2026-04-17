import { useState } from 'react'
import { RefreshCw, History, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { useSyncGSTR2A } from '@/hooks/useReconciliation'
import { formatDistanceToNow } from 'date-fns'

interface GstnSyncProps {
  gstin: string
  lastSyncAt?: string | Date
  syncStatus: 'IDLE' | 'SYNCING' | 'ERROR'
  syncError?: string
  onSyncComplete?: () => void
}

export default function GstnSync({ gstin, lastSyncAt, syncStatus, syncError }: GstnSyncProps) {
  const sync = useSyncGSTR2A()
  const [period, setPeriod] = useState(() => {
    const d = new Date()
    return `${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`
  })

  const isLoading = syncStatus === 'SYNCING' || sync.isPending

  const handleSync = () => {
    sync.mutate({ gstin, period })
  }

  return (
    <Card className="p-6 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${
            syncStatus === 'SYNCING' ? 'bg-blue-100 text-blue-600 animate-pulse' :
            syncStatus === 'ERROR' ? 'bg-red-100 text-red-600' :
            'bg-indigo-100 text-indigo-600'
          }`}>
            <RefreshCw size={24} className={syncStatus === 'SYNCING' ? 'animate-spin' : ''} />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
              Sync from GSTN Portal
              {syncStatus === 'IDLE' && lastSyncAt && (
                <CheckCircle2 size={16} className="text-emerald-500" />
              )}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {lastSyncAt ? (
                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                  <History size={14} />
                  Last sync: {formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">Never synced</p>
              )}
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                <Clock size={14} />
                Status: {
                  syncStatus === 'SYNCING' ? <span className="text-blue-600 font-medium">Syncing...</span> :
                  syncStatus === 'ERROR' ? <span className="text-red-600 font-medium">Failed</span> :
                  <span className="text-emerald-600 font-medium">Ready</span>
                }
              </p>
            </div>
            {syncStatus === 'ERROR' && syncError && (
              <p className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2">
                <AlertTriangle size={12} />
                {syncError}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">Period</label>
            <input 
              type="text" 
              value={period} 
              onChange={e => setPeriod(e.target.value)}
              placeholder="MMYYYY"
              maxLength={6}
              className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono-gstin focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button 
            onClick={handleSync} 
            loading={isLoading}
            className="h-[42px] px-6 mt-5 shadow-lg shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all"
            icon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
          >
            {isLoading ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
