import { Invoice, InvoiceFormData } from '@/types/invoice';
import { InvoiceApi } from './invoiceApi';

export class InvoiceStorage {
  static async getAll(): Promise<Invoice[]> {
    return InvoiceApi.getAll();
  }

  static async getById(id: string): Promise<Invoice | null> {
    return InvoiceApi.getById(id);
  }

  static async getNextInvoiceNumber(): Promise<number> {
    return InvoiceApi.getNextInvoiceNumber();
  }

  static async create(formData: InvoiceFormData): Promise<Invoice> {
    return InvoiceApi.create(formData);
  }

  static async update(id: string, formData: InvoiceFormData): Promise<Invoice | null> {
    return InvoiceApi.update(id, formData);
  }

  static async delete(id: string): Promise<boolean> {
    return InvoiceApi.delete(id);
  }

  static async search(query: string): Promise<Invoice[]> {
    return InvoiceApi.search(query);
  }
}