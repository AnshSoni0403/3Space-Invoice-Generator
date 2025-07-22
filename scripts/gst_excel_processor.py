import pandas as pd
import json
from typing import Dict, List, Any
from datetime import datetime

def process_gst_excel_to_invoice(file_path: str) -> Dict[str, Any]:
    """
    Process Excel file and convert to GST invoice data format
    
    Expected Excel format:
    Row 1: Headers
    Row 2: Invoice Number, Invoice Date, Due Date, Place of Supply, Payment Made
    Row 3: Customer Name, Address, City, State, Pincode, Country
    Row 4+: Description, HSN/SAC, Quantity, Rate, CGST%, SGST%
    """
    
    try:
        # Read Excel file
        df = pd.read_excel(file_path, header=None)
        
        # Extract invoice information
        invoice_number = str(df.iloc[1, 0]) if pd.notna(df.iloc[1, 0]) else "INV-000001"
        invoice_date = str(df.iloc[1, 1]) if pd.notna(df.iloc[1, 1]) else datetime.now().strftime('%d/%m/%Y')
        due_date = str(df.iloc[1, 3]) if pd.notna(df.iloc[1, 3]) else datetime.now().strftime('%d/%m/%Y')
        place_of_supply = str(df.iloc[1, 4]) if pd.notna(df.iloc[1, 4]) else "Gujarat (24)"
        payment_made = float(df.iloc[2, 20]) if pd.notna(df.iloc[2, 20]) else 0
        print("Payment Made Fetched:", payment_made)
        
        # Extract customer information
        customer_name = str(df.iloc[2, 0]) if pd.notna(df.iloc[2, 0]) else "Customer Name"
        address = str(df.iloc[2, 1]) if pd.notna(df.iloc[2, 1]) else "Address"
        city = str(df.iloc[2, 2]) if pd.notna(df.iloc[2, 2]) else "City"
        state = str(df.iloc[2, 3]) if pd.notna(df.iloc[2, 3]) else "State"
        pincode = str(df.iloc[2, 4]) if pd.notna(df.iloc[2, 4]) else "000000"
        country = str(df.iloc[2, 5]) if pd.notna(df.iloc[2, 5]) else "India"
        
        # Process items
        items = []
        sub_total = 0
        cgst_total = 0
        sgst_total = 0
        
        for i in range(3, len(df)):
            if pd.notna(df.iloc[i, 0]) and pd.notna(df.iloc[i, 1]):
                description = str(df.iloc[i, 0])
                hsn_sac = str(df.iloc[i, 1])
                quantity = float(df.iloc[i, 2]) if pd.notna(df.iloc[i, 2]) else 1.0
                rate = float(df.iloc[i, 3]) if pd.notna(df.iloc[i, 3]) else 0.0
                cgst_percent = float(df.iloc[i, 4]) if pd.notna(df.iloc[i, 4]) else 9.0
                sgst_percent = float(df.iloc[i, 5]) if pd.notna(df.iloc[i, 5]) else 9.0
                
                amount = quantity * rate
                cgst_amount = (amount * cgst_percent) / 100
                sgst_amount = (amount * sgst_percent) / 100
                
                items.append({
                    "description": description,
                    "hsnSac": hsn_sac,
                    "quantity": quantity,
                    "rate": rate,
                    "cgstPercent": cgst_percent,
                    "sgstPercent": sgst_percent,
                    "amount": amount
                })
                
                sub_total = rate
                cgst_total += cgst_amount
                sgst_total += sgst_amount
        
        # Calculate totals
        total_amount = sub_total + cgst_total + sgst_total
        balance_due = total_amount - payment_made
        
        # Create invoice data structure
        invoice_data = {
            "invoiceNumber": invoice_number,
            "invoiceDate": invoice_date,
            "dueDate": due_date,
            "placeOfSupply": place_of_supply,
            "customerDetails": {
                "name": customer_name,
                "address": address,
                "city": city,
                "state": state,
                "pincode": pincode,
                "country": country
            },
            "items": items,
            "subTotal": sub_total,
            "cgstTotal": cgst_total,
            "sgstTotal": sgst_total,
            "totalAmount": total_amount,
            "paymentMade": payment_made,
            "balanceDue": balance_due
        }
        
        return invoice_data
        
    except Exception as e:
        print(f"Error processing Excel file: {str(e)}")
        return None

def create_sample_gst_excel(output_path: str):
    """Create a sample Excel file with the expected GST format"""
    
    data = [
        ["Headers", "Invoice Info", "Customer Info", "Items", "Payment", ""],
        ["INV-000001", "10/07/2025", "10/07/2025", "Gujarat (24)", "1000.00", ""],
        ["Team RockitRoot - Prachiti Prakash Patil", "B-10, Devranya Duplex, Dabhoi-Waghodia Ring Road BRD", "Vadodara", "Gujarat", "390019", "India"],
        ["Ideathon 2025 Competition Registration Fee", "999729", "1.00", "847.46", "9", "9"],
        ["Additional Service", "998800", "2.00", "100.00", "9", "9"]
    ]
    
    df = pd.DataFrame(data)
    df.to_excel(output_path, index=False, header=False)
    print(f"Sample GST Excel file created: {output_path}")

def number_to_words_indian(num: int) -> str:
    """Convert number to words in Indian format"""
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    
    if num == 0:
        return 'Zero'
    
    def convert_hundreds(n):
        result = ''
        if n >= 100:
            result += ones[n // 100] + ' Hundred '
            n %= 100
        if n >= 20:
            result += tens[n // 10] + ' '
            n %= 10
        elif n >= 10:
            result += teens[n - 10] + ' '
            n = 0
        if n > 0:
            result += ones[n] + ' '
        return result
    
    if num < 1000:
        return convert_hundreds(num).strip()
    elif num < 100000:
        return convert_hundreds(num // 1000) + 'Thousand ' + convert_hundreds(num % 1000)
    elif num < 10000000:
        return convert_hundreds(num // 100000) + 'Lakh ' + convert_hundreds((num % 100000) // 1000) + 'Thousand ' + convert_hundreds(num % 1000)
    else:
        return 'Amount too large'

if __name__ == "__main__":
    # Create sample Excel file
    create_sample_gst_excel("sample_gst_invoice_data.xlsx")
    
    # Process the sample file
    result = process_gst_excel_to_invoice("sample_gst_invoice_data.xlsx")
    if result:
        print("GST Invoice data processed successfully:")
        print(json.dumps(result, indent=2))
        
        # Test number to words conversion
        print(f"\nAmount in words: {number_to_words_indian(int(result['totalAmount']))}")
