import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  LayoutDashboard,
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  BookMarked,
  Library,
  FileText,
  BarChart3,
  MessageSquare,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  GraduationCap,
  Sun,
  Moon,
  Monitor,
  CreditCard,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/reading', icon: BookOpen, label: 'Reading' },
  { to: '/dashboard/listening', icon: Headphones, label: 'Listening' },
  { to: '/dashboard/writing', icon: PenLine, label: 'Writing' },
  { to: '/dashboard/speaking', icon: Mic, label: 'Speaking' },
  { to: '/dashboard/vocabulary', icon: BookMarked, label: 'Vocabulary' },
  { to: '/dashboard/exam-library', icon: Library, label: 'Exam Library' },
  { to: '/dashboard/results', icon: BarChart3, label: 'Results' },
  { to: '/dashboard/chat', icon: MessageSquare, label: 'Chat' },
];

function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Tizimdan chiqdingiz');
    navigate('/');
  };

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-16 border-b border-border">
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
          <GraduationCap className="size-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg">PrepMaster</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <NavLink
          to="/dashboard/profile"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`
          }
        >
          <User className="size-4" />
          Profile
        </NavLink>
        <NavLink
          to="/dashboard/settings"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`
          }
        >
          <Settings className="size-4" />
          Settings
        </NavLink>
        <NavLink
          to="/dashboard/subscription"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`
          }
        >
          <CreditCard className="size-4" />
          Subscription
        </NavLink>
        {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
          <NavLink
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`
            }
          >
            <Shield className="size-4" />
            Admin Panel
          </NavLink>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </div>
  );

  const pageTitle = NAV_ITEMS.find((n) => n.to === location.pathname)?.label || '';

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="md:hidden fixed top-0 inset-x-0 z-30 h-16 border-b border-border bg-card flex items-center px-4">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <div className="flex items-center gap-2 mx-auto font-bold">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="size-4 text-primary-foreground" />
            </div>
            <span>PrepMaster</span>
          </div>
          <div className="size-9" />
        </div>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="md:pl-64">
        <header className="hidden md:flex sticky top-0 z-20 h-16 border-b border-border bg-background/80 backdrop-blur-md items-center justify-between px-6">
          <h1 className="text-lg font-semibold">{pageTitle || 'Dashboard'}</h1>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard/notifications')}>
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden lg:block">
                    {profile?.full_name || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                  <User className="size-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                  <Settings className="size-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard/subscription')}>
                  <CreditCard className="size-4 mr-2" />
                  Subscription
                </DropdownMenuItem>
                {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="size-4 mr-2" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="size-4 mr-2" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="size-4 mr-2" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="size-4 mr-2" />
                  System
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="size-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="pt-16 md:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
