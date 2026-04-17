import { useState } from 'react'
import api from '@/services/api'
import { toast } from 'sonner'

export interface ParsedInvoice {
  supplierName: string;
  supplierGSTIN: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  hsnCode?: string;
}

export function useUpload() {
  const [parsing, setParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedInvoice | null>(null)

  const uploadAndParse = async (file: File) => {
    setParsing(true)
    setParsedData(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/upload/invoice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setParsedData(res.data.data)
      toast.success('AI successfully analyzed your invoice!')
      return res.data.data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to parse invoice')
      throw err
    } finally {
      setParsing(false)
    }
  }

  const clearParsedData = () => setParsedData(null)

  return { parsing, parsedData, uploadAndParse, clearParsedData }
}
