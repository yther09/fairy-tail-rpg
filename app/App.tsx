"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatKitPanel, type FactAction } from "@/components/ChatKitPanel";
import { useColorScheme } from "@/hooks/useColorScheme";
import { createClient } from '@supabase/supabase-js';
import SaveSlotSelector from './components/SaveSlotSelector';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function App() {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [characterName, setCharacterName] = useState<string>('');
  const [showNameInput, setShowNameInput] = useState(false);
  const { scheme, setScheme } = useColorScheme();

  // Sauvegarde automatique
  useEffect(() => {
    if (!selectedSlot) return;

    const saveGame = async () => {
      try {
        const now = new Date();
        await supabase
          .from('rpg_saves')
          .update({ 
            game_state: { 
              last_activity: now.toISOString(),
              playing: true 
            },
            last_save: now.toISOString()
          })
          .eq('save_slot', selectedSlot);
        
        console.log(`✅ Partie ${selectedSlot} sauvegardée à`, now.toLocaleTimeString('fr-FR'));
      } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
      }
    };

    saveGame();
    const interval = setInterval(saveGame, 30000);
    return () => clearInterval(interval);
  }, [selectedSlot]);

  const handleSelectSlot = async (slotNumber: number) => {
    // Vérifier si le slot est vide
    const { data } = await supabase
      .from('rpg_saves')
      .select('character_name')
      .eq('save_slot', slotNumber)
      .single();

    if (!data?.character_name) {
      // Nouvelle partie : demander le nom
      setSelectedSlot(slotNumber);
      setShowNameInput(true);
    } else {
      // Continuer une partie existante
      setSelectedSlot(slotNumber);
    }
  };

  const handleStartNewGame = async () => {
    if (!characterName.trim() || !selectedSlot) return;

    try {
      await supabase
        .from('rpg_saves')
        .update({
          character_name: characterName,
          save_name: `Aventure de ${characterName}`,
          location: 'Magnolia - Devant la guilde',
          level: 1
        })
        .eq('save_slot', selectedSlot);

      setShowNameInput(false);
    } catch (error) {
      console.error('Erreur création personnage:', error);
    }
  };

  const handleBackToMenu = () => {
    setSelectedSlot(null);
    setShowNameInput(false);
    setCharacterName('');
  };

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

  // Écran de sélection de slot
  if (!selectedSlot) {
    return <SaveSlotSelector onSelectSlot={handleSelectSlot} />;
  }

  // Écran de création de personnage
  if (showNameInput) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{
            textAlign: 'center',
            color: '#FF6B35',
            fontSize: '2em',
            marginBottom: '10px'
          }}>
            🐉 Nouvelle Aventure
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#64748b',
            marginBottom: '30px'
          }}>
            Quel est le nom de ton mage ?
          </p>
          
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Ex: Natsu, Lucy, Gray..."
            maxLength={20}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '1.2em',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              marginBottom: '20px',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#FF6B35'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && characterName.trim()) {
                handleStartNewGame();
              }
            }}
          />

          <div style={{
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={handleBackToMenu}
              style={{
                flex: 1,
                padding: '15px',
                background: '#e2e8f0',
                color: '#64748b',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1.1em',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Retour
            </button>
            
            <button
              onClick={handleStartNewGame}
              disabled={!characterName.trim()}
              style={{
                flex: 2,
                padding: '15px',
                background: characterName.trim() ? '#FF6B35' : '#cbd5e1',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1.1em',
                fontWeight: 'bold',
                cursor: characterName.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Commencer l'aventure ! 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Jeu principal
  return (
    <main className="flex min-h-screen flex-col items-center justify-end bg-slate-100 dark:bg-slate-950">
      
      {/* Bouton retour menu */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={handleBackToMenu}
          style={{
            padding: '10px 20px',
            background: '#FF6B35',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(255,107,53,0.3)'
          }}
        >
          ← Menu
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