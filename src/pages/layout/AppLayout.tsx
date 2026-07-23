import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInForm, SignOutButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  ImageIcon,
  Film,
  Library,
  Settings,
  ChevronRight,
  Menu,
  X,
  Type,
  Languages,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils.ts";

const LOGO_URL = "https://hercules-cdn.com/file_kYbuyChqudyVnd8HDVVmrydu";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/campaigns", icon: Megaphone, label: "Campaigns" },
  { to: "/image-studio", icon: ImageIcon, label: "Image Studio" },
  { to: "/reel-studio", icon: Film, label: "Reel Studio" },
  { to: "/composer", icon: Type, label: "Dhivehi Composer" },
  { to: "/dhivehi-phrases", icon: Languages, label: "Dhivehi Phrases" },
  { to: "/library", icon: Library, label: "Library" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <img
            src={LOGO_URL}
            alt="Musalhu Creative Studio"
            className="h-8 w-auto"
          />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-heading font-600 tracking-[0.2em] text-primary uppercase">
              Creative Studio
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to) && item.to !== "/";
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <item.icon
                size={16}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-primary" : "group-hover:text-foreground",
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={12} className="text-primary" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="px-1">
          <p className="text-[11px] text-muted-foreground">
            Musalhu Advertising
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Internal Creative Tool
          </p>
        </div>
        <SignOutButton className="w-full justify-start text-muted-foreground" />
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8 max-w-sm w-full px-6">
        <div className="space-y-4">
          <img
            src={LOGO_URL}
            alt="Musalhu Creative Studio"
            className="h-14 w-auto mx-auto"
          />
          <div>
            <h1 className="text-xl font-heading font-semibold tracking-wide text-foreground">
              Creative Studio
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Internal tool — staff access only
            </p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Sign in with your Musalhu staff account
          </p>
          <SignInForm />
        </div>
        <p className="text-xs text-muted-foreground/50">
          Musalhu Advertising &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="space-y-4 w-64">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <SignInPage />
      </Unauthenticated>

      <Authenticated>
        <div className="flex h-screen bg-background overflow-hidden">
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex md:w-56 lg:w-60 flex-col border-r border-border bg-sidebar shrink-0">
            <Sidebar />
          </aside>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <aside
            className={cn(
              "fixed left-0 top-0 h-full z-50 w-60 bg-sidebar border-r border-border transition-transform duration-300 md:hidden",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="flex justify-end p-3">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile header */}
            <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-sidebar shrink-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground"
              >
                <Menu size={20} />
              </button>
              <img src={LOGO_URL} alt="Logo" className="h-6 w-auto" />
              <span className="text-xs font-heading font-semibold tracking-widest text-primary uppercase">
                Creative Studio
              </span>
            </header>

            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </Authenticated>
    </>
  );
}
