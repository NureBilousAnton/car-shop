import React, { useEffect, useState } from 'react';
import { salesService } from '../services/api';
import { OrderFull, AddSaleRequest } from '../types';
import { CURRENCY_FORMAT } from '../constants';
import { PlusCircle, Search, AlertCircle } from 'lucide-react';

const Sales: React.FC = () => {
  const [sales, setSales] = useState<OrderFull[]>([]);
  const [showModal, setShowModal] = useState(false);

  const loadSales = async () => {
    try {
      const data = await salesService.getAllSales();
      setSales(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Transactions</h1>
          <p className="text-sm text-gray-500">View history and record new sales.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <PlusCircle className="h-5 w-5" />
          New Sale
        </button>
      </div>

      {/* Sales Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Check #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Car Info</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Centre</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sales.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.sold_at}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-500">{order.check_num}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{order.car_name}</div>
                    <div className="text-xs text-gray-500">{order.car_brand} • Qty: {order.quantity}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.centre_name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {CURRENCY_FORMAT.format(parseFloat(order.total))}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No sales records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <AddSaleModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadSales();
          }}
        />
      )}
    </div>
  );
};

interface AddSaleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddSaleModal: React.FC<AddSaleModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<AddSaleRequest>({
    car_name: '',
    quantity: 1,
    check_num: null
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await salesService.addSale(formData);
      onSuccess();
    } catch (err: any) {
      let msg = err.message || "An error occurred";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorState = () => {
    if (!error) return null;
    const lowerMsg = error.toLowerCase();

    const isConnection = lowerMsg.includes('connect') || lowerMsg.includes('cors') || lowerMsg.includes('network');
    const isNotFound = lowerMsg.includes('not found') || lowerMsg.includes('404') || lowerMsg.includes('не знайдено');

    return { isConnection, isNotFound };
  };

  const errorState = getErrorState();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Record New Sale</h3>
          <p className="text-xs text-gray-500 mt-1">Executes stored procedure <code>add_car_sale</code></p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && errorState && (
            <div className={`rounded-md p-4 ${errorState.isConnection ? 'bg-amber-50' : 'bg-red-50'}`}>
              <div className="flex">
                <AlertCircle className={`h-5 w-5 ${errorState.isConnection ? 'text-amber-400' : 'text-red-400'}`} />
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${errorState.isConnection ? 'text-amber-800' : 'text-red-800'}`}>
                    {errorState.isConnection
                      ? "Connection Error"
                      : errorState.isNotFound
                        ? "Car Not Found"
                        : "Database / Logic Error"}
                  </h3>
                  <div className={`mt-2 text-sm font-mono text-xs whitespace-pre-wrap ${errorState.isConnection ? 'text-amber-700' : 'text-red-700'}`}>
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Car Name (Partial Search)</label>
            <div className="mt-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                className="block w-full rounded-md border-0 py-2 pl-9 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                placeholder="e.g. Corolla"
                value={formData.car_name}
                onChange={e => setFormData({ ...formData, car_name: e.target.value })}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Finds first matching car using SQL <code>ILIKE</code>.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                min="1"
                className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                value={formData.quantity || 1}
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Check # (Optional)</label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                placeholder="Auto"
                value={formData.check_num || ''}
                onChange={e => setFormData({ ...formData, check_num: e.target.value ? parseInt(e.target.value) : null })}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Sales;
