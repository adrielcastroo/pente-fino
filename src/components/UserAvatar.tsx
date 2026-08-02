import { User } from 'lucide-react';
import { useAvatarUrl } from '@/hooks/use-avatar-url';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  avatarUrl,
  name,
  className,
  imageClassName,
  fallbackClassName,
}: UserAvatarProps) {
  const resolvedUrl = useAvatarUrl(avatarUrl);
  const initials = name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div className={cn('flex shrink-0 items-center justify-center overflow-hidden bg-muted', className)}>
      {resolvedUrl ? (
        <img
          src={resolvedUrl}
          alt={name ? `Foto de ${name}` : 'Foto do usuário'}
          className={cn('h-full w-full object-cover', imageClassName)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className={cn('text-xs font-bold text-muted-foreground', fallbackClassName)}>
          {initials || <User className="h-1/2 w-1/2" />}
        </span>
      )}
    </div>
  );
}