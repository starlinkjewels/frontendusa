import { Invoice, InvoiceFormData } from '@/types/invoice';

const BASE_URL = 'https://invoiceusa.vercel.app/api';

// Map frontend invoice to API format
const mapToApiFormat = (formData: InvoiceFormData, invoiceNo?: number) => {
  return {
    invoiceNumber: invoiceNo ? `INV-${invoiceNo.toString().padStart(4, '0')}` : undefined,
    date: formData.date,
    terms: formData.terms,
    customer: {
      name: formData.customerName,
      phone: formData.customerPhone,
      address: formData.customerAddress,
      city: formData.customerCity
    },
    items: formData.items.map(item => ({
      stockId: item.stockId,
      description: item.description,
      pieces: item.pieces,
      weight: item.weight,
      pricePerUnit: item.pricePerUnit,
      total: item.pieces * item.pricePerUnit
    })),
    charges: {
      subtotal: formData.items.reduce((sum, item) => sum + (item.pieces * item.pricePerUnit), 0),
      shipping: formData.shippingCharges,
      other: formData.otherCharges,
      totalAmount: formData.items.reduce((sum, item) => sum + (item.pieces * item.pricePerUnit), 0) + formData.shippingCharges + formData.otherCharges
    }
  };
};

// Map API response to frontend format
const mapFromApiFormat = (apiInvoice: any): Invoice => {
  const invoiceNo = parseInt(apiInvoice.invoiceNumber.replace('INV-', ''));

  return {
    id: apiInvoice._id,
    invoiceNo,
    date: apiInvoice.date,
    terms: apiInvoice.terms,
    customerName: apiInvoice.customer.name,
    customerAddress: apiInvoice.customer.address,
    customerCity: apiInvoice.customer.city,
    customerPhone: apiInvoice.customer.phone,
    items: apiInvoice.items.map((item: any) => ({
      id: item._id,
      stockId: item.stockId,
      description: item.description,
      pieces: item.pieces,
      weight: item.weight,
      pricePerUnit: item.pricePerUnit,
      total: item.total
    })),
    subtotal: apiInvoice.charges.subtotal,
    shippingCharges: apiInvoice.charges.shipping,
    otherCharges: apiInvoice.charges.other,
    totalAmount: apiInvoice.charges.totalAmount,
    createdAt: new Date().toISOString(), // API doesn't provide this
    updatedAt: new Date().toISOString()  // API doesn't provide this
  };
};

export class InvoiceApi {
  static async getAll(): Promise<Invoice[]> {
    try {
      const response = await fetch(`${BASE_URL}/invoices`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      const apiInvoices = await response.json();
      return apiInvoices.map(mapFromApiFormat);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<Invoice | null> {
    try {
      const response = await fetch(`${BASE_URL}/invoices/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch invoice');
      }
      const apiInvoice = await response.json();
      return mapFromApiFormat(apiInvoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  static async getNextInvoiceNumber(): Promise<number> {
    try {
      const invoices = await this.getAll();
      if (invoices.length === 0) return 2636;
      const maxInvoiceNo = Math.max(...invoices.map(inv => inv.invoiceNo));
      return maxInvoiceNo + 1;
    } catch (error) {
      console.error('Error getting next invoice number:', error);
      return 2636;
    }
  }

  static async create(formData: InvoiceFormData): Promise<Invoice> {
    try {
      const invoiceNo = await this.getNextInvoiceNumber();
      const apiData = mapToApiFormat(formData, invoiceNo);

      const response = await fetch(`${BASE_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create invoice');
      }

      const apiInvoice = await response.json();
      return mapFromApiFormat(apiInvoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  static async update(id: string, formData: InvoiceFormData): Promise<Invoice | null> {
    try {
      const existingInvoice = await this.getById(id);
      if (!existingInvoice) return null;

      const apiData = mapToApiFormat(formData, existingInvoice.invoiceNo);

      const response = await fetch(`${BASE_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update invoice');
      }

      const apiInvoice = await response.json();
      return mapFromApiFormat(apiInvoice);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/invoices/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 404) return false;
        throw new Error('Failed to delete invoice');
      }

      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  static async search(query: string): Promise<Invoice[]> {
    try {
      const invoices = await this.getAll();
      const lowerQuery = query.toLowerCase();

      return invoices.filter(invoice =>
        invoice.customerName.toLowerCase().includes(lowerQuery) ||
        invoice.invoiceNo.toString().includes(query) ||
        invoice.customerCity.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching invoices:', error);
      throw error;
    }
  }
}