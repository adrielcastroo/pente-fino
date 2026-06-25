import { Construction } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
}

export default function ExpedicaoPlaceholder({ title, description }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="bg-card border border-border rounded-md p-12 text-center">
        <Construction className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Em construção</p>
        <p className="text-xs text-muted-foreground mt-1">
          Esta tela será implementada nas próximas fases do módulo Expedição.
        </p>
      </div>
    </div>
  );
}
