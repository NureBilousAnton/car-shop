import React, { useEffect, useState } from 'react';
import { carService, salesService } from '../services/api';
import { CarFullSales, CheapCarRow } from '../types';
import { CURRENCY_FORMAT } from '../constants';
import { Filter, AlertCircle } from 'lucide-react';

const Inventory: React.FC = () => {
  const [cars, setCars] = useState<CarFullSales[]>([]);
  const [filteredCars, setFilteredCars] = useState<CheapCarRow[] | null>(null);
  const [priceThreshold, setPriceThreshold] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'filtered'>('all');

  useEffect(() => {
    loadAllCars();
  }, []);

  const loadAllCars = async () => {
    setLoading(true);
    setError(null);
    try {
      const [carsData, salesData] = await Promise.all([
        carService.getAllCars(),
        salesService.getAllSales()
      ]);

      const enrichedCars = carsData.map(car => {
        const carSales = salesData
          .filter(sale => sale.car_id === car.id)
          .map(sale => ({
            id: sale.id,
            check_num: sale.check_num,
            quantity: sale.quantity,
            sold_at: sale.sold_at
          }))
          .sort((a, b) => new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime());

        return { ...car, sales: carSales };
      });

      setCars(enrichedCars);
      setViewMode('all');
    } catch (err: any) {
      setError(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceThreshold) return;

    setLoading(true);
    setError(null);
    try {
      const data = await carService.getCarsCheaperThan(parseFloat(priceThreshold));
      setFilteredCars(data);
      setViewMode('filtered');
    } catch (err: any) {
      setError(err.message || "Failed to filter cars");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Inventory</h1>
          <p className="text-sm text-gray-500">Manage stock and view detailed car information.</p>
        </div>

        {/* Table Function Demo Section */}
        <form onSubmit={handleFilter} className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm ring-1 ring-gray-200">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              value={priceThreshold}
              onChange={(e) => setPriceThreshold(e.target.value)}
              placeholder="Max Price"
              className="block w-32 rounded-md border-0 py-1.5 pl-7 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
          {viewMode === 'filtered' && (
            <button
              type="button"
              onClick={loadAllCars}
              className="ml-2 text-sm text-gray-500 hover:text-gray-900 underline"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
          ))
        ) : viewMode === 'all' ? (
          cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))
        ) : (
          filteredCars?.map((car) => (
            <SimpleCarCard key={car.id} car={car} />
          ))
        )}

        {!loading && viewMode === 'all' && cars.length === 0 && !error && (
          <div className="col-span-full py-12 text-center text-gray-500">
            Inventory is empty.
          </div>
        )}

        {!loading && viewMode === 'filtered' && filteredCars?.length === 0 && !error && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No cars found cheaper than the specified price.
          </div>
        )}
      </div>
    </div>
  );
};

const CarCard: React.FC<{ car: CarFullSales }> = ({ car }) => {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 transition-hover hover:shadow-md">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
            {car.brand}
          </span>
          <span className="text-lg font-bold text-gray-900">{CURRENCY_FORMAT.format(parseFloat(car.price))}</span>
        </div>
        <h3 className="mt-4 text-xl font-semibold text-gray-900">{car.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{car.description}</p>

        <div className="mt-6 flex items-center gap-x-4 text-xs leading-5 text-gray-500">
          <div className="flex items-center gap-x-1">
            <span className="font-semibold text-gray-900">Stock:</span> {car.quantity}
          </div>
          <div className="h-1 w-1 rounded-full bg-gray-300" />
          <div>{car.center}</div>
        </div>
      </div>
      <div className="bg-gray-50 px-6 py-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Sales History</div>
        {car.sales && car.sales.length > 0 ? (
          <ul className="space-y-2">
            {car.sales.slice(0, 3).map(sale => (
              <li key={sale.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{sale.sold_at}</span>
                <span className="font-medium text-gray-900">Qty: {sale.quantity}</span>
              </li>
            ))}
            {car.sales.length > 3 && <li className="text-xs text-center text-gray-400">+{car.sales.length - 3} more</li>}
          </ul>
        ) : (
          <div className="text-sm italic text-gray-400">No sales recorded yet.</div>
        )}
      </div>
    </div>
  );
}

const SimpleCarCard: React.FC<{ car: CheapCarRow }> = ({ car }) => (
  <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 hover:ring-indigo-500/50">
    <div className="p-6">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{car.name}</h3>
        <span className="font-bold text-green-600">{CURRENCY_FORMAT.format(parseFloat(car.price))}</span>
      </div>
      <p className="mt-2 text-sm text-gray-500">{car.description}</p>
    </div>
  </div>
);

export default Inventory;
