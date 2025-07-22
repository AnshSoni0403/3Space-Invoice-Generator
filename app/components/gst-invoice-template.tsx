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
  subject: string
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

interface GSTInvoiceTemplateProps {
  data: GSTInvoiceData
}

export default function GSTInvoiceTemplate({ data }: GSTInvoiceTemplateProps) {
  // Indian number to words function (supports up to crores)
  const numberToWords = (num: number): string => {
    if (num === 0) return "Zero";
    if (num < 0) return "Minus " + numberToWords(Math.abs(num));
    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const scales = ["", "Thousand", "Lakh", "Crore"];

    let words = "";
    let crore = Math.floor(num / 10000000);
    num = num % 10000000;
    let lakh = Math.floor(num / 100000);
    num = num % 100000;
    let thousand = Math.floor(num / 1000);
    num = num % 1000;
    let hundred = Math.floor(num / 100);
    let rest = num % 100;

    if (crore > 0) words += numberToWords(crore) + " Crore ";
    if (lakh > 0) words += numberToWords(lakh) + " Lakh ";
    if (thousand > 0) words += numberToWords(thousand) + " Thousand ";
    if (hundred > 0) words += units[hundred] + " Hundred ";
    if (rest > 0) {
      if (words !== "") words += "and ";
      if (rest < 20) words += units[rest] + " ";
      else words += tens[Math.floor(rest / 10)] + (rest % 10 !== 0 ? " " + units[rest % 10] : "") + " ";
    }
    return words.trim();
  };
  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr || typeof dateStr !== "string") return "";
    // Accepts DD/MM/YYYY, DD-MM-YYYY, or ISO
    const parts = dateStr.includes("-") ? dateStr.split("-") : dateStr.split("/");
    if (parts.length === 3) {
      // If year is first, swap
      if (parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }
    return dateStr;
  }

  // Totals for non-standard calculation (sum of rates, not amount)
  const subTotal = data.items.reduce((sum, item) => sum + item.rate, 0);
  const cgstTotal = data.items.reduce((sum, item) => sum + (item.rate * (item.cgstPercent / 100)), 0);
  const sgstTotal = data.items.reduce((sum, item) => sum + (item.rate * (item.sgstPercent / 100)), 0);
  const totalAmount = subTotal + cgstTotal + sgstTotal;

  return (
    <div id="gst-invoice-template" className="bg-white text-black p-6 max-w-4xl mx-auto text-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">
            <div className="text-black">3</div>
            <div className="text-black -mt-2">SPACE</div>
          </div>
          <div>
            <h1 className="text-lg font-bold">Anjanisutah 3Space PVT. LTD.</h1>
            <div className="text-xs space-y-1">
              <div>Gujarat</div>
              <div>India</div>
              <div>GSTIN 24ABCCA7423R1ZC</div>
              <div>6351932850</div>
              <div>3space@3spacecorp.com</div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold">TAX INVOICE</h2>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-gray-400 p-2">
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="font-semibold">#</td>
                <td>: <span className="font-bold">{data.invoiceNumber}</span></td>
              </tr>
              <tr>
                <td className="font-semibold">Invoice Date</td>
                <td>: <span className="font-bold">{formatDate(data.invoiceDate)}</span></td>
              </tr>
              <tr>
                <td className="font-semibold">Terms</td>
                <td>: <span className="font-bold">{data.terms}</span></td>
              </tr>
              <tr>
                <td className="font-semibold">Due Date</td>
                <td>: <span className="font-bold">{formatDate(data.dueDate)}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="border border-gray-400 p-2">
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="font-semibold">Place Of Supply</td>
                <td>: <span className="font-bold">{data.placeOfSupply}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details */}
      <div className="border border-gray-400 p-3 mb-4 bg-gray-100">
        <div className="font-semibold text-sm mb-2">{data.customerDetails.name}</div>
        <div className="text-xs space-y-1">
          <div>{data.customerDetails.address}</div>
          <div>
            {data.customerDetails.city}, {data.customerDetails.state} – {data.customerDetails.pincode}
          </div>
          <div>{data.customerDetails.country}</div>
        </div>
      </div>

      {/* Subject */}
      <div className="border border-gray-400 p-2 mb-4">
        <div className="font-semibold text-xs">Subject :</div>
        <div className="text-xs mt-1">{data.subject}</div>
      </div>

      {/* Items Table */}
      <div className="mb-4">
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 p-2 text-left">#</th>
              <th className="border border-gray-400 p-2 text-left">Description</th>
              <th className="border border-gray-400 p-2 text-center">HSN SAC</th>
              <th className="border border-gray-400 p-2 text-center">Qty</th>
              <th className="border border-gray-400 p-2 text-center">Rate</th>
              <th className="border border-gray-400 p-2 text-center">CGST %</th>
              <th className="border border-gray-400 p-2 text-center">Amt</th>
              <th className="border border-gray-400 p-2 text-center">SGST %</th>
              <th className="border border-gray-400 p-2 text-center">Amt</th>
              <th className="border border-gray-400 p-2 text-center">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => {
              const cgstAmount = item.rate * (item.cgstPercent / 100);
              const sgstAmount = item.rate * (item.sgstPercent / 100);
              const totalItemAmount = item.rate;

              return (
                <tr key={index}>
                  <td className="border border-gray-400 p-2 text-center">{index + 1}</td>
                  <td className="border border-gray-400 p-2">{item.description}</td>
                  <td className="border border-gray-400 p-2 text-center">{item.hsnSac}</td>
                  <td className="border border-gray-400 p-2 text-center">{item.quantity.toFixed(2)}</td>
                  <td className="border border-gray-400 p-2 text-center">{item.rate.toFixed(2)}</td>
                  <td className="border border-gray-400 p-2 text-center">{item.cgstPercent}%</td>
                  <td className="border border-gray-400 p-2 text-center">{cgstAmount.toFixed(2)}</td>
                  <td className="border border-gray-400 p-2 text-center">{item.sgstPercent}%</td>
                  <td className="border border-gray-400 p-2 text-center">{sgstAmount.toFixed(2)}</td>
                  <td className="border border-gray-400 p-2 text-center">{totalItemAmount.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-xs">
            <div className="font-semibold">Total in Words</div>
            <div className="italic">Indian Rupee {numberToWords(Math.floor(data.totalAmount))} Only</div>
            <div className="font-semibold mt-2">Payment Made in Words</div>
            <div className="italic">Indian Rupee {numberToWords(Math.floor(data.paymentMade))} Only</div>
            <div className="font-semibold mt-2">Balance Due in Words</div>
            <div className="italic">Indian Rupee {numberToWords(Math.floor(data.balanceDue))} Only</div>
          </div>
          <div className="text-xs mt-4">
            <div className="font-semibold">Thanks for your business.</div>
          </div>
          <div className="text-xs mt-4">
            <div>Competition registration fee is non-refundable.</div>
            <div>Issued by Anjanisutah 3Space Pvt. Ltd.</div>
          </div>
        </div>

        <div className="text-right">
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="text-right pr-4">Sub Total</td>
                <td className="text-right">{subTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="text-right pr-4">CGST ({data.items[0]?.cgstPercent || 0}%)</td>
                <td className="text-right">{cgstTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="text-right pr-4">SGST ({data.items[0]?.sgstPercent || 0}%)</td>
                <td className="text-right">{sgstTotal.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-gray-400">
                <td className="text-right pr-4 font-bold">Total</td>
                <td className="text-right font-bold">Rs.{totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="text-right pr-4">Payment Made</td>
                <td className="text-right text-red-600">(-) {data.paymentMade.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-gray-400">
                <td className="text-right pr-4 font-bold">Balance Due</td>
                <td className="text-right font-bold">Rs.{data.balanceDue.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
