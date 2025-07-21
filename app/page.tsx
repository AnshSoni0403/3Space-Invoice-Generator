"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, Download, FileSpreadsheet, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import * as XLSX from "xlsx"
import GSTInvoiceTemplate from "./components/gst-invoice-template"
import { useReactToPrint } from "react-to-print"

interface GSTInvoiceData {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  placeOfSupply: string
  customerDetails: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    country: string
  }
  items: Array<{
    description: string
    hsnSac: string
    quantity: number
    rate: number
    cgstPercent: number
    sgstPercent: number
    amount: number
  }>
  subTotal: number
  cgstTotal: number
  sgstTotal: number
  totalAmount: number
  paymentMade: number
  balanceDue: number
}

export default function GSTInvoiceGenerator() {
  const [invoiceData, setInvoiceData] = useState<GSTInvoiceData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: invoiceData ? `GST_Invoice_${invoiceData.invoiceNumber}` : 'GST_Invoice',
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      const processedData = processExcelData(jsonData)
      setInvoiceData(processedData)
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Error processing Excel file. Please check the format.")
    } finally {
      setIsProcessing(false)
    }
  }

  const processExcelData = (data: any[][]): GSTInvoiceData => {
    // Expected Excel format:
    // Row 1: Headers
    // Row 2: Invoice Number, Invoice Date, Due Date, Place of Supply
    // Row 3: Customer Name, Address, City, State, Pincode, Country
    // Row 4+: Description, HSN/SAC, Quantity, Rate, CGST%, SGST%

    const items = []
    let subTotal = 0
    let cgstTotal = 0
    let sgstTotal = 0

    // Process items starting from row 4 (index 3)
    for (let i = 3; i < data.length && data[i][0]; i++) {
      const row = data[i]
      if (row[0] && row[1] && row[2] && row[3]) {
        const quantity = Number.parseFloat(row[2]) || 1
        const rate = Number.parseFloat(row[3]) || 0
        const cgstPercent = Number.parseFloat(row[4]) || 9
        const sgstPercent = Number.parseFloat(row[5]) || 9

        const amount = quantity * rate
        const cgstAmount = (amount * cgstPercent) / 100
        const sgstAmount = (amount * sgstPercent) / 100

        items.push({
          description: row[0],
          hsnSac: row[1],
          quantity,
          rate,
          cgstPercent,
          sgstPercent,
          amount,
        })

        subTotal += amount
        cgstTotal += cgstAmount
        sgstTotal += sgstAmount
      }
    }

    const totalAmount = subTotal + cgstTotal + sgstTotal
    const paymentMade = Number.parseFloat(data[1]?.[4]) || totalAmount
    const balanceDue = totalAmount - paymentMade

    return {
      invoiceNumber: data[1]?.[0] || "INV-000001",
      invoiceDate: data[1]?.[1] || new Date().toLocaleDateString("en-GB"),
      dueDate: data[1]?.[2] || new Date().toLocaleDateString("en-GB"),
      placeOfSupply: data[1]?.[3] || "Gujarat (24)",
      customerDetails: {
        name: data[2]?.[0] || "Customer Name",
        address: data[2]?.[1] || "Address Line 1",
        city: data[2]?.[2] || "City",
        state: data[2]?.[3] || "State",
        pincode: data[2]?.[4] || "000000",
        country: data[2]?.[5] || "India",
      },
      items,
      subTotal,
      cgstTotal,
      sgstTotal,
      totalAmount,
      paymentMade,
      balanceDue,
    }
  }

  // downloadInvoice is replaced by handlePrint from react-to-print
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-500 mb-2">GST Invoice Generator</h1>
          <p className="text-gray-400">Generate Indian GST compliant tax invoices from Excel data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-red-500 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Upload Excel File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="excel-file" className="text-gray-300">
                    Select Excel File
                  </Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                    className="bg-gray-700 border-gray-600 text-white file:bg-red-600 file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4"
                  />
                </div>

                <div className="text-sm text-gray-400">
                  <p className="font-semibold mb-2">Expected Excel Format:</p>
                  <ul className="space-y-1 text-xs">
                    <li>Row 1: Headers</li>
                    <li>Row 2: Invoice#, Date, Due Date, Place</li>
                    <li>Row 3: Name, Address, City, State, PIN</li>
                    <li>Row 4+: Description, HSN, Qty, Rate, CGST%, SGST%</li>
                  </ul>
                </div>

                {isProcessing && (
                  <div className="flex items-center gap-2 text-red-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    Processing...
                  </div>
                )}

                {invoiceData && invoiceData.items.length > 0 && (
                  <div className="space-y-2">
                    <Button onClick={handlePrint} className="w-full bg-red-600 hover:bg-red-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download Invoice
                    </Button>
                    <div className="text-xs text-gray-400 text-center">
                      <IndianRupee className="w-3 h-3 inline mr-1" />
                      Total: ₹{invoiceData.totalAmount.toFixed(2)}
                    </div>
                  </div>
                )}
                {invoiceData && invoiceData.items.length === 0 && (
                  <div className="text-xs text-red-400 text-center">
                    There is nothing to print or download. Please check your Excel file.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invoice Preview */}
          <div className="lg:col-span-3">
            {invoiceData ? (
              <div ref={printRef} className="bg-white rounded-lg overflow-hidden shadow-2xl">
                <GSTInvoiceTemplate data={invoiceData} />
              </div>
            ) : (
              <Card className="bg-gray-800 border-gray-700 h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <Upload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Upload an Excel file to preview GST invoice</p>
                  <p className="text-gray-500 text-sm mt-2">Supports Indian GST format with CGST/SGST calculations</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
