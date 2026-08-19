import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
}

export function Navbar({ children }: { children: ReactNode }) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      {children}
    </nav>
  );
}

export function NavBody({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between relative">
      {children}
    </div>
  );
}

export function NavItems({ items }: { items: NavItem[] }) {
  return (
    <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

export function MobileNavToggle() {
  const [open, setOpen] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={() => setOpen(!open)}
    >
      {open ? <X className="size-5" /> : <Menu className="size-5" />}
    </Button>
  );
}

export function MobileNav({ children }: { children: ReactNode }) {
  return <div className="md:hidden">{children}</div>;
}

export function MobileNavHeader({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between mb-4">{children}</div>;
}

export function MobileNavMenu({ children }: { children: ReactNode }) {
  return <div className="px-4 pb-4 pt-2">{children}</div>;
}

export function MobileNavItems({ items }: { items: NavItem[] }) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
