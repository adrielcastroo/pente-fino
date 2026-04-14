import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatML } from '@/lib/app-utils';

interface HighlightedTextProps {
  text: string;
  q: string;
}

const HighlightedText = memo(({ text, q }: HighlightedTextProps) => {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-primary/20 text-primary rounded-sm px-0.5 font-bold">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
});

HighlightedText.displayName = 'HighlightedText';

interface TableCellProps {
  r: any;
  column: any;
  searchQuery: string;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (val: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: (rowId: string, key: string, val: string) => void;
  onCopy: (t: string) => void;
}

export const TableCell = memo(({ r, column, searchQuery, isEditing, editValue, onEditValueChange, onCommitEdit, onCancelEdit, onStartEdit, onCopy }: TableCellProps) => {
  if (isEditing) {
    return (
      <td className="px-2 sm:px-4 py-2 sm:py-3.5">
        <input
          autoFocus
          value={editValue}
          onChange={e => onEditValueChange(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={e => { if (e.key === 'Enter') onCommitEdit(); if (e.key === 'Escape') onCancelEdit(); }}
          className="w-full bg-background border-2 border-primary rounded-lg px-2 py-1 text-sm outline-none shadow-lg shadow-primary/10"
        />
      </td>
    );
  }

  const val = (r as any)[column.key];
  const displayVal = column.key === 'm2' ? (r.m2 > 0 ? r.m2.toFixed(1) : '—')
    : column.key === 'largura' ? (r.largura > 0 ? `${r.largura.toFixed(2)}m` : '—')
    : column.key === 'mLinear' ? formatML(r.mLinear)
    : column.key === 'loteSistema' ? null
    : column.key === 'item' ? null
    : column.key === 'endereco' ? null
    : (val || '—');

  let content: React.ReactNode = displayVal;

  if (column.key === 'loteSistema') {
    content = (
      <Badge 
        variant="outline" 
        className="cursor-pointer border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all font-mono py-1 px-2.5 rounded-lg border-dashed" 
        onClick={() => onCopy(r.loteSistema)}
      >
        {r.loteSistema || '—'}
      </Badge>
    );
  } else if (column.key === 'item' || column.key === 'endereco') {
    content = <HighlightedText text={String(val || '—')} q={searchQuery} />;
  }

  return (
    <td 
      onDoubleClick={() => column.key !== 'loteSistema' ? onStartEdit(r.id, column.key, String(val ?? '')) : undefined}
      className={`px-2 sm:px-4 py-2 sm:py-3.5 text-xs sm:text-sm transition-colors ${column.key === 'item' ? 'font-extrabold text-foreground' : 'font-mono text-muted-foreground/90'} ${column.key === 'loteSistema' ? 'max-w-[120px] sm:max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap' : ''}`}
    >
      {content}
    </td>
  );
});

TableCell.displayName = 'TableCell';
