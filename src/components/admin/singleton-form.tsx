'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';

import { saveSingleton } from '@/lib/admin/client';
import { DAY_NAMES, cn } from '@/lib/utils';
import type {
  CallToAction,
  OpeningHour,
  SingletonKey,
  SingletonMap,
  StatItem,
} from '@/types/content';
import { MediaPicker } from './media-picker';
import {
  AdminButton,
  Card,
  Field,
  Input,
  Label,
  Select,
  Textarea,
  Toggle,
  useToast,
} from './ui';

/**
 * Formulaire déclaratif pour les blocs de contenu uniques.
 *
 * Les six pages d'édition de textes (réglages, hero, à propos, contact,
 * réservation, footer) décrivent leurs champs et partagent ce composant : une
 * seule implémentation de l'état, du bouton d'enregistrement, de la gestion
 * d'erreur et du rafraîchissement du site public.
 */

type BaseField = {
  name: string;
  label: string;
  help?: string;
  hint?: string;
  /** `2` occupe toute la largeur de la grille sur desktop. */
  span?: 1 | 2;
};

export type FieldDef = BaseField &
  (
    | { kind: 'text' | 'tel' | 'email' | 'url' | 'time'; placeholder?: string }
    | { kind: 'color' }
    | { kind: 'number'; min?: number; max?: number }
    | { kind: 'textarea'; rows?: number; placeholder?: string }
    | { kind: 'toggle'; description?: string }
    | {
        kind: 'media';
        accept: 'image' | 'video';
        folder: 'gallery' | 'videos' | 'menu' | 'content' | 'brand';
        aspect?: string;
      }
    | { kind: 'stringList'; itemLabel: string; max?: number; rows?: number }
    | { kind: 'stats'; max?: number }
    | { kind: 'cta' }
    | { kind: 'hours' }
  );

export interface FieldGroup {
  title: string;
  description?: string;
  fields: FieldDef[];
}

export function SingletonForm<K extends SingletonKey>({
  sectionKey,
  initial,
  groups,
}: {
  sectionKey: K;
  initial: SingletonMap[K];
  groups: FieldGroup[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [value, setValue] = useState<Record<string, unknown>>(
    () => ({ ...initial }) as Record<string, unknown>,
  );
  const [saved, setSaved] = useState<Record<string, unknown>>(
    () => ({ ...initial }) as Record<string, unknown>,
  );
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(value) !== JSON.stringify(saved),
    [value, saved],
  );

  const setField = useCallback((name: string, next: unknown) => {
    setValue((current) => ({ ...current, [name]: next }));
  }, []);

  async function onSave() {
    setSaving(true);
    try {
      // Le formulaire manipule un enregistrement générique ; la forme réelle
      // est garantie par le schéma Zod côté serveur, qui rejette toute clé
      // inconnue ou mal typée.
      const updated = await saveSingleton(
        sectionKey,
        value as unknown as SingletonMap[K],
      );
      const normalized = { ...updated } as Record<string, unknown>;
      setValue(normalized);
      setSaved(normalized);
      toast.success('Modifications enregistrées. Le site public est à jour.');
      // Rafraîchit les composants serveur : les compteurs et aperçus du
      // dashboard reflètent immédiatement la nouvelle valeur.
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Enregistrement impossible.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
      className="pb-24"
    >
      <div className="space-y-5">
        {groups.map((group) => (
          <Card
            key={group.title}
            title={group.title}
            description={group.description}
          >
            <div className="grid gap-5 md:grid-cols-2">
              {group.fields.map((field) => (
                <div
                  key={field.name}
                  className={cn(
                    (field.span ?? 1) === 2 || isWideField(field)
                      ? 'md:col-span-2'
                      : '',
                  )}
                >
                  <FieldRenderer
                    field={field}
                    value={value[field.name]}
                    onChange={(next) => setField(field.name, next)}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Barre d'action collée en bas — toujours atteignable au pouce. */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/92 backdrop-blur-xl lg:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="min-w-0 truncate text-xs text-fg-subtle">
            {dirty
              ? 'Modifications non enregistrées'
              : 'Tout est enregistré'}
          </p>

          <div className="flex shrink-0 gap-2">
            <AdminButton
              type="button"
              variant="ghost"
              disabled={!dirty || saving}
              onClick={() => setValue({ ...saved })}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Annuler</span>
            </AdminButton>

            <AdminButton
              type="submit"
              variant="primary"
              loading={saving}
              disabled={!dirty}
            >
              <Save className="h-4 w-4" />
              Enregistrer
            </AdminButton>
          </div>
        </div>
      </div>
    </form>
  );
}

/** Les champs complexes prennent toute la largeur sans avoir à le préciser. */
function isWideField(field: FieldDef): boolean {
  return (
    field.kind === 'textarea' ||
    field.kind === 'stringList' ||
    field.kind === 'stats' ||
    field.kind === 'hours' ||
    field.kind === 'media' ||
    field.kind === 'cta'
  );
}

/* -------------------------------------------------------------------------- */
/*  Rendu d'un champ                                                           */
/* -------------------------------------------------------------------------- */

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const id = `field-${field.name}`;

  switch (field.kind) {
    case 'toggle':
      return (
        <div className="rounded-xl border border-line bg-ink/50 px-4 py-3">
          <Toggle
            checked={Boolean(value)}
            onChange={onChange}
            label={field.label}
            description={field.description ?? field.help}
          />
        </div>
      );

    case 'textarea':
      return (
        <Field label={field.label} help={field.help} hint={field.hint} htmlFor={id}>
          <Textarea
            id={id}
            rows={field.rows ?? 4}
            value={String(value ?? '')}
            placeholder={field.placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
        </Field>
      );

    case 'number':
      return (
        <Field label={field.label} help={field.help} hint={field.hint} htmlFor={id}>
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={field.min}
            max={field.max}
            value={Number(value ?? 0)}
            onChange={(event) => onChange(Number(event.target.value))}
          />
        </Field>
      );

    case 'color':
      return (
        <Field label={field.label} help={field.help} hint={field.hint} htmlFor={id}>
          <div className="flex gap-2">
            <input
              id={id}
              type="color"
              value={String(value ?? '#000000')}
              onChange={(event) => onChange(event.target.value.toUpperCase())}
              className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-line bg-ink p-1"
            />
            <Input
              value={String(value ?? '')}
              onChange={(event) => onChange(event.target.value.toUpperCase())}
              aria-label={`${field.label} — code hexadécimal`}
              className="font-mono"
            />
          </div>
        </Field>
      );

    case 'media':
      return (
        <MediaPicker
          label={field.label}
          hint={field.hint}
          value={String(value ?? '')}
          onChange={onChange}
          accept={field.accept}
          folder={field.folder}
          aspect={field.aspect}
        />
      );

    case 'stringList':
      return (
        <StringListEditor
          label={field.label}
          help={field.help}
          itemLabel={field.itemLabel}
          rows={field.rows}
          max={field.max ?? 8}
          values={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
        />
      );

    case 'stats':
      return (
        <StatsEditor
          label={field.label}
          help={field.help}
          max={field.max ?? 6}
          values={Array.isArray(value) ? (value as StatItem[]) : []}
          onChange={onChange}
        />
      );

    case 'cta':
      return (
        <CtaEditor
          label={field.label}
          help={field.help}
          value={(value ?? { label: '', href: '', enabled: false }) as CallToAction}
          onChange={onChange}
        />
      );

    case 'hours':
      return (
        <HoursEditor
          label={field.label}
          help={field.help}
          values={Array.isArray(value) ? (value as OpeningHour[]) : []}
          onChange={onChange}
        />
      );

    default:
      return (
        <Field label={field.label} help={field.help} hint={field.hint} htmlFor={id}>
          <Input
            id={id}
            type={field.kind === 'time' ? 'time' : field.kind}
            value={String(value ?? '')}
            placeholder={'placeholder' in field ? field.placeholder : undefined}
            onChange={(event) => onChange(event.target.value)}
          />
        </Field>
      );
  }
}

/* -------------------------------------------------------------------------- */
/*  Éditeurs composés                                                          */
/* -------------------------------------------------------------------------- */

function StringListEditor({
  label,
  help,
  itemLabel,
  values,
  onChange,
  max,
  rows,
}: {
  label: string;
  help?: string;
  itemLabel: string;
  values: string[];
  onChange: (next: string[]) => void;
  max: number;
  rows?: number;
}) {
  return (
    <div>
      <Label hint={`${values.length}/${max}`}>{label}</Label>

      <div className="space-y-2">
        {values.map((item, index) => (
          <div key={index} className="flex gap-2">
            {rows ? (
              <Textarea
                rows={rows}
                value={item}
                aria-label={`${itemLabel} ${index + 1}`}
                onChange={(event) => {
                  const next = [...values];
                  next[index] = event.target.value;
                  onChange(next);
                }}
              />
            ) : (
              <Input
                value={item}
                aria-label={`${itemLabel} ${index + 1}`}
                onChange={(event) => {
                  const next = [...values];
                  next[index] = event.target.value;
                  onChange(next);
                }}
              />
            )}

            <AdminButton
              type="button"
              variant="danger"
              className="h-11 w-11 shrink-0 px-0"
              aria-label={`Supprimer ${itemLabel} ${index + 1}`}
              onClick={() => onChange(values.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </AdminButton>
          </div>
        ))}
      </div>

      {values.length < max && (
        <AdminButton
          type="button"
          className="mt-2"
          onClick={() => onChange([...values, ''])}
        >
          <Plus className="h-4 w-4" />
          Ajouter {itemLabel.toLowerCase()}
        </AdminButton>
      )}

      {help && <p className="mt-2 text-xs text-fg-subtle">{help}</p>}
    </div>
  );
}

function StatsEditor({
  label,
  help,
  values,
  onChange,
  max,
}: {
  label: string;
  help?: string;
  values: StatItem[];
  onChange: (next: StatItem[]) => void;
  max: number;
}) {
  return (
    <div>
      <Label hint={`${values.length}/${max}`}>{label}</Label>

      <div className="space-y-2">
        {values.map((stat, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={stat.value}
              placeholder="100%"
              aria-label={`Chiffre ${index + 1}`}
              className="w-28 shrink-0"
              onChange={(event) => {
                const next = [...values];
                next[index] = { ...stat, value: event.target.value };
                onChange(next);
              }}
            />
            <Input
              value={stat.label}
              placeholder="Café de spécialité"
              aria-label={`Libellé ${index + 1}`}
              onChange={(event) => {
                const next = [...values];
                next[index] = { ...stat, label: event.target.value };
                onChange(next);
              }}
            />
            <AdminButton
              type="button"
              variant="danger"
              className="h-11 w-11 shrink-0 px-0"
              aria-label={`Supprimer le chiffre ${index + 1}`}
              onClick={() => onChange(values.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </AdminButton>
          </div>
        ))}
      </div>

      {values.length < max && (
        <AdminButton
          type="button"
          className="mt-2"
          onClick={() => onChange([...values, { value: '', label: '' }])}
        >
          <Plus className="h-4 w-4" />
          Ajouter un chiffre
        </AdminButton>
      )}

      {help && <p className="mt-2 text-xs text-fg-subtle">{help}</p>}
    </div>
  );
}

function CtaEditor({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: CallToAction;
  onChange: (next: CallToAction) => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-ink/50 p-4">
      <Label>{label}</Label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          value={value.label}
          placeholder="Découvrir le menu"
          aria-label={`${label} — texte`}
          onChange={(event) => onChange({ ...value, label: event.target.value })}
        />
        <Input
          value={value.href}
          placeholder="#menu"
          aria-label={`${label} — lien`}
          onChange={(event) => onChange({ ...value, href: event.target.value })}
        />
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <Toggle
          checked={value.enabled}
          onChange={(enabled) => onChange({ ...value, enabled })}
          label="Afficher ce bouton"
        />
      </div>

      {help && <p className="mt-2 text-xs text-fg-subtle">{help}</p>}
    </div>
  );
}

function HoursEditor({
  label,
  help,
  values,
  onChange,
}: {
  label: string;
  help?: string;
  values: OpeningHour[];
  onChange: (next: OpeningHour[]) => void;
}) {
  // Lundi → dimanche : l'ordre de lecture usuel, pas l'index technique.
  const ordered = [1, 2, 3, 4, 5, 6, 0];

  function update(day: number, patch: Partial<OpeningHour>) {
    const exists = values.some((hour) => hour.day === day);
    const next = exists
      ? values.map((hour) => (hour.day === day ? { ...hour, ...patch } : hour))
      : [
          ...values,
          { day, open: '08:00', close: '23:00', closed: false, ...patch },
        ];
    onChange(next);
  }

  return (
    <div>
      <Label>{label}</Label>

      <div className="overflow-hidden rounded-xl border border-line">
        {ordered.map((day, index) => {
          const hour = values.find((item) => item.day === day) ?? {
            day,
            open: '08:00',
            close: '23:00',
            closed: false,
          };

          return (
            <div
              key={day}
              className={cn(
                'flex flex-wrap items-center gap-3 px-3 py-2.5',
                index > 0 && 'border-t border-line',
              )}
            >
              <span className="w-20 shrink-0 text-sm text-cream">
                {DAY_NAMES[day]}
              </span>

              <div className="flex flex-1 items-center gap-2">
                <Input
                  type="time"
                  value={hour.open}
                  disabled={hour.closed}
                  aria-label={`${DAY_NAMES[day]} — ouverture`}
                  className="h-10 w-28"
                  onChange={(event) => update(day, { open: event.target.value })}
                />
                <span className="text-fg-subtle" aria-hidden="true">
                  –
                </span>
                <Input
                  type="time"
                  value={hour.close}
                  disabled={hour.closed}
                  aria-label={`${DAY_NAMES[day]} — fermeture`}
                  className="h-10 w-28"
                  onChange={(event) => update(day, { close: event.target.value })}
                />
              </div>

              <Select
                value={hour.closed ? 'closed' : 'open'}
                aria-label={`${DAY_NAMES[day]} — statut`}
                className="h-10 w-28 shrink-0 text-sm"
                onChange={(event) =>
                  update(day, { closed: event.target.value === 'closed' })
                }
              >
                <option value="open">Ouvert</option>
                <option value="closed">Fermé</option>
              </Select>
            </div>
          );
        })}
      </div>

      {help && <p className="mt-2 text-xs text-fg-subtle">{help}</p>}
    </div>
  );
}
