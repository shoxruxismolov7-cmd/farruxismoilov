import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (search) query = query.ilike('full_name', `%${search}%`);
    query.then(({ data }) => {
      setUsers((data || []) as Profile[]);
      setLoading(false);
    });
  }, [search]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Users className="size-7" />
          Users
        </h1>
        <p className="text-muted-foreground mt-1">Barcha foydalanuvchilar</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Ism bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <Users className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Foydalanuvchilar topilmadi.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Foydalanuvchi</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Maqsad</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Daraja</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const initials = (user.full_name || 'U').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                    return (
                      <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{user.full_name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{user.email}</td>
                        <td className="p-4"><Badge variant="outline" className="capitalize">{user.goal}</Badge></td>
                        <td className="p-4 text-sm capitalize hidden md:table-cell">{user.current_level}</td>
                        <td className="p-4"><Badge variant={user.role === 'student' ? 'secondary' : 'default'} className="capitalize">{user.role}</Badge></td>
                        <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminUsersPage;
