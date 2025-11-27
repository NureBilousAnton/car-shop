import React from 'react';
import { Car, ShoppingCart, BarChart3, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: BarChart3 },
    { name: 'Inventory', path: '/inventory', icon: Car },
    { name: 'Sales & Orders', path: '/sales', icon: ShoppingCart },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-center border-b border-gray-100 px-6">
          <span className="text-xl font-bold text-indigo-600">CarShop Panel</span>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between bg-white px-6 shadow-sm lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-lg font-semibold text-gray-900">CarShop</span>
          <div className="w-6" /> {/* Spacer for centering */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
