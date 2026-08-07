import * as React from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface FileUploadProps {
  /** Called with the newly picked files (from either the click-to-browse input or a drop). Does not
   * manage a selected-files list itself — the caller owns that state, since callers typically need
   * to pair each file with an upload-in-progress/uploaded/failed status. */
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  hint?: string;
}

/**
 * Accessible drag-and-drop / click-to-browse file picker. Deliberately stateless about the file
 * list — see `onFilesSelected` — so callers can render each file with its own upload-status affordance
 * (see `TenantRegistrationWizardPage`'s Documents step for the pairing).
 */
export function FileUpload({
  onFilesSelected,
  accept,
  multiple = true,
  disabled = false,
  className,
  label = 'Click to upload or drag and drop',
  hint,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = React.useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onFilesSelected(Array.from(fileList));
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragActive(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center outline-none transition-colors',
        'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        isDragActive ? 'border-primary bg-primary/5' : 'border-input',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-accent/50',
        className,
      )}
    >
      <Upload className="text-muted-foreground size-6" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export interface FileUploadListItemProps {
  fileName: string;
  status: 'uploading' | 'uploaded' | 'failed';
  onRemove?: () => void;
}

/** One row of an uploaded/uploading/failed document — pairs with `FileUpload` above. */
export function FileUploadListItem({ fileName, status, onRemove }: FileUploadListItemProps) {
  return (
    <div className="border-border flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate">{fileName}</span>
      <span
        className={cn(
          'text-xs',
          status === 'uploaded' && 'text-success',
          status === 'uploading' && 'text-muted-foreground',
          status === 'failed' && 'text-destructive',
        )}
      >
        {status === 'uploading' ? 'Uploading…' : status === 'uploaded' ? 'Uploaded' : 'Failed'}
      </span>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-6 p-0"
          onClick={onRemove}
          aria-label={`Remove ${fileName}`}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
