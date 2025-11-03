import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ShoppingCart, Package, Users } from 'lucide-react';

export default function AdminLayout() {
  const navLinkClasses =
    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary';
  const activeNavLinkClasses = 'bg-muted text-primary';

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <Package className="h-6 w-6" />
              <span className="">E-commerce</span>
            </NavLink>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
                }
              >
                <Home className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/products"
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
                }
              >
                <ShoppingCart className="h-4 w-4" />
                Products
              </NavLink>
              <NavLink
                to="/admin/orders"
                className={({ isActive }) =>
                  `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`
                }
              >
                <Package className="h-4 w-4" />
                Orders
              </NavLink>
            </nav>
          </div>
        </div>
      </aside>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
