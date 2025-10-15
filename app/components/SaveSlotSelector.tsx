"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type SaveSlot = {
  id: number;
  save_slot: number;
  save_name: string | null;
  character_name: string | null;
  level: number | null;
  location: string | null;
  last_save: string | null;
};

type SaveSlotSelectorProps = {
  supabase: SupabaseClient;
  onSelectSlot: (slotId: number) => void;
};

export default function SaveSlotSelector({
  supabase,
  onSelectSlot,
}: SaveSlotSelectorProps) {
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const orderedSaves = useMemo(
    () =>
      [...saves].sort(
        (left, right) =>
          (left.save_slot ?? 0) - (right.save_slot ?? 0)
      ),
    [saves]
  );

  const loadSaves = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("rpg_saves")
        .select(
          "id, save_slot, save_name, character_name, level, location, last_save"
        )
        .order("save_slot");

      if (fetchError) {
        throw fetchError;
      }

      setSaves(data ?? []);
    } catch (fetchError) {
      console.error("[save-slot] failed to load saves", fetchError);
      setError("Impossible de récupérer les sauvegardes pour le moment.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadSaves();
  }, [loadSaves]);

  const handleDelete = useCallback(
    async (slotNumber: number) => {
      const confirmed = window.confirm(
        `Supprimer définitivement la sauvegarde du slot ${slotNumber} ?`
      );
      if (!confirmed) {
        return;
      }

      setError(null);

      try {
        const resetPayload = {
          character_name: null,
          level: 1,
          location: null,
          conversation_history: null,
          game_state: null,
          last_save: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from("rpg_saves")
          .update(resetPayload)
          .eq("save_slot", slotNumber);

        if (updateError) {
          throw updateError;
        }

        await loadSaves();
      } catch (updateError) {
        console.error("[save-slot] failed to delete slot", updateError);
        setError("La suppression a échoué. Réessayez plus tard.");
      }
    },
    [loadSaves, supabase]
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-700 p-6">
          <div className="rounded-xl bg-white/20 px-6 py-4 text-lg font-semibold text-white backdrop-blur">
            Chargement des sauvegardes...
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-700 px-5 py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <header className="flex items-center justify-between text-white">
            <div>
              <h1 className="text-3xl font-bold">Choisis ta sauvegarde</h1>
              <p className="mt-1 text-sm text-indigo-100">
                Chaque slot correspond à une aventure différente. Sélectionne
                un slot vide pour commencer une nouvelle partie.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadSaves()}
              className="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
              disabled={isRefreshing}
            >
              {isRefreshing ? "Actualisation..." : "Actualiser"}
            </button>
          </header>

          {error && (
            <div className="rounded-lg border border-red-300 bg-white/90 px-4 py-3 text-sm font-medium text-red-600 shadow">
              {error}
            </div>
          )}

          <ul className="grid gap-4 md:grid-cols-2">
            {orderedSaves.map((save) => {
              const isEmpty = !save.character_name;

              return (
                <li key={save.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSlot(save.save_slot)}
                    className="group flex w-full flex-col rounded-2xl bg-white p-6 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Slot {save.save_slot}
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-900">
                          {isEmpty ? "Nouvelle partie" : save.save_name ?? "Aventure en cours"}
                        </h2>
                      </div>
                      {!isEmpty && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDelete(save.save_slot);
                          }}
                          className="rounded-md bg-red-500 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-600"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      {isEmpty ? (
                        <p>Commence une nouvelle histoire dans ce slot.</p>
                      ) : (
                        <>
                          <p>
                            Personnage :{" "}
                            <span className="font-semibold text-slate-800">
                              {save.character_name}
                            </span>
                          </p>
                          <p>
                            Niveau :{" "}
                            <span className="font-semibold text-slate-800">
                              {save.level ?? 1}
                            </span>
                          </p>
                          <p>
                            Lieu :{" "}
                            <span className="font-semibold text-slate-800">
                              {save.location ?? "Début de l'aventure"}
                            </span>
                          </p>
                          <p className="text-xs text-slate-400">
                            Dernière sauvegarde :{" "}
                            {save.last_save
                              ? formatDate(save.last_save)
                              : "inconnue"}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="mt-6 rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition group-hover:bg-orange-500 group-hover:text-white">
                      {isEmpty ? "Commencer une nouvelle aventure" : "Continuer"}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  };

  return renderContent();
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "inconnue";
  }
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
