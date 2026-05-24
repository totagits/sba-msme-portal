import { Bell } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api';

export default function NotificationBell() {
  const { data } = useQuery({
    queryKey: ['notificationCount'],
    queryFn: () => notificationsApi.getCount().then(r => r.data.data.count),
    refetchInterval: 30000,
  });

  const count = data || 0;

  return (
    <Link href="/notifications">
      <a className="relative text-white hover:text-primary-200 transition-colors p-1">
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-600 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse-ring">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </a>
    </Link>
  );
}
