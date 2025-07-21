import pandas as pd
import json
from typing import Dict, List, Any

def process_excel_to_invoice(file_path: str) -> Dict[str, Any]:
    """
    Process Excel file and convert to invoice data format
    
    Expected Excel format:
    Row 1: Headers
    Row 2: Invoice Number, Date
    Row 3: Customer Name, Phone, Email, Address
    Row 4+: Item Description, Price, Quantity
    """
    
    try:
        # Read Excel file
        df = pd.read_excel(file_path, header=None)
        
        # Extract invoice information
        invoice_number = str(df.iloc[1, 0]) if pd.notna(df.iloc[1, 0]) else "INV-001"
        date = str(df.iloc[1, 1]) if pd.notna(df.iloc[1, 1]) else pd.Timestamp.now().strftime('%B %d, %Y')
        
        # Extract customer information
        customer_name = str(df.iloc[2, 0]) if pd.notna(df.iloc[2, 0]) else "Customer Name"
        phone = str(df.iloc[2, 1]) if pd.notna(df.iloc[2, 1]) else ""
        email = str(df.iloc[2, 2]) if pd.notna(df.iloc[2, 2]) else ""
        address = str(df.iloc[2, 3]) if pd.notna(df.iloc[2, 3]) else ""
        
        # Process items
        items = []
        subtotal = 0
        
        for i in range(3, len(df)):
            if pd.notna(df.iloc[i, 0]) and pd.notna(df.iloc[i, 1]) and pd.notna(df.iloc[i, 2]):
                description = str(df.iloc[i, 0])
                price = float(df.iloc[i, 1])
                quantity = int(df.iloc[i, 2])
                amount = price * quantity
                
                items.append({
                    "description": description,
                    "price": price,
                    "quantity": quantity,
                    "amount": amount
                })
                
                subtotal += amount
        
        # Calculate totals
        tax_rate = 0.10  # 10% tax
        tax_amount = subtotal * tax_rate
        total = subtotal + tax_amount
        
        # Create invoice data structure
        invoice_data = {
            "invoiceNumber": invoice_number,
            "date": date,
            "billTo": {
                "name": customer_name,
                "phone": phone,
                "email": email,
                "address": address
            },
            "items": items,
            "subtotal": subtotal,
            "taxRate": tax_rate,
            "taxAmount": tax_amount,
            "total": total
        }
        
        return invoice_data
        
    except Exception as e:
        print(f"Error processing Excel file: {str(e)}")
        return None

def create_sample_excel(output_path: str):
    """Create a sample Excel file with the expected format"""
    
    data = [
        ["Headers", "Invoice Info", "Customer Info", "Items"],
        ["INV-001", "July 29, 2022", "", ""],
        ["AVERY DAVIS", "123-456-7890", "avery@email.com", "123 Main St, City, ST 12345"],
        ["Baby bottles (set of 9)", 52.99, 1, ""],
        ["Diapers (pack of 50)", 25.99, 2, ""],
        ["Baby formula", 18.99, 3, ""]
    ]
    
    df = pd.DataFrame(data)
    df.to_excel(output_path, index=False, header=False)
    print(f"Sample Excel file created: {output_path}")

if __name__ == "__main__":
    # Create sample Excel file
    create_sample_excel("sample_invoice_data.xlsx")
    
    # Process the sample file
    result = process_excel_to_invoice("sample_invoice_data.xlsx")
    if result:
        print("Invoice data processed successfully:")
        print(json.dumps(result, indent=2))
