"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { ChatKitPanel, type FactAction } from "@/components/ChatKitPanel";
import { useColorScheme } from "@/hooks/useColorScheme";
import SaveSlotSelector from "./components/SaveSlotSelector";
import { getSupabaseClient } from "@/lib/supabaseClient";

const AUTOSAVE_INTERVAL_MS = 30_000;

async function persistAutosave(
  client: SupabaseClient,
  slotId: number
): Promise<void> {
  const now = new Date().toISOString();
  await client
    .from("rpg_saves")
    .update({
      game_state: {
        last_activity: now,
        playing: true,
      },
      last_save: now,
    })
    .eq("save_slot", slotId);
}

export default function App() {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [characterName, setCharacterName] = useState<string>("");
  const [showNameInput, setShowNameInput] = useState(false);
  const { scheme, setScheme } = useColorScheme();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const supabaseUnavailable = !supabase;

  useEffect(() => {
    if (!selectedSlot || !supabase) {
      return;
    }

    let cancelled = false;

    const runAutosave = async () => {
      try {
        await persistAutosave(supabase, selectedSlot);
        if (process.env.NODE_ENV !== "production") {
          console.debug(
            "[autosave]",
            `slot ${selectedSlot} saved at ${new Date().toLocaleTimeString("fr-FR")}`
          );
        }
      } catch (error) {
        console.error("[autosave] failed to persist progress", error);
      }
    };

    void runAutosave();
    const interval = setInterval(() => {
      if (!cancelled) {
        void runAutosave();
      }
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedSlot, supabase]);

  const handleSelectSlot = useCallback(
    async (slotNumber: number) => {
      if (!supabase) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from("rpg_saves")
          .select("character_name")
          .eq("save_slot", slotNumber)
          .single();

        if (error) {
          handleSupabaseError("Failed to load save slot", error);
          return;
        }

        if (!data?.character_name) {
          setSelectedSlot(slotNumber);
          setShowNameInput(true);
        } else {
          setSelectedSlot(slotNumber);
        }
      } catch (error) {
        console.error("[save-slot] unexpected error", error);
      }
    },
    [supabase]
  );

  const handleStartNewGame = useCallback(async () => {
    if (!characterName.trim() || !selectedSlot || !supabase) {
      return;
    }

    try {
      const { error } = await supabase
        .from("rpg_saves")
        .update({
          character_name: characterName.trim(),
          save_name: `Aventure de ${characterName.trim()}`,
          location: "Magnolia - Devant la guilde",
          level: 1,
        })
        .eq("save_slot", selectedSlot);

      if (error) {
        handleSupabaseError("Failed to create character", error);
        return;
      }

      setShowNameInput(false);
    } catch (error) {
      console.error("[new-game] unexpected error", error);
    }
  }, [characterName, selectedSlot, supabase]);

  const handleBackToMenu = useCallback(() => {
    setSelectedSlot(null);
    setShowNameInput(false);
    setCharacterName("");
  }, []);

  const handleWidgetAction = useCallback(async (action: FactAction) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[ChatKitPanel] widget action", action);
    }
  }, []);

  const handleResponseEnd = useCallback(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[ChatKitPanel] response end");
    }
  }, []);

  if (supabaseUnavailable) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6 text-center dark:bg-slate-950">
        <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <h1 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Supabase configuration required
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Set the environment variables{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            to enable save slots and game progress.
          </p>
        </div>
      </main>
    );
  }

  if (!supabase) {
    return null;
  }

  if (!selectedSlot) {
    return (
      <SaveSlotSelector
        supabase={supabase}
        onSelectSlot={handleSelectSlot}
      />
    );
  }

  if (showNameInput) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-700 p-5">
        <div className="w-full max-w-xl rounded-2xl bg-white p-10 shadow-2xl">
          <h2 className="text-center text-3xl font-semibold text-orange-500">
            Nouvelle aventure
          </h2>
          <p className="mt-3 text-center text-slate-500">
            Quel est le nom de ton mage ?
          </p>
          <input
            type="text"
            value={characterName}
            onChange={(event) => setCharacterName(event.target.value)}
            placeholder="Ex: Natsu, Lucy, Gray..."
            maxLength={20}
            className="mt-8 w-full rounded-lg border-2 border-slate-200 p-4 text-lg outline-none focus:border-orange-500"
            onKeyDown={(event) => {
              if (event.key === "Enter" && characterName.trim()) {
                void handleStartNewGame();
              }
            }}
          />
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleBackToMenu}
              className="flex-1 rounded-lg bg-slate-200 px-4 py-3 text-lg font-semibold text-slate-600 transition hover:bg-slate-300"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={() => void handleStartNewGame()}
              disabled={!characterName.trim()}
              className="flex-[1.5] rounded-lg bg-orange-500 px-4 py-3 text-lg font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Commencer l&apos;aventure
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-end bg-slate-100 dark:bg-slate-950">
      <div className="fixed left-5 top-5 z-50">
        <button
          type="button"
          onClick={handleBackToMenu}
          className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white shadow-md transition hover:bg-orange-600"
        >
          Retour au menu
        </button>
      </div>
      <div className="mx-auto w-full max-w-5xl">
        <ChatKitPanel
          theme={scheme}
          onWidgetAction={handleWidgetAction}
          onResponseEnd={handleResponseEnd}
          onThemeRequest={setScheme}
        />
      </div>
    </main>
  );
}

function handleSupabaseError(message: string, error: PostgrestError): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[supabase] ${message}`, error);
  }
}
