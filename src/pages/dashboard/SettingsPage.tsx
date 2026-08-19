import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings, Sun, Moon, Monitor, Bell } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Settings className="size-7" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Tizim sozlamalari</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mavzu (Theme)</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-3 block">Interfeys mavzusini tanlang</Label>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  toast.success('Mavzu o\'zgartirildi');
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === opt.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <opt.icon className="size-6" />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Bell className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Push notifications</p>
                <p className="text-xs text-muted-foreground">Bildirishnomalar haqida xabardor bo'ling</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">Tez orada</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
