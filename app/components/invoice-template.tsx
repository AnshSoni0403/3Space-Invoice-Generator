interface InvoiceData {
  invoiceNumber: string
  date: string
  billTo: {
    name: string
    phone: string
    email: string
    address: string
  }
  items: Array<{
    description: string
    price: number
    quantity: number
    amount: number
  }>
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
}

interface InvoiceTemplateProps {
  data: InvoiceData
}

export default function InvoiceTemplate({ data }: InvoiceTemplateProps) {
  return (
    <div id="invoice-template" className="bg-white text-black p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-teal-500 rounded-lg flex items-center justify-center">
            <div className="text-white font-bold text-xl">🦏</div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-teal-600">BLAKBERG INC.</h1>
            <p className="text-sm text-gray-600">Invoice & Billing Solutions</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 mb-2">BILLED TO: {data.billTo.name.toUpperCase()}</div>
          <div className="space-y-1 text-sm">
            <div>Phone: {data.billTo.phone}</div>
            <div>Email: {data.billTo.email}</div>
            <div>Address: {data.billTo.address}</div>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="mb-6">
        <div className="text-lg font-semibold">Invoice {data.invoiceNumber}</div>
        <div className="text-sm text-gray-600">Date: {data.date}</div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-teal-500 text-white">
              <th className="border border-teal-600 p-3 text-left font-semibold">Description</th>
              <th className="border border-teal-600 p-3 text-center font-semibold">Price</th>
              <th className="border border-teal-600 p-3 text-center font-semibold">Qty</th>
              <th className="border border-teal-600 p-3 text-center font-semibold">Amt</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="border border-gray-300 p-3">{item.description}</td>
                <td className="border border-gray-300 p-3 text-center">${item.price.toFixed(2)}</td>
                <td className="border border-gray-300 p-3 text-center">{item.quantity}</td>
                <td className="border border-gray-300 p-3 text-center">${item.amount.toFixed(2)}</td>
              </tr>
            ))}
            {/* Empty rows for spacing */}
            {Array.from({ length: Math.max(0, 5 - data.items.length) }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="border border-gray-300 p-3 h-12">&nbsp;</td>
                <td className="border border-gray-300 p-3">&nbsp;</td>
                <td className="border border-gray-300 p-3">&nbsp;</td>
                <td className="border border-gray-300 p-3">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-between items-start">
        <div className="text-sm">
          <div className="font-semibold text-teal-600 mb-2">BLAKBERG INC.</div>
          <div className="space-y-1 text-xs">
            <div>📞 123-456-7890</div>
            <div>✉️ hello@blakberginc.com</div>
            <div>📍 123 Anywhere St., Any City, ST 12345</div>
          </div>
        </div>

        <div className="text-right space-y-2">
          <div className="flex justify-between gap-8">
            <span>Subtotal:</span>
            <span>${data.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span>Tax Vat {(data.taxRate * 100).toFixed(0)}%:</span>
            <span>${data.taxAmount.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 font-bold text-lg">
            <div className="flex justify-between gap-8">
              <span>Total:</span>
              <span>${data.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
