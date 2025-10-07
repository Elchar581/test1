import { useState } from 'react';
import { LogOut, Users, MapPin, FileText, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LogsView } from './LogsView';
import { MapView } from './MapView';
import { UsersView } from './UsersView';

type View = 'map' | 'logs' | 'users';

export function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('map');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { id: 'map' as View, icon: MapPin, label: 'Карта мусора' },
    { id: 'logs' as View, icon: FileText, label: 'Логи системы' },
    { id: 'users' as View, icon: Users, label: 'Пользователи' },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Эко Админка</h1>
          <p className="text-sm text-gray-600 mt-1">Панель управления</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === item.id
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="whitespace-nowrap">Выход</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">А</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {currentView === 'map' && <MapView />}
          {currentView === 'logs' && <LogsView />}
          {currentView === 'users' && <UsersView />}
        </div>
      </main>
    </div>
  );
}
