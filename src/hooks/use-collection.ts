'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  createRecord,
  deleteRecord,
  reorderRecords,
  updateRecord,
} from '@/lib/admin/client';
import { useToast } from '@/components/admin/ui';
import type { CollectionKey, CollectionMap } from '@/types/content';

/**
 * Gestion d'une collection depuis le dashboard.
 *
 * Le serveur reste la source de vérité : chaque opération attend la réponse de
 * l'API avant de mettre l'état à jour. Une erreur laisse donc l'écran
 * exactement dans l'état de la base, sans divergence à corriger.
 *
 * `router.refresh()` après chaque écriture réactualise les composants serveur
 * (compteurs du tableau de bord, aperçus), pendant que le site public est
 * invalidé côté API.
 */
export function useCollection<K extends CollectionKey>(
  key: K,
  initial: CollectionMap[K][],
) {
  type Row = CollectionMap[K];

  const [rows, setRows] = useState<Row[]>(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const report = useCallback(
    (error: unknown, fallback: string) => {
      toast.error(error instanceof Error ? error.message : fallback);
    },
    [toast],
  );

  const create = useCallback(
    async (data: Omit<Row, 'id'>): Promise<Row | null> => {
      setCreating(true);
      try {
        const created = await createRecord(key, data);
        setRows((current) => [...current, created]);
        toast.success('Élément ajouté.');
        router.refresh();
        return created;
      } catch (error) {
        report(error, 'Ajout impossible.');
        return null;
      } finally {
        setCreating(false);
      }
    },
    [key, report, router, toast],
  );

  const update = useCallback(
    async (id: string, patch: Partial<Row>, silent = false): Promise<boolean> => {
      setPendingId(id);
      try {
        const updated = await updateRecord(key, id, patch);
        setRows((current) =>
          current.map((row) => ((row as { id: string }).id === id ? updated : row)),
        );
        if (!silent) toast.success('Modification enregistrée.');
        router.refresh();
        return true;
      } catch (error) {
        report(error, 'Modification impossible.');
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [key, report, router, toast],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setPendingId(id);
      try {
        await deleteRecord(key, id);
        setRows((current) =>
          current.filter((row) => (row as { id: string }).id !== id),
        );
        toast.success('Élément supprimé.');
        router.refresh();
        return true;
      } catch (error) {
        report(error, 'Suppression impossible.');
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [key, report, router, toast],
  );

  /** Déplace un élément d'un cran et persiste le nouvel ordre complet. */
  const move = useCallback(
    async (id: string, direction: -1 | 1): Promise<void> => {
      const index = rows.findIndex((row) => (row as { id: string }).id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= rows.length) return;

      const next = [...rows];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved!);

      // Réordonnancement optimiste : le mouvement doit être instantané à l'œil.
      const previous = rows;
      setRows(
        next.map((row, position) => ({ ...row, position: position + 1 }) as Row),
      );
      setPendingId(id);

      try {
        await reorderRecords(
          key,
          next.map((row) => (row as { id: string }).id),
        );
        router.refresh();
      } catch (error) {
        setRows(previous);
        report(error, 'Réordonnancement impossible.');
      } finally {
        setPendingId(null);
      }
    },
    [key, report, rows, router],
  );

  return { rows, setRows, create, update, remove, move, pendingId, creating };
}
