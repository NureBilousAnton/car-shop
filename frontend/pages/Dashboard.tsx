import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format as d3Format } from 'd3-format';
import { CarFullSales } from '../types';
import { carService } from '../services/api';
import StatCard from '../components/StatCard';
import { TrendingDown, CarFront, Activity, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [cars, setCars] = useState<CarFullSales[]>([]);
  const [cheapCount, setCheapCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const carsData = await carService.getAllCars();
        setCars(carsData);

        try {
          const statsData = await carService.getCheapCarsCount();
          setCheapCount(statsData.count);
        } catch (e) {
          console.warn("Could not fetch stats:", e);
        }

      } catch (err: any) {
        console.error("Failed to fetch dashboard data", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = cars.map(car => ({
    name: car.name,
    price: parseFloat(car.price),
    brand: car.brand
  })).sort((a, b) => b.price - a.price);

  const formatCurrencyD3 = d3Format("$,.0f");

  if (isLoading) return <div className="flex h-96 items-center justify-center text-gray-400">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Real-time metrics from the database.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Inventory"
          value={cars.reduce((acc, c) => acc + c.quantity, 0)}
          icon={CarFront}
          color="blue"
        />
        <StatCard
          title="Avg. Price Comparison"
          value={cheapCount !== null ? cheapCount : '-'}
          description="Cars cheaper than average (Scalar Func)"
          icon={TrendingDown}
          color="green"
        />
        <StatCard
          title="Active Models"
          value={cars.length}
          icon={Activity}
          color="indigo"
        />
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <h3 className="mb-6 text-base font-semibold leading-6 text-gray-900">Price Distribution by Model</h3>
        {cars.length > 0 ? (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrencyD3(value), 'Price']}
                />
                <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4F46E5' : '#818CF8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            {error ? "No data available due to error." : "No inventory data found."}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
