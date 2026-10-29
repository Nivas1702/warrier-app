export interface Warranty {
  id: string;
  user_id?: string;
  product_name: string;
  store_name?: string;
  purchase_date: string;
  warranty_value: number;
  warranty_unit: 'months' | 'years';
  price: number;
  category?: string;
  notes?: string;
  bill_photo_url?: string;
  created_at?: string;
}

export interface PaymentItem {
  id: string;
  user_id?: string;
  title: string;
  category: string;
  payment_mode: string;
  amount: number;
  due_date: string;
  is_emi?: boolean;
  status: 'pending' | 'paid';
  created_at?: string;
}

export interface ScannedBillData {
  productName?: string;
  storeName?: string;
  purchaseDate?: string;
  price?: number;
  warrantyMonths?: number;
  category?: string;
}

