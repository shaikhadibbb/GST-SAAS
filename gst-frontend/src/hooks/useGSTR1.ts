import { useState } from 'react'
import { toast } from 'sonner'
import api from '@/services/api'

export function useGSTR1Export() {
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)

  const validate = async (month: number, year: number) => {
    setValidating(true)
    try {
      const res = await api.get(`/gstr1/validate?month=${month}&year=${year}`)
      return res.data.data
    } catch (err: any) {
      toast.error('Validation failed')
      return null
    } finally { setValidating(false) }
  }

  const exportGSTR1 = async (month: number, year: number) => {
    setLoading(true)
    try {
      const res = await api.get(`/gstr1/export?month=${month}&year=${year}`, { responseType: 'blob' })
      const fp = `${String(month).padStart(2,'0')}${year}`
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `GSTR1_${fp}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success(`GSTR-1 exported for ${fp} ✅`)
    } catch (err: any) {
      if (err?.response?.status === 422) {
        const text = await err.response.data.text()
        const json = JSON.parse(text)
        toast.error(`Validation failed: ${json.errors?.slice(0,2).join(', ')}`)
      } else {
        toast.error('GSTR-1 export failed')
      }
    } finally { setLoading(false) }
  }

  return { exportGSTR1, validate, loading, validating }
}
