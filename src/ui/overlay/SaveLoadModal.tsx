import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from '../shared/Modal';
import { readSlot, writeSlot, loadFromSlot, clearSlot } from '../../systems/save/SaveManager';
import type { SaveSlot } from '../../utils/storage';
import type { SaveData } from '../../types/game';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Highlighted intent — the header hint only; every slot exposes all actions. */
  mode?: 'save' | 'load';
  /** Called after a slot is successfully loaded into the live stores. */
  onLoaded?: () => void;
}

const SLOTS: { id: SaveSlot; label: string }[] = [
  { id: 'auto', label: 'Auto Save' },
  { id: 'manual1', label: 'Manual 1' },
  { id: 'manual2', label: 'Manual 2' },
];

function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isOpen,
  onClose,
  mode = 'load',
  onLoaded,
}) => {
  const [slots, setSlots] = useState<Record<SaveSlot, SaveData | null>>({
    auto: null,
    manual1: null,
    manual2: null,
  });

  const refresh = useCallback(() => {
    setSlots({
      auto: readSlot('auto'),
      manual1: readSlot('manual1'),
      manual2: readSlot('manual2'),
    });
  }, []);

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  const handleSave = useCallback(
    (slot: SaveSlot) => {
      const existing = slots[slot];
      if (existing && !window.confirm(`Overwrite ${slot} save?`)) return;
      writeSlot(slot);
      refresh();
    },
    [slots, refresh]
  );

  const handleLoad = useCallback(
    (slot: SaveSlot) => {
      if (!slots[slot]) return;
      if (loadFromSlot(slot)) {
        onLoaded?.();
        onClose();
      }
    },
    [slots, onLoaded, onClose]
  );

  const handleDelete = useCallback(
    (slot: SaveSlot) => {
      if (!slots[slot]) return;
      if (!window.confirm(`Delete this save? This cannot be undone.`)) return;
      clearSlot(slot);
      refresh();
    },
    [slots, refresh]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'save' ? 'Save Game' : 'Load Game'}
      size="md"
    >
      <div className="flex flex-col gap-3">
        {SLOTS.map(({ id, label }) => {
          const data = slots[id];
          return (
            <div
              key={id}
              className="bg-slate-900 rounded-lg border border-slate-700 p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-white font-semibold">{label}</p>
                {data ? (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Day {data.game.day} · Phase {data.game.phase} ·{' '}
                    <span className="capitalize">{data.game.difficulty}</span>
                    <br />
                    Saved {formatTimestamp(data.updatedAt)}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-0.5 italic">Empty slot</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleSave(id)}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => handleLoad(id)}
                  disabled={!data}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  Load
                </button>
                <button
                  onClick={() => handleDelete(id)}
                  disabled={!data}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-red-600/80 hover:bg-red-500 text-white transition-colors disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
