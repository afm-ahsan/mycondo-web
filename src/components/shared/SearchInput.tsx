import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  /** The raw, un-debounced value — pair with `useDebouncedValue` before sending it to the API. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Shows a spinner in place of the clear button while a debounced search request is in flight. */
  isSearching?: boolean;
  className?: string;
}

/**
 * The standard list-page search box: icon, debounce-friendly controlled input, and a clear button
 * that only appears once there's something to clear. Pair with `useDebouncedValue` for the actual
 * debounce — this component only renders the input, it doesn't decide when to query.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  isSearching = false,
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ps-9 pe-9"
      />
      {isSearching ? (
        <InlineSpinner className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      ) : (
        value.length > 0 && (
          <Button
            type="button"
            mode="icon"
            variant="ghost"
            className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => onChange('')}
            aria-label="Clear search"
          >
            <X />
          </Button>
        )
      )}
    </div>
  );
}
