import React, { useState, useEffect } from 'react';
import { Order, PaymentStatus } from './types';
import CreateOrder from './components/CreateOrder';
import OrderCard from './components/OrderCard';
import OrderArchive from './components/OrderArchive';
import Accounting from './components/Accounting';
import { LayoutDashboard, PlusCircle, Search, Archive, Calculator, Building, Settings, X } from 'lucide-react';
import { updateUsageOnOrderChange } from './services/usageService';
import DateFilter, { DateFilterOption } from './components/DateFilter';
import ApiKeyManager from './components/ApiKeyManager';
import ImageEditor from './components/ImageEditor';

const App: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'office' | 'archive' | 'accounting'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. Initialize from localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('fishMarketOrders');
    if (savedOrders) {
      try {
        const parsedOrders: Order[] = JSON.parse(savedOrders);
        // Migration for old "پرداخت شده" status
        const migratedOrders = parsedOrders.map(order => {
          if ((order.paymentStatus as any) === "پرداخت شده") {
            return { ...order, paymentStatus: PaymentStatus.PAID_CARD }; // Default old paid to Card
          }
          return order;
        });
        setOrders(migratedOrders);
      } catch (e) {
        console.error("Failed to parse orders", e);
      }
    }
  }, []);

  // 2. Persist to localStorage whenever orders change
  useEffect(() => {
    localStorage.setItem('fishMarketOrders', JSON.stringify(orders));
  }, [orders]);

  // ACTIONS
  const handleCreateOrder = (newOrder: Order) => {
    updateUsageOnOrderChange(null, newOrder);
    setOrders(prev => [newOrder, ...prev]);
    // If it's a regular order, switch to list, if office, stay on create page after alert
    if (!newOrder.isOfficeOrder) {
        setActiveTab('list');
    }
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    const oldOrder = orders.find(o => o.id === updatedOrder.id);
    if (oldOrder) {
      updateUsageOnOrderChange(oldOrder, updatedOrder);
    }
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const handleDeleteOrder = (id: string) => {
    const orderToDelete = orders.find(o => o.id === id);
    if (orderToDelete) {
      updateUsageOnOrderChange(orderToDelete, null);
    }
    setOrders(prev => prev.filter(o => o.id !== id));
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleAcceptOfficeOrder = (order: Order) => {
    handleUpdateOrder({ ...order, isOfficeOrder: false });
    if (navigator.vibrate) navigator.vibrate(50);
  };

  // FILTERING
  const officeOrders = orders.filter(o => o.isOfficeOrder === true);
  const activeOrders = orders.filter(o => o.paymentStatus === PaymentStatus.UNPAID && !o.isOfficeOrder);
  const archivedOrders = orders.filter(o => (o.paymentStatus === PaymentStatus.PAID_CASH || o.paymentStatus === PaymentStatus.PAID_CARD) && !o.isOfficeOrder);
  
  const combinedFilter = (order: Order): boolean => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const searchMatch = !searchQuery ||
          order.customerName.toLowerCase().includes(lowerCaseQuery) ||
          order.invoiceNumber.includes(searchQuery) ||
          order.customerPhone.includes(searchQuery);

      if (!searchMatch) return false;

      if (dateFilter === 'all') return true;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const orderDate = new Date(order.timestamp);
      orderDate.setHours(0, 0, 0, 0);

      switch (dateFilter) {
          case 'today':
              return orderDate.getTime() === today.getTime();
          case 'yesterday':
              const yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);
              return orderDate.getTime() === yesterday.getTime();
          case 'week':
              const oneWeekAgo = new Date(today);
              oneWeekAgo.setDate(today.getDate() - 6);
              return orderDate >= oneWeekAgo;
          case 'month':
              return orderDate.getFullYear() === now.getFullYear() &&
                     orderDate.getMonth() === now.getMonth();
          default:
              return true;
      }
  };

  const filteredActiveOrders = activeOrders.filter(combinedFilter);
  const filteredOfficeOrders = officeOrders.filter(combinedFilter);
  const filteredArchivedOrders = archivedOrders.filter(combinedFilter);

  const renderOrderList = (list: Order[], isOfficeList = false) => {
      if (list.length === 0) {
          return (
              <div className="text-center py-12 text-gray-400">
                  { isOfficeList ? 'سفارش دفتری جدیدی وجود ندارد.' : 'سفارشی یافت نشد.' }
              </div>
          );
      }

      return (
        <div className="space-y-4">
          {list.map(order => (
            <OrderCard 
              key={order.id}
              order={order}
              onUpdate={handleUpdateOrder}
              onDelete={handleDeleteOrder}
              onAccept={isOfficeList ? handleAcceptOfficeOrder : undefined}
            />
          ))}
        </div>
      );
  }

  const isSearchVisible = activeTab === 'list' || activeTab === 'archive' || activeTab === 'office';

  return (
    <div className="min-h-screen bg-brand-50 pb-24 max-w-lg mx-auto shadow-2xl border-x border-brand-100">
      
      <div className="sticky top-0 z-20">
        <div className="w-full flex items-center justify-between p-4 bg-white shadow">
          <button onClick={() => setIsSettingsOpen(true)} className="text-gray-500 hover:text-brand-600 p-2 -ml-2 rounded-full transition-colors">
            <Settings size={22} />
          </button>
          <div className="text-right">
            <div className="font-bold text-lg text-brand-800">شرکت قزل ماهی بنار</div>
            <div className="text-sm text-gray-600">2878 : شماره ثبت</div>
          </div>
        </div>
        {isSearchVisible && (
            <div className="bg-brand-50 px-4 pt-4 pb-2 border-b border-brand-100">
                <div className="flex flex-col sm:flex-row gap-2">
                   <div className="relative flex-1">
                     <input 
                       type="text" 
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       placeholder="جستجو نام، شماره فاکتور، تلفن..." 
                       className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-brand-200 bg-white shadow-sm focus:ring-2 focus:ring-brand-300 outline-none"
                     />
                     <Search className="absolute right-3 top-3 text-gray-400" size={18}/>
                   </div>
                   <DateFilter value={dateFilter} onChange={setDateFilter} />
                </div>
            </div>
        )}
      </div>

      <main className="p-4">
        {activeTab === 'create' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <CreateOrder onOrderCreated={handleCreateOrder} />
          </div>
        )}

        {activeTab === 'accounting' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <Accounting orders={orders} />
          </div>
        )}

        {isSearchVisible && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            {activeTab === 'list' && renderOrderList(filteredActiveOrders)}
            {activeTab === 'office' && renderOrderList(filteredOfficeOrders, true)}
            {activeTab === 'archive' && <OrderArchive orders={filteredArchivedOrders} />}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-30 grid grid-cols-5 gap-1 max-w-lg mx-auto">
         <TabButton icon={<PlusCircle size={24}/>} label="ثبت" isActive={activeTab === 'create'} onClick={() => setActiveTab('create')} />
         <TabButton icon={<LayoutDashboard size={24}/>} label="سفارشات" isActive={activeTab === 'list'} onClick={() => setActiveTab('list')} notificationCount={filteredActiveOrders.length} />
         <TabButton icon={<Building size={24}/>} label="دفتر" isActive={activeTab === 'office'} onClick={() => setActiveTab('office')} notificationCount={filteredOfficeOrders.length}/>
         <TabButton icon={<Calculator size={24}/>} label="حسابداری" isActive={activeTab === 'accounting'} onClick={() => setActiveTab('accounting')} />
         <TabButton icon={<Archive size={24}/>} label="بایگانی" isActive={activeTab === 'archive'} onClick={() => setActiveTab('archive')} notificationCount={filteredArchivedOrders.length} />
      </nav>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 animate-in fade-in">
          <div className="fixed inset-0 max-w-lg mx-auto bg-brand-50 shadow-2xl flex flex-col">
            <header className="flex items-center justify-between p-4 border-b bg-white">
              <h2 className="text-lg font-bold text-brand-800">تنظیمات و ابزارها</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500 hover:text-red-600 p-2 -mr-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </header>
            <main className="p-4 overflow-y-auto flex-1">
                <div className="space-y-6">
                    <ApiKeyManager />
                    <ImageEditor />
                </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

interface TabButtonProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    notificationCount?: number;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, isActive, onClick, notificationCount = 0 }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl w-full transition-all relative ${isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-400'}`}
    >
        {notificationCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {notificationCount}
            </span>
        )}
        {icon}
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);


export default App;