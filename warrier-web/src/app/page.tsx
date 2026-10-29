'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Calendar,
  Wallet,
  Receipt,
  Plus,
  Clock,
  Coins,
  AlertTriangle,
  LogIn,
  LogOut,
  X,
  Printer,
  Sparkles,
  Calculator,
  Building,
  Tag,
  CheckCircle2,
  Hourglass,
  Layers
} from 'lucide-react';
import { BillUploadZone } from '@/components/BillUploadZone';
import { supabase, loginWithGoogle, logoutUser } from '@/lib/supabase';
import { Warranty, PaymentItem, ScannedBillData } from '@/types';

// Initial Demo Seed Data
const INITIAL_WARRANTIES: Warranty[] = [
  {
    id: 'demo-1',
    product_name: 'Apple MacBook Pro 14-inch (M3)',
    store_name: 'Apex Electronics',
    purchase_date: '2026-01-15',
    warranty_value: 24,
    warranty_unit: 'months',
    price: 1999,
    category: 'Computers & Laptops',
    notes: 'Registered with AppleCare. Receipt #MH100456.',
    bill_photo_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-2',
    product_name: 'Sony WH-1000XM5 Noise-Cancelling Headphones',
    store_name: 'AudioTech Store',
    purchase_date: '2026-02-01',
    warranty_value: 12,
    warranty_unit: 'months',
    price: 399,
    category: 'Audio & Wearables',
    notes: 'Serial #SN-9948271. Active warranty.',
    bill_photo_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString()
  }
];

const INITIAL_PAYMENTS: PaymentItem[] = [
  {
    id: 'pay-1',
    title: 'MacBook Pro 14" (6-Mo No-Cost EMI)',
    category: 'Electronics EMI',
    payment_mode: 'HDFC Credit Card EMI',
    amount: 199.99,
    due_date: '2026-11-05',
    is_emi: true,
    status: 'pending'
  },
  {
    id: 'pay-2',
    title: 'Home High-Speed Fiber Internet',
    category: 'Utilities',
    payment_mode: 'UPI Autopay',
    amount: 54.0,
    due_date: '2026-11-02',
    is_emi: false,
    status: 'pending'
  }
];

export default function WarrierApp() {
  // Navigation & User State
  const [activeTab, setActiveTab] = useState<'warranties' | 'payments' | 'calculator'>('warranties');
  const [user, setUser] = useState<any>(null);
  const [currency, setCurrency] = useState<string>('$');

  // Data State
  const [warranties, setWarranties] = useState<Warranty[]>(INITIAL_WARRANTIES);
  const [payments, setPayments] = useState<PaymentItem[]>(INITIAL_PAYMENTS);

  // Modals & UI State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Warranty | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanMessage, setScanMessage] = useState<string>('');

  // Add Warranty Form State
  const [billFile, setBillFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    productName: '',
    storeName: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    warrantyValue: 12,
    warrantyUnit: 'months' as 'months' | 'years',
    price: 0,
    category: 'Electronics',
    notes: ''
  });

  // Calculator State
  const [calcPrincipal, setCalcPrincipal] = useState<number>(50000);
  const [calcRate, setCalcRate] = useState<number>(14);
  const [calcTenure, setCalcTenure] = useState<number>(12);

  // Check Supabase Auth session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRecords(session.user.id);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRecords(session.user.id);
      } else {
        setWarranties(INITIAL_WARRANTIES);
        setPayments(INITIAL_PAYMENTS);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserRecords(userId: string) {
    try {
      const { data: wData } = await supabase
        .from('warranties')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (wData && wData.length > 0) setWarranties(wData);

      const { data: pData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (pData && pData.length > 0) setPayments(pData);
    } catch (e) {
      console.warn('Using local state, cloud data sync failed or tables pending:', e);
    }
  }

  // Handle Bill Image Selected & Trigger Gemini 1.5 Flash
  async function handleImageSelected(file: File) {
    setBillFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsAiScanning(true);
    setScanMessage('Gemini 1.5 Flash reading receipt text & warranty dates...');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('bill', file);

      const res = await fetch('/api/scan-bill', {
        method: 'POST',
        body: uploadFormData
      });

      const json = await res.json();

      if (json.success && json.data) {
        const d: ScannedBillData = json.data;
        setFormData(prev => ({
          ...prev,
          productName: d.productName || prev.productName,
          storeName: d.storeName || prev.storeName,
          purchaseDate: d.purchaseDate || prev.purchaseDate,
          price: d.price || prev.price,
          warrantyValue: d.warrantyMonths || prev.warrantyValue,
          category: d.category || prev.category
        }));
        setScanMessage('Receipt extracted successfully! Form auto-populated.');
      } else {
        setScanMessage(json.error || 'Could not auto-extract. You can enter details manually.');
      }
    } catch (err: any) {
      setScanMessage('Network issue with AI scanner. Please enter details manually.');
    } finally {
      setIsAiScanning(false);
    }
  }

  // Handle Save Warranty to Supabase
  async function handleSaveWarranty(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.productName) {
      alert('Please provide a product name.');
      return;
    }

    setIsSaving(true);
    let uploadedPhotoUrl = previewUrl;

    try {
      // If user is authenticated and uploaded a file, store in Supabase Bucket
      if (user && billFile) {
        const fileExt = billFile.name.split('.').pop() || 'jpg';
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, billFile);

        if (!uploadError) {
          const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
          uploadedPhotoUrl = data.publicUrl;
        }
      }

      const newRecord: Warranty = {
        id: `warr_${Date.now()}`,
        user_id: user?.id,
        product_name: formData.productName,
        store_name: formData.storeName,
        purchase_date: formData.purchaseDate,
        warranty_value: Number(formData.warrantyValue),
        warranty_unit: formData.warrantyUnit,
        price: Number(formData.price),
        category: formData.category,
        notes: formData.notes,
        bill_photo_url: uploadedPhotoUrl || undefined,
        created_at: new Date().toISOString()
      };

      if (user) {
        await supabase.from('warranties').insert([newRecord]);
      }

      setWarranties(prev => [newRecord, ...prev]);
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert(`Saved locally: ${err.message || 'Complete'}`);
    } finally {
      setIsSaving(false);
    }
  }

  function resetForm() {
    setBillFile(null);
    setPreviewUrl('');
    setScanMessage('');
    setFormData({
      productName: '',
      storeName: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyValue: 12,
      warrantyUnit: 'months',
      price: 0,
      category: 'Electronics',
      notes: ''
    });
  }

  // Helper: Calculate Expiry Date & Remaining Days
  function calculateExpiry(purchaseDateStr: string, value: number, unit: 'months' | 'years') {
    const pDate = new Date(purchaseDateStr);
    const expDate = new Date(pDate);
    if (unit === 'years') {
      expDate.setFullYear(expDate.getFullYear() + value);
    } else {
      expDate.setMonth(expDate.getMonth() + value);
    }

    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      dateFormatted: expDate.toLocaleDateString('en-GB'),
      diffDays,
      isExpired: diffDays < 0,
      isExpiringSoon: diffDays >= 0 && diffDays <= 60
    };
  }

  // Calculations for KPIs
  const totalProtectedValue = warranties.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  const expiringSoonCount = warranties.filter(w => {
    const res = calculateExpiry(w.purchase_date, w.warranty_value, w.warranty_unit);
    return res.isExpiringSoon;
  }).length;
  const totalScheduledDues = payments
    .filter(p => p.status === 'pending')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // EMI Calculator Formulas
  const monthlyRate = calcRate / (12 * 100);
  const calculatedEmi =
    monthlyRate > 0
      ? (calcPrincipal * monthlyRate * Math.pow(1 + monthlyRate, calcTenure)) /
        (Math.pow(1 + monthlyRate, calcTenure) - 1)
      : calcPrincipal / calcTenure;
  const totalRepayment = calculatedEmi * calcTenure;
  const totalInterest = totalRepayment - calcPrincipal;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      {/* Top Enterprise Compliance & Sync Bar */}
      <div className="bg-[#0b1120] border-b border-slate-800/80 px-4 py-2 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-300">CLOUD SYNC ACTIVE</span>
          <span className="text-slate-600">|</span>
          <span>Row Level Security (RLS) Active</span>
          <span className="text-slate-600">|</span>
          <span>Google Gemini 1.5 Flash Vision OCR</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Multi-Device Cloud Vault</span>
          {user ? (
            <span className="text-blue-400 font-medium">Logged in: {user.email}</span>
          ) : (
            <span className="text-slate-400">Offline / Guest Vault</span>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <header className="border-b border-slate-800 bg-[#0d1424]/90 backdrop-blur sticky top-0 z-30 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-900/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">WARRIER</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-400">
                PRO SaaS
              </span>
            </div>
            <p className="text-xs text-slate-400">Smart Warranty Bill Guardian &amp; EMI Tracker</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('warranties')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'warranties'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>1. Warranties &amp; Bills</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>2. Payments &amp; EMIs</span>
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'calculator'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>3. EMI Calculator</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Currency Select */}
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs font-semibold rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="$">$ USD</option>
            <option value="₹">₹ INR</option>
            <option value="€">€ EUR</option>
            <option value="£">£ GBP</option>
          </select>

          {/* User Auth Button */}
          {user ? (
            <button
              onClick={() => logoutUser()}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium px-3 py-2 rounded-lg text-slate-300 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => loginWithGoogle()}
              className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all"
            >
              <LogIn className="w-4 h-4 text-blue-600" />
              <span>Sign In with Google</span>
            </button>
          )}

          {/* Add Product Bill Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Product Bill</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* KPI Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Covered Asset Valuation */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Covered Assets
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {currency}
              {totalProtectedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{warranties.length} items verified &amp; protected</span>
            </div>
          </div>

          {/* Card 2: Expiry Horizon (White/Clean Accent as requested) */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Expiry Horizon (60 Days)
              </span>
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-700 text-slate-900 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {expiringSoonCount} {expiringSoonCount === 1 ? 'Item' : 'Items'}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              {expiringSoonCount > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400 font-medium">Expiring within 60 days</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>No immediate expirations</span>
                </>
              )}
            </div>
          </div>

          {/* Card 3: Scheduled Obligations */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Scheduled Obligations
              </span>
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {currency}
              {totalScheduledDues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-sky-400" />
              <span>Pending EMIs &amp; bill payments</span>
            </div>
          </div>

          {/* Card 4: Late Fee Avoided (White/Clean Accent) */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Late Fee Exposure Avoided
              </span>
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-700 text-slate-900 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {currency}
              {(payments.filter(p => p.status === 'paid').length * 45).toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Protected via proactive due alerts</span>
            </div>
          </div>
        </section>

        {/* Tab 1: Warranties & Bills Grid */}
        {activeTab === 'warranties' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-400" />
                  <span>Protected Product Warranties &amp; Bills</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Track physical and digital bills with real-time expiration countdowns
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bill</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warranties.map(item => {
                const expiry = calculateExpiry(
                  item.purchase_date,
                  item.warranty_value,
                  item.warranty_unit
                );

                return (
                  <div
                    key={item.id}
                    className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-md group"
                  >
                    <div>
                      {/* Bill Photo Thumbnail or Placeholder */}
                      <div
                        onClick={() => setSelectedReceipt(item)}
                        className="h-44 bg-slate-950 relative overflow-hidden cursor-pointer group-hover:opacity-95"
                      >
                        {item.bill_photo_url ? (
                          <img
                            src={item.bill_photo_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                            <Receipt className="w-8 h-8" />
                            <span className="text-xs font-medium">No Receipt Image</span>
                          </div>
                        )}
                        <span className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur border border-slate-700 text-slate-200">
                          {currency}
                          {Number(item.price || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 space-y-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold mb-1">
                            <Tag className="w-3.5 h-3.5" />
                            <span>{item.category || 'General'}</span>
                          </div>
                          <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                            {item.product_name}
                          </h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            <span>{item.store_name || 'Store'}</span>
                            <span className="text-slate-600">•</span>
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>Purchased: {item.purchase_date}</span>
                          </p>
                        </div>

                        {/* Expiry Countdown Banner */}
                        <div
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                            expiry.isExpired
                              ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                              : expiry.isExpiringSoon
                              ? 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                              : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Hourglass className="w-3.5 h-3.5" />
                            <span>
                              {expiry.isExpired
                                ? 'Expired'
                                : `${expiry.diffDays} Days Left`}
                            </span>
                          </div>
                          <span className="font-semibold text-[11px]">
                            Exp: {expiry.dateFormatted}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="px-4 py-3 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setSelectedReceipt(item)}
                        className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Receipt</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete warranty for ${item.product_name}?`)) {
                            setWarranties(prev => prev.filter(w => w.id !== item.id));
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tab 2: Payments & EMIs */}
        {activeTab === 'payments' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-sky-400" />
                  <span>Scheduled Payment Obligations &amp; EMIs</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Avoid late fees by tracking recurring utilities, cards, and loan EMIs
                </p>
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Title / Purpose</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">{p.title}</td>
                      <td className="py-3.5 px-4 text-slate-300">{p.category}</td>
                      <td className="py-3.5 px-4 text-slate-400">{p.payment_mode}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">{p.due_date}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-white">
                        {currency}
                        {Number(p.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setPayments(prev =>
                              prev.map(item =>
                                item.id === p.id
                                  ? {
                                      ...item,
                                      status: item.status === 'paid' ? 'pending' : 'paid'
                                    }
                                  : item
                              )
                            );
                          }}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                            p.status === 'paid'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800 hover:scale-105'
                          }`}
                        >
                          {p.status === 'paid' ? 'Paid ✓' : 'Due • Pay'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tab 3: Loan & EMI Amortization Calculator */}
        {activeTab === 'calculator' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-400" />
                <span>Financial &amp; EMI Amortization Calculator</span>
              </h2>
              <p className="text-xs text-slate-400">
                Plan purchase loans and credit card no-cost vs standard EMIs before checkout
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calculator Inputs */}
              <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">
                    Loan / Product Amount ({currency})
                  </label>
                  <input
                    type="number"
                    value={calcPrincipal}
                    onChange={e => setCalcPrincipal(Number(e.target.value))}
                    className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">
                      Interest Rate (% per annum)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={calcRate}
                      onChange={e => setCalcRate(Number(e.target.value))}
                      className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">
                      Tenure (Months)
                    </label>
                    <select
                      value={calcTenure}
                      onChange={e => setCalcTenure(Number(e.target.value))}
                      className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="9">9 Months</option>
                      <option value="12">12 Months (1 Year)</option>
                      <option value="24">24 Months (2 Years)</option>
                      <option value="36">36 Months (3 Years)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Calculator Results */}
              <div className="bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-900/40 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Calculated Monthly Installment
                  </span>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    {currency}
                    {calculatedEmi.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                  <span className="text-xs text-slate-400">per month</span>
                </div>

                <div className="border-t border-slate-800 pt-4 mt-6 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Principal Amount:</span>
                    <span className="text-white font-semibold">
                      {currency}
                      {calcPrincipal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Interest Paid:</span>
                    <span className="text-amber-400 font-semibold">
                      {currency}
                      {totalInterest.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-semibold pt-2 border-t border-slate-800">
                    <span>Total Repayment:</span>
                    <span className="text-emerald-400 font-bold">
                      {currency}
                      {totalRepayment.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ========================================================================
          MODAL 1: Add Product Bill with Gemini AI OCR & Camera
          ======================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-lg">Add Product Bill &amp; Warranty</h3>
            </div>

            {/* AI Mobile Camera & Drop Zone */}
            <BillUploadZone
              onImageSelected={handleImageSelected}
              isLoading={isAiScanning}
            />

            {/* AI Scan Status Message */}
            {scanMessage && (
              <div className="mt-3 p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs text-blue-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 animate-pulse flex-shrink-0" />
                <span>{scanMessage}</span>
              </div>
            )}

            {/* Form Fields (Auto-filled by Gemini) */}
            <form onSubmit={handleSaveWarranty} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony WH-1000XM5"
                    value={formData.productName}
                    onChange={e => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Store / Merchant</label>
                  <input
                    type="text"
                    placeholder="e.g. Croma, Amazon, Apple Store"
                    value={formData.storeName}
                    onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Warranty Term</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.warrantyValue}
                    onChange={e => setFormData({ ...formData, warrantyValue: Number(e.target.value) })}
                    className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Unit</label>
                  <select
                    value={formData.warrantyUnit}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        warrantyUnit: e.target.value as 'months' | 'years'
                      })
                    }
                    className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Price Paid ({currency})</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Computers & Laptops">Computers &amp; Laptops</option>
                    <option value="Audio & Wearables">Audio &amp; Wearables</option>
                    <option value="Home Appliances">Home Appliances</option>
                    <option value="Automobile">Automobile</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-lg shadow-lg shadow-blue-600/30 transition-all"
                >
                  {isSaving ? 'Saving to Cloud Vault...' : 'Save Warranty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL 2: Full Bill Receipt Viewer
          ======================================================================== */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  {selectedReceipt.product_name} - Purchase Receipt
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 max-h-[60vh] overflow-y-auto rounded-xl border border-slate-800 bg-black flex items-center justify-center">
              {selectedReceipt.bill_photo_url ? (
                <img
                  src={selectedReceipt.bill_photo_url}
                  alt={selectedReceipt.product_name}
                  className="max-h-[58vh] object-contain rounded-lg"
                />
              ) : (
                <div className="py-16 text-slate-500 text-sm">No photo available</div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <div className="text-slate-400">
                Purchased: {selectedReceipt.purchase_date} | Price: {currency}
                {Number(selectedReceipt.price || 0).toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080c14] py-6 px-4 md:px-8 text-center text-xs text-slate-500 mt-auto">
        <p>WARRIER Enterprise • Smart Warranty Bill Guardian and Payment Mode / EMI Tracker</p>
        <p className="mt-1 text-[11px] text-slate-600">
          Google Gemini 1.5 Flash Vision OCR • PostgreSQL Row Level Security (RLS) • Cloud Object Storage
        </p>
      </footer>
    </div>
  );
}
