import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function Select({ value, options, onChange, placeholder, disabled, className }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  const close = useCallback((focusButton?: boolean) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      close();
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      close(true);
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [close, open]);

  const label = selected?.label ?? placeholder ?? '';

  return (
    <div ref={rootRef} className={['relative', className].filter(Boolean).join(' ')}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="input flex items-center justify-between gap-2"
      >
        <span className={selected ? 'truncate text-[color:var(--arco-text-1)]' : 'truncate text-[color:var(--arco-text-3)]'}>
          {label}
        </span>
        <ChevronDown
          className={[
            'h-4 w-4 text-[color:var(--arco-text-3)] transition-transform duration-150 ease-out',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      <div
        role="listbox"
        aria-hidden={!open}
        className={[
          'absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-[color:var(--arco-border)] bg-white shadow-[var(--arco-shadow)] origin-top transition-[opacity,transform] duration-150 ease-out',
          open ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-1 scale-95 pointer-events-none',
        ].join(' ')}
      >
        <div className="max-h-64 overflow-auto py-1">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                tabIndex={open ? 0 : -1}
                aria-selected={active}
                onClick={() => {
                  onChange(opt.value);
                  close(true);
                }}
                className={[
                  'w-full px-3 py-2 text-left text-sm flex items-center justify-between gap-3 transition-colors',
                  active
                    ? 'bg-[color:var(--arco-fill-1)] text-[color:var(--arco-primary-6)]'
                    : 'text-[color:var(--arco-text-1)] hover:bg-[color:var(--arco-fill-1)]',
                ].join(' ')}
              >
                <span className="truncate">{opt.label}</span>
                {active ? <span className="text-xs">已选</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
