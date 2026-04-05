'use client';

import { useState, useTransition } from 'react';
import { updateDeliveryPricing, updatePaymentMethods } from '@/actions/settings';
import { Truck, CreditCard, CheckCircle, Loader2, AlertCircle, ToggleLeft, ToggleRight, Banknote } from 'lucide-react';

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div>
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-black' : 'bg-gray-200'}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  </div>
);

const Notice = ({ type, message }) => (
  <div className={`flex items-center gap-2 p-3 rounded-md text-sm font-medium ${type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
    {type === 'success'
      ? <CheckCircle size={16} className="flex-shrink-0" />
      : <AlertCircle size={16} className="flex-shrink-0" />
    }
    {message}
  </div>
);

export default function ShopSettingsClient({ initialSettings }) {
  const delivery = initialSettings?.deliveryPricing ?? { insideDhaka: 80, outsideDhaka: 150, freeDelivery: false };
  const payments = initialSettings?.paymentMethods ?? { cashOnDelivery: true, bkash: false, sslcommerz: false };

  // Delivery state
  const [insideDhaka, setInsideDhaka] = useState(String(delivery.insideDhaka));
  const [outsideDhaka, setOutsideDhaka] = useState(String(delivery.outsideDhaka));
  const [freeDelivery, setFreeDelivery] = useState(delivery.freeDelivery);
  const [deliveryMsg, setDeliveryMsg] = useState(null);
  const [deliveryPending, startDeliveryTransition] = useTransition();

  // Payment state
  const [cod, setCod] = useState(payments.cashOnDelivery);
  const [bkash, setBkash] = useState(payments.bkash);
  const [ssl, setSsl] = useState(payments.sslcommerz);
  const [paymentMsg, setPaymentMsg] = useState(null);
  const [paymentPending, startPaymentTransition] = useTransition();

  const handleDeliverySave = () => {
    setDeliveryMsg(null);
    startDeliveryTransition(async () => {
      const fd = new FormData();
      fd.append('insideDhaka', insideDhaka);
      fd.append('outsideDhaka', outsideDhaka);
      fd.append('freeDelivery', String(freeDelivery));
      const res = await updateDeliveryPricing(fd);
      setDeliveryMsg(res.success
        ? { type: 'success', text: 'Delivery pricing saved.' }
        : { type: 'error', text: res.error || 'Save failed.' }
      );
    });
  };

  const handlePaymentSave = () => {
    setPaymentMsg(null);
    startPaymentTransition(async () => {
      const fd = new FormData();
      fd.append('cashOnDelivery', String(cod));
      fd.append('bkash', String(bkash));
      fd.append('sslcommerz', String(ssl));
      const res = await updatePaymentMethods(fd);
      setPaymentMsg(res.success
        ? { type: 'success', text: 'Payment methods saved.' }
        : { type: 'error', text: res.error || 'Save failed.' }
      );
    });
  };

  return (
    <div className="space-y-8">

      {/* ── DELIVERY PRICING ── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Truck size={16} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Delivery Pricing</h2>
            <p className="text-xs text-gray-500">Set shipping rates or enable free delivery</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Free delivery toggle */}
          <div className="bg-gray-50 rounded-lg p-4">
            <Toggle
              checked={freeDelivery}
              onChange={setFreeDelivery}
              label="Free Delivery"
              description="When enabled, all orders ship free regardless of price."
            />
          </div>

          {/* Price inputs — disabled when free delivery is on */}
          <div className={`grid grid-cols-2 gap-4 transition-opacity ${freeDelivery ? 'opacity-40 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Inside Dhaka (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">৳</span>
                <input
                  type="number" min="0" value={insideDhaka}
                  onChange={(e) => setInsideDhaka(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold focus:border-black focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Outside Dhaka (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">৳</span>
                <input
                  type="number" min="0" value={outsideDhaka}
                  onChange={(e) => setOutsideDhaka(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold focus:border-black focus:outline-none"
                />
              </div>
            </div>
          </div>

          {deliveryMsg && <Notice type={deliveryMsg.type} message={deliveryMsg.text} />}

          <button
            onClick={handleDeliverySave}
            disabled={deliveryPending}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deliveryPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Save Delivery Settings
          </button>
        </div>
      </div>

      {/* ── PAYMENT METHODS ── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <CreditCard size={16} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Payment Methods</h2>
            <p className="text-xs text-gray-500">Toggle which methods customers can choose from</p>
          </div>
        </div>

        <div className="p-6 space-y-2">
          <div className="bg-gray-50 rounded-lg px-4 divide-y divide-gray-100">
            <Toggle
              checked={cod}
              onChange={setCod}
              label="Cash on Delivery (COD)"
              description="Customer pays upon receiving the order."
            />
            <Toggle
              checked={bkash}
              onChange={setBkash}
              label="bKash"
              description="Mobile financial service payment. Requires bKash API credentials in .env."
            />
            <Toggle
              checked={ssl}
              onChange={setSsl}
              label="SSL Commerz"
              description="Card, net banking, and mobile banking. Requires SSL Commerz credentials in .env."
            />
          </div>

          {!cod && !bkash && !ssl && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs font-medium text-amber-800 mt-4">
              <AlertCircle size={14} className="flex-shrink-0" />
              At least one payment method must be enabled.
            </div>
          )}

          {/* bKash info */}
          {bkash && (
            <div className="p-3 bg-pink-50 border border-pink-100 rounded-md text-xs text-pink-700 mt-2">
              <p className="font-bold mb-1">bKash API Setup</p>
              <p>Add <code className="bg-pink-100 px-1 rounded">BKASH_APP_KEY</code>, <code className="bg-pink-100 px-1 rounded">BKASH_APP_SECRET</code>, <code className="bg-pink-100 px-1 rounded">BKASH_USERNAME</code>, <code className="bg-pink-100 px-1 rounded">BKASH_PASSWORD</code> to your <code className="bg-pink-100 px-1 rounded">.env</code> file to activate bKash payments.</p>
            </div>
          )}

          {/* SSL Commerz info */}
          {ssl && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-700 mt-2">
              <p className="font-bold mb-1">SSL Commerz Setup</p>
              <p>Add <code className="bg-blue-100 px-1 rounded">SSLCOMMERZ_STORE_ID</code> and <code className="bg-blue-100 px-1 rounded">SSLCOMMERZ_STORE_PASSWD</code> to your <code className="bg-blue-100 px-1 rounded">.env</code> file to activate SSL Commerz.</p>
            </div>
          )}

          {paymentMsg && <Notice type={paymentMsg.type} message={paymentMsg.text} />}

          <button
            onClick={handlePaymentSave}
            disabled={paymentPending || (!cod && !bkash && !ssl)}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {paymentPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Save Payment Settings
          </button>
        </div>
      </div>

    </div>
  );
}
