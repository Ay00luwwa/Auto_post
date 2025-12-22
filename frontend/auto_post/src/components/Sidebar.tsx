import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, List, BarChart3, Link2, User, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
}

export const Sidebar = ({ isOpen, onClose, isCollapsed }: SidebarProps) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/posts', icon: List, label: 'Posts' },
    { path: '/posts/new', icon: Plus, label: 'New Post' },
    { path: '/connections', icon: Link2, label: 'Connections' },
    { path: '/stats', icon: BarChart3, label: 'Statistics' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700/50 backdrop-blur-xl transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-700/50 transition-all duration-300 ${
            isCollapsed ? 'px-4' : 'px-6'
          }`}>
            {!isCollapsed && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-cyan-400 dark:to-blue-500 bg-clip-text text-transparent">
                Post Stack
              </h1>
            )}
            {isCollapsed && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 dark:from-cyan-500 dark:to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-6 space-y-2 overflow-y-auto transition-all duration-300 ${
            isCollapsed ? 'px-2' : 'px-4'
          }`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path === '/dashboard' && location.pathname === '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    // Close mobile menu on navigation
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  title={isCollapsed ? item.label : ''}
                  className={`group flex items-center rounded-xl text-sm font-medium transition-all duration-200 relative ${
                    isCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                  } ${
                    isActive
                      ? 'bg-primary-50 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-blue-500/20 text-primary-700 dark:text-cyan-300 shadow-lg dark:shadow-cyan-500/20 border border-primary-200 dark:border-cyan-500/30'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className={`transition-all duration-200 ${
                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                  } ${isActive ? 'text-primary-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`} />
                  {!isCollapsed && (
                    <span className="transition-opacity duration-200">{item.label}</span>
                  )}
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-500 to-primary-600 dark:from-cyan-400 dark:to-blue-500 rounded-r-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700/50">
              <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
                © 2025 Post Stack
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

