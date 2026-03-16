import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Receipt, 
  History, 
  Settings,
  Car,
  LogOut,
  UserCircle
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const allNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin'] },
  { name: 'Products', href: '/products', icon: Package, roles: ['admin'] },
  { name: 'Customers', href: '/customers', icon: Users, roles: ['admin'] },
  { name: 'Billing POS', href: '/billing', icon: Receipt, roles: ['admin', 'staff'] },
  { name: 'Sales History', href: '/history', icon: History, roles: ['admin'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter navigation items based on user role
  const navigation = allNavigation.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-full w-64 flex-col gap-y-5 bg-theme-primary px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center gap-3">
        <Car className="h-8 w-8 text-white" />
        <span className="text-xl font-bold tracking-tight text-white">Lumo Industries</span>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        isActive
                          ? 'bg-theme-secondary text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-theme-secondary/80',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-200'
                      )
                    }
                  >
                    <item.icon
                      className="h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
          
          <li className="mt-auto space-y-2">
            {user?.role === 'admin' && (
              <a
                href="#"
                className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-indigo-100 hover:bg-theme-secondary/80 hover:text-white transition-colors duration-200"
              >
                <Settings className="h-6 w-6 shrink-0" aria-hidden="true" />
                Settings
              </a>
            )}
            
            <div className="-mx-6 border-t border-theme-secondary mt-4 pt-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircle className="h-8 w-8 text-indigo-200" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">{user?.name}</span>
                  <span className="text-xs text-indigo-200 capitalize">{user?.role}</span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-indigo-200 hover:text-white transition-colors group p-2 hover:bg-theme-secondary rounded-md"
                title="Logout"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}