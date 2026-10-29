import React, { useEffect, useState } from 'react';
import { X, Receipt, CreditCard, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { fetchFeeHistory } from '../services/api';

export default function FeeReceiptsModal({ onClose }) {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchFeeHistory();
      setFees(data);
      setLoading(false);
    }
    load();
  }, []);

  const totalAmount = fees.reduce((acc, curr) => acc + (curr.AmountReceived || 0), 0);

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="clay-card w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-clay-primary">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Official Fee Receipts
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Verified records from ABES Finance Department
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="clay-btn p-2 text-slate-500 hover:text-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Summary Banner */}
        <div className="px-6 py-4 bg-[#E8EEF5]/80 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">
              Total Recorded Payments
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {formatINR(totalAmount)}
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 shadow-clay-success flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fully Settled
          </span>
        </div>

        {/* List of Receipts */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-bold text-slate-500 mt-2">Fetching fee records...</p>
            </div>
          ) : fees.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs font-bold">
              No fee payment records found.
            </div>
          ) : (
            fees.map((receipt, idx) => (
              <div
                key={idx}
                className="clay-card p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-slate-900">
                      {receipt.FeeRecieptNo}
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 shadow-xs">
                      {receipt.Status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1.5">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> {receipt.ReceiptDate}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" /> {receipt.Mode}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-base font-extrabold text-slate-900">
                    {formatINR(receipt.AmountReceived)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/80 flex justify-end bg-[#E8EEF5]/50">
          <button
            onClick={onClose}
            className="clay-btn px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900"
          >
            Close
          </button>
        </div>

      </div>

    </div>
  );
}
