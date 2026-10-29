import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
    },
  });
  if (error) throw error;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function saveWarrantyWithReceipt(billFile: File, formData: any, userId: string) {
  // 1. Upload bill photo to Supabase Storage
  const fileExt = billFile.name.split('.').pop() || 'jpg';
  const filePath = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(filePath, billFile);

  if (uploadError) throw uploadError;

  // 2. Get Public CDN URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('receipts').getPublicUrl(filePath);

  // 3. Save into Postgres DB
  const { data, error } = await supabase.from('warranties').insert([
    {
      user_id: userId,
      product_name: formData.productName,
      store_name: formData.storeName,
      purchase_date: formData.purchaseDate,
      warranty_value: Number(formData.warrantyMonths || formData.warrantyValue || 12),
      warranty_unit: formData.warrantyUnit || 'months',
      price: Number(formData.price || 0),
      category: formData.category || 'General',
      bill_photo_url: publicUrl,
    },
  ]);

  if (error) throw error;
  return data;
}
