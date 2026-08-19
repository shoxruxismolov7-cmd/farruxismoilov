import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-primary">404</h1>
        <p className="text-2xl font-bold mt-4 mb-2">Sahifa topilmadi</p>
        <p className="text-muted-foreground mb-8">Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan.</p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link to="/">
              <Home className="size-4 mr-1" />
              Bosh sahifa
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="size-4 mr-1" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
