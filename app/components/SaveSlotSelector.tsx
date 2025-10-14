'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SaveSlot {
  id: number;
  save_slot: number;
  save_name: string;
  character_name: string | null;
  level: number;
  location: string | null;
  last_save: string;
}

interface Props {
  onSelectSlot: (slotId: number) => void;
}

export default function SaveSlotSelector({ onSelectSlot }: Props) {
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaves();
  }, []);

  const loadSaves = async () => {
    try {
      const { data, error } = await supabase
        .from('rpg_saves')
        .select('*')
        .order('save_slot');

      if (error) throw error;
      setSaves(data || []);
    } catch (error) {
      console.error('Erreur chargement sauvegardes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.5em' }}>
          ⏳ Chargement des sauvegardes...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        
        {/* Titre */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '3em',
            margin: '0 0 10px 0',
            textShadow: '3px 3px 6px rgba(0,0,0,0.3)'
          }}>
            🐉 RPG FAIRY TAIL 🐉
          </h1>
          <p style={{
            color: 'white',
            fontSize: '1.3em',
            opacity: 0.9
          }}>
            Sélectionne une partie
          </p>
        </div>

        {/* Liste des sauvegardes */}
        <div style={{
          display: 'grid',
          gap: '20px'
        }}>
          {saves.map((save) => {
            const isEmpty = !save.character_name;
            
            return (
              <div
                key={save.id}
                onClick={() => onSelectSlot(save.save_slot)}
                style={{
                  background: 'white',
                  borderRadius: '15px',
                  padding: '25px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.borderColor = '#FF6B35';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(255,107,53,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  
                  {/* Info gauche */}
                  <div>
                    <h3 style={{
                      margin: '0 0 10px 0',
                      fontSize: '1.5em',
                      color: isEmpty ? '#94a3b8' : '#1e293b'
                    }}>
                      {isEmpty ? '📂' : '🎮'} Slot {save.save_slot}
                    </h3>
                    
                    {isEmpty ? (
                      <p style={{
                        margin: 0,
                        color: '#94a3b8',
                        fontSize: '1.1em'
                      }}>
                        Aucune sauvegarde - Cliquer pour commencer
                      </p>
                    ) : (
                      <>
                        <p style={{
                          margin: '5px 0',
                          fontSize: '1.2em',
                          color: '#FF6B35',
                          fontWeight: 'bold'
                        }}>
                          {save.character_name}
                        </p>
                        <p style={{
                          margin: '5px 0',
                          color: '#64748b'
                        }}>
                          📊 Niveau {save.level} | 📍 {save.location || 'Début de l\'aventure'}
                        </p>
                        <p style={{
                          margin: '5px 0',
                          fontSize: '0.9em',
                          color: '#94a3b8'
                        }}>
                          💾 Dernière sauvegarde : {formatDate(save.last_save)}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Bouton action */}
                  <div style={{
                    background: isEmpty ? '#e2e8f0' : '#FF6B35',
                    color: isEmpty ? '#64748b' : 'white',
                    padding: '15px 30px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '1.1em'
                  }}>
                    {isEmpty ? 'Nouvelle partie' : 'Continuer'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}