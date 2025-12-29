import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, User, LogOut, Menu, X, ChevronRight } from 'lucide-react';

interface HeaderProps {
  tenantName?: string;
  menus: any[];
}

const Header: React.FC<HeaderProps> = ({ tenantName, menus }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState<{ [key: string]: 'right' | 'left' }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const submenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateToRoute = (menu: any) => {
    const route = menu.route || '/home/dashboard';
    navigate(route);
  };

  const handleMenuClick = (menu: any) => {
    if (menu.children && menu.children.length > 0) {
      setActiveDropdown(activeDropdown === menu.name ? null : menu.name);
    } else {
      navigateToRoute(menu);
      setActiveDropdown(null);
    }
  };

  const handleSubmenuClick = (submenu: any) => {
    navigateToRoute(submenu);
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  };

  const checkSubmenuPosition = (submenuKey: string, element: HTMLDivElement | null) => {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const spaceOnRight = viewportWidth - rect.right;
    const submenuWidth = 192; // w-48 = 12rem = 192px
    
    setSubmenuPosition(prev => ({
      ...prev,
      [submenuKey]: spaceOnRight >= submenuWidth ? 'right' : 'left'
    }));
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/home/dashboard')}>
          <span className="text-2xl mr-3">🏢</span>
          <h1 className="text-xl font-bold text-blue-800">{tenantName}</h1>
        </div>

        <div className="md:hidden">
          <button
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              setActiveDropdown(null);
            }}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <div className="hidden md:flex items-center space-x-1" ref={dropdownRef}>
          {menus.map((menu) => (
            <div key={menu.name} className="relative">
              <button
                onClick={() => handleMenuClick(menu)}
                className="flex items-center px-2 lg:px-4 py-2 text-xs lg:text-sm font-medium text-white bg-primary hover:bg-secondary rounded-md transition-colors"
              >
                <span className="mr-1">{menu.icon}</span>
                {menu.name}
                {menu.children && menu.children.length > 0 && (
                  <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </button>

              {activeDropdown === menu.name && menu.children && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    {menu.children.map((submenu: any) => (
                      <div key={submenu.name}>
                        {submenu.children && submenu.children.length > 0 ? (
                          <div 
                            className="group relative"
                            ref={(el) => {
                              const key = `${menu.name}-${submenu.name}`;
                              submenuRefs.current[key] = el;
                            }}
                            onMouseEnter={() => {
                              const key = `${menu.name}-${submenu.name}`;
                              checkSubmenuPosition(key, submenuRefs.current[key]);
                            }}
                          >
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between">
                              <span>
                                <span className="mr-2">{submenu.icon}</span>
                                {submenu.name}
                              </span>
                              <ChevronRight className="h-4 w-4" />
                            </button>
                            <div 
                              className={`absolute top-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${
                                submenuPosition[`${menu.name}-${submenu.name}`] === 'left' ? 'right-full' : 'left-full'
                              }`}
                            >
                              <div className="py-1">
                                {submenu.children.map((item: any) => (
                                  <button
                                    key={item.name}
                                    onClick={() => handleSubmenuClick(item)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <span className="mr-2">{item.icon}</span>
                                    {item.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSubmenuClick(submenu)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <span className="mr-2">{submenu.icon}</span>
                            {submenu.name}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="relative ml-4">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {(user?.username || 'G').charAt(0).toUpperCase()}
              </div>
              {/* <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" /> */}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.username || 'Guest'}
                    {user?.roles && user.roles.length > 0 && (
                      <span className="text-xs font-normal text-gray-500">
                        ({user.roles[0]}{user.roles.length > 1 ? `+${user.roles.length - 1}` : ''})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.email || 'No email'}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            {menus.map((menu) => (
              <div key={menu.name}>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                  {menu.name}
                </div>
                {menu.children?.map((submenu: any) => (
                  <div key={submenu.name}>
                    {submenu.children ? (
                      <div>
                        <div className="text-xs font-medium text-gray-600 px-6 py-1">
                          {submenu.name}
                        </div>
                        {submenu.children.map((item: any) => (
                          <button
                            key={item.name}
                            onClick={() => {
                              if (item.code) {
                                navigateToRoute(item);
                                setMobileMenuOpen(false);
                              }
                            }}
                            className="w-full text-left px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <span className="mr-2">{item.icon}</span>
                            {item.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (submenu.code) {
                            navigateToRoute(submenu);
                            setMobileMenuOpen(false);
                          }
                        }}
                        className="w-full text-left px-6 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        <span className="mr-2">{submenu.icon}</span>
                        {submenu.name}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}

            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="px-3 py-2 bg-gray-50 rounded-md mb-2">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.username || 'Guest'}
                  {user?.roles && user.roles.length > 0 && (
                    <span className="text-xs font-normal text-gray-500">
                      ({user.roles[0]}{user.roles.length > 1 ? `+${user.roles.length - 1}` : ''})
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
              </div>
              <button
                onClick={() => {
                  navigate('/profile');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </button>
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
