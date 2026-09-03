'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Surfaces                                                                   */
/* -------------------------------------------------------------------------- */

export function Card({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'hairline rounded-2xl border border-line bg-elevated/40 p-5 sm:p-6',
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="font-display text-base font-semibold text-cream">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-fg-muted">
                {description}
              </p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <p className="font-display text-sm font-semibold text-cream">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fg-muted">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'danger' | 'ok';
  children: ReactNode;
}) {
  const tones = {
    info: 'border-line-strong bg-lime/[0.06] text-cream',
    warn: 'border-warn/25 bg-warn/[0.07] text-warn',
    danger: 'border-danger/30 bg-danger/10 text-danger',
    ok: 'border-ok/25 bg-ok/[0.08] text-ok',
  } as const;

  const icons = {
    info: Info,
    warn: AlertTriangle,
    danger: AlertTriangle,
    ok: CheckCircle2,
  } as const;

  const Icon = icons[tone];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed',
        tones[tone],
      )}
    >
      <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Champs de formulaire                                                       */
/* -------------------------------------------------------------------------- */

const CONTROL =
  'w-full rounded-xl border border-line bg-ink px-3.5 text-[0.9375rem] text-cream ' +
  'placeholder:text-fg-subtle transition-colors duration-200 ' +
  'focus:border-lime focus:outline-none disabled:opacity-50 [color-scheme:dark]';

export function Label({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-baseline justify-between gap-3"
    >
      <span className="text-xs font-medium uppercase tracking-[0.1em] text-fg-subtle">
        {children}
      </span>
      {hint && <span className="text-[0.6875rem] text-fg-subtle/70">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(CONTROL, 'h-11', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea className={cn(CONTROL, 'resize-y py-2.5', className)} {...props} />
  );
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(CONTROL, 'h-11', className)} {...props} />;
}

export function Field({
  label,
  hint,
  help,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  help?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} hint={hint}>
        {label}
      </Label>
      {children}
      {help && (
        <p className="mt-1.5 text-xs leading-relaxed text-fg-subtle">{help}</p>
      )}
    </div>
  );
}

/** Interrupteur accessible : un vrai `button` avec `role="switch"`. */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium text-cream">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-fg-subtle">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-40',
          checked ? 'bg-lime' : 'bg-white/12',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-transform duration-300',
            checked ? 'translate-x-5.5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Boutons                                                                    */
/* -------------------------------------------------------------------------- */

type AdminButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const BUTTON_VARIANTS: Record<AdminButtonVariant, string> = {
  primary: 'bg-lime text-on-lime hover:bg-lime-glow',
  secondary: 'border border-line-strong text-cream hover:bg-white/5',
  danger: 'border border-danger/35 text-danger hover:bg-danger/10',
  ghost: 'text-fg-muted hover:bg-white/5 hover:text-cream',
};

export function AdminButton({
  variant = 'secondary',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ComponentProps<'button'> & {
  variant?: AdminButtonVariant;
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium',
        'transition-colors duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Notifications                                                              */
/* -------------------------------------------------------------------------- */

interface Toast {
  id: number;
  tone: 'ok' | 'danger' | 'info';
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast doit être utilisé dans <ToastProvider>.');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((tone: Toast['tone'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, tone, message }]);
    // Les erreurs restent plus longtemps : elles demandent une lecture.
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      tone === 'danger' ? 7000 : 3500,
    );
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('ok', message),
      error: (message) => push('danger', message),
      info: (message) => push('info', message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 p-4 sm:bottom-auto sm:right-0 sm:top-0 sm:items-end"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'danger' ? 'alert' : 'status'}
            className={cn(
              'animate-fade-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lift backdrop-blur-xl',
              toast.tone === 'ok' && 'border-ok/30 bg-ok/12 text-ok',
              toast.tone === 'danger' && 'border-danger/35 bg-danger/12 text-danger',
              toast.tone === 'info' && 'border-line-strong bg-elevated/90 text-cream',
            )}
          >
            <span className="min-w-0 flex-1 leading-relaxed">{toast.message}</span>
            <button
              type="button"
              onClick={() =>
                setToasts((current) =>
                  current.filter((item) => item.id !== toast.id),
                )
              }
              aria-label="Fermer la notification"
              className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Confirmation                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Confirmation avant une action destructrice.
 *
 * Le bouton doit être cliqué deux fois : le premier clic arme la confirmation
 * pendant 4 secondes. Plus rapide qu'une modale, et impossible à déclencher par
 * accident.
 */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = 'Confirmer ?',
  className,
  ...props
}: Omit<ComponentProps<'button'>, 'onClick'> & {
  onConfirm: () => void;
  confirmLabel?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <AdminButton
      variant="danger"
      className={cn(armed && 'bg-danger/15', className)}
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else {
          setArmed(true);
        }
      }}
      {...props}
    >
      {armed ? confirmLabel : children}
    </AdminButton>
  );
}
