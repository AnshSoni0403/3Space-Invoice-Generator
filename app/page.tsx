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
import html2pdf from "html2pdf.js"

interface GSTInvoiceData {
  invoiceNumber: string
  invoiceDate: string
  terms: string
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

      console.log('Raw Excel Data:', jsonData); // Debug log

      const processedData = processExcelData(jsonData)
      console.log('Processed Invoice Data:', processedData); // Debug log
      setInvoiceData(processedData)
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Error processing Excel file. Please check the format.")
    } finally {
      setIsProcessing(false)
    }
  }

  const processExcelData = (data: any[][]): GSTInvoiceData => {
    // If only one data row after header, treat it as all info in one row
    if (data.length === 2) {
      const row = data[1];
      const quantity = Number.parseFloat(row[2]) || 1;
      const rate = Number.parseFloat(row[3]) || 0;
      const cgstPercent = Number.parseFloat(row[4]) || 9;
      const sgstPercent = Number.parseFloat(row[5]) || 9;
      const amount = quantity * rate;
      const cgstAmount = (amount * cgstPercent) / 100;
      const sgstAmount = (amount * sgstPercent) / 100;
      const subTotal = amount;
      const cgstTotal = cgstAmount;
      const sgstTotal = sgstAmount;
      const totalAmount = subTotal + cgstTotal + sgstTotal;
      const paymentMade = Number.parseFloat(row[16]) || totalAmount;
      const balanceDue = totalAmount - paymentMade;
      return {
        invoiceNumber: row[0] || "INV-000001",
        invoiceDate: row[1],
        terms: row[2] || "Due on Receipt",
        dueDate: row[3],
        placeOfSupply: row[4] || "Gujarat (24)",
        customerDetails: {
          name: row[6] || "Customer Name",
          address: row[7] || "Address Line 1",
          city: row[8] || "City",
          state: row[9] || "State",
          pincode: row[10] || "000000",
          country: row[11] || "India",
        },
        items: [
          {
            description: row[5],
            hsnSac: row[6],
            quantity,
            rate,
            cgstPercent,
            sgstPercent,
            amount,
          },
        ],
        subTotal,
        cgstTotal,
        sgstTotal,
        totalAmount,
        paymentMade,
        balanceDue,
      };
    }

    // If only header + product rows (no invoice/customer info), use defaults
    let invoiceInfoRow = data[1] || [];
    let customerInfoRow = data[2] || [];
    let productStartIndex = 3;

    // Detect if the file is header + products only (no invoice/customer info)
    // If the second row (data[1]) looks like a product (has description/hsn_sac), treat all rows after header as products
    if (
      data.length > 1 &&
      data[1][0] && typeof data[1][0] === 'string' &&
      data[1][1] && typeof data[1][1] === 'string' &&
      (!data[1][2] || !isNaN(Number(data[1][2])))
    ) {
      // No invoice/customer info, products start at row 2
      invoiceInfoRow = [];
      customerInfoRow = [];
      productStartIndex = 1;
    }

    const items = [];
    let subTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;

    // Process items
    for (let i = productStartIndex; i < data.length && data[i][0]; i++) {
      const row = data[i];
      if (row[0] && row[1]) {
        const quantity = Number.parseFloat(row[2]) || 1;
        const rate = Number.parseFloat(row[3]) || 0;
        const cgstPercent = Number.parseFloat(row[4]) || 9;
        const sgstPercent = Number.parseFloat(row[5]) || 9;

        const amount = quantity * rate;
        const cgstAmount = (amount * cgstPercent) / 100;
        const sgstAmount = (amount * sgstPercent) / 100;

        items.push({
          description: row[0],
          hsnSac: row[1],
          quantity,
          rate,
          cgstPercent,
          sgstPercent,
          amount,
        });

        subTotal += amount;
        cgstTotal += cgstAmount;
        sgstTotal += sgstAmount;
      }
    }

    const totalAmount = subTotal + cgstTotal + sgstTotal;
    const paymentMade = Number.parseFloat(invoiceInfoRow[4]) || totalAmount;
    const balanceDue = totalAmount - paymentMade;

    return {
      invoiceNumber: invoiceInfoRow[0] || "INV-000001",
      invoiceDate: invoiceInfoRow[1],
      terms: invoiceInfoRow[2] || "Due on Receipt",
      dueDate: invoiceInfoRow[3],
      placeOfSupply: invoiceInfoRow[4] || "Gujarat (24)",
      customerDetails: {
        name: customerInfoRow[0] || "Customer Name",
        address: customerInfoRow[1] || "Address Line 1",
        city: customerInfoRow[2] || "City",
        state: customerInfoRow[3] || "State",
        pincode: customerInfoRow[4] || "000000",
        country: customerInfoRow[5] || "India",
      },
      items,
      subTotal,
      cgstTotal,
      sgstTotal,
      totalAmount,
      paymentMade,
      balanceDue,
    };
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
                      Download Invoice (Print Dialog)
                    </Button>
                    <Button
                      onClick={async () => {
                        if (printRef.current) {
                          await html2pdf().from(printRef.current).set({
                            margin: 0.5,
                            filename: invoiceData.invoiceNumber ? `GST_Invoice_${invoiceData.invoiceNumber}.pdf` : 'GST_Invoice.pdf',
                            html2canvas: { scale: 2 },
                            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                          }).save();
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF (Direct)
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
