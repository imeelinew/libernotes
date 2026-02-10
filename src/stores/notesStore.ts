import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Note {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  zIndex: number;
  createdAt?: number; // timestamp for auto-focus
}

interface NotesState {
  notes: Note[];
  isVisible: boolean;
  searchQuery: string;
  addNote: () => void;
  removeNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  updateNoteContent: (id: string, content: string) => void;
  bringToFront: (id: string) => void;
  clearAllNotes: () => void;
  setVisibility: (visible: boolean) => void;
  setSearchQuery: (query: string) => void;
  importNotes: (notes: Note[]) => void;
}

const colors = [
  '#fef3c7', // yellow
  '#fce7f3', // pink
  '#dbeafe', // blue
  '#d1fae5', // green
  '#e9d5ff', // purple
  '#fed7aa', // orange
];

const NOTE_DEFAULT_WIDTH = 250;
const NOTE_DEFAULT_HEIGHT = 280;
const MARGIN = 10;
const NOTE_GAP = 24;

/** Clamp position so the note stays fully within the viewport */
export const clampPosition = (
  x: number,
  y: number,
  noteWidth: number = NOTE_DEFAULT_WIDTH,
  noteHeight: number = NOTE_DEFAULT_HEIGHT
) => {
  const maxX = window.innerWidth - noteWidth - MARGIN;
  const maxY = window.innerHeight - noteHeight - MARGIN;
  return {
    x: Math.max(MARGIN, Math.min(x, maxX)),
    y: Math.max(MARGIN, Math.min(y, maxY)),
  };
};

/** Check if two rectangles overlap (with gap padding) */
const isOverlapping = (
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
  gap: number
): boolean => {
  return !(
    ax + aw + gap <= bx ||
    bx + bw + gap <= ax ||
    ay + ah + gap <= by ||
    by + bh + gap <= ay
  );
};

const getMaxZIndex = (notes: Note[]): number =>
  notes.reduce((max, n) => Math.max(max, n.zIndex ?? 10), 10);

/** Find a position that doesn't overlap with existing notes */
const findNonOverlappingPosition = (
  existingNotes: Note[],
  width: number,
  height: number
): { x: number; y: number } => {
  const titleBarOffset = 50;
  const maxX = window.innerWidth - width - MARGIN;
  const maxY = window.innerHeight - height - MARGIN;

  for (let attempt = 0; attempt < 100; attempt++) {
    const x = Math.random() * Math.max(0, maxX - MARGIN) + MARGIN;
    const y = Math.random() * Math.max(0, maxY - titleBarOffset) + titleBarOffset;
    const overlaps = existingNotes.some((note) =>
      isOverlapping(x, y, width, height, note.x, note.y, note.width, note.height, NOTE_GAP)
    );
    if (!overlaps) return { x, y };
  }

  const cols = Math.max(1, Math.floor((window.innerWidth - MARGIN * 2) / (width + NOTE_GAP)));
  const idx = existingNotes.length;
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  return clampPosition(
    MARGIN + col * (width + NOTE_GAP),
    titleBarOffset + row * (height + NOTE_GAP),
    width,
    height
  );
};

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      isVisible: false,
      searchQuery: '',

      addNote: () => {
        const { notes } = get();
        const zIndex = getMaxZIndex(notes) + 1;
        const { x, y } = findNonOverlappingPosition(notes, NOTE_DEFAULT_WIDTH, NOTE_DEFAULT_HEIGHT);
        const newNote: Note = {
          id: uuidv4(),
          content: '',
          x,
          y,
          width: NOTE_DEFAULT_WIDTH,
          height: NOTE_DEFAULT_HEIGHT,
          color: colors[Math.floor(Math.random() * colors.length)],
          zIndex,
          createdAt: Date.now(),
        };
        set((state) => ({
          notes: [...state.notes, newNote],
        }));
      },

      removeNote: (id: string) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
      },

      updateNote: (id: string, updates: Partial<Note>) => {
        set((state) => ({
          notes: state.notes.map((note) => {
            if (note.id !== id) return note;
            const updated = { ...note, ...updates };
            if (updates.x !== undefined || updates.y !== undefined) {
              const clamped = clampPosition(updated.x, updated.y, updated.width, updated.height);
              updated.x = clamped.x;
              updated.y = clamped.y;
            }
            return updated;
          }),
        }));
      },

      updateNoteContent: (id: string, content: string) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, content } : note
          ),
        }));
      },

      bringToFront: (id: string) => {
        const { notes } = get();
        const zIndex = getMaxZIndex(notes) + 1;
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, zIndex } : note
          ),
        }));
      },

      clearAllNotes: () => {
        set({ notes: [] });
      },

      setVisibility: (visible: boolean) => {
        set({ isVisible: visible });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      importNotes: (imported: Note[]) => {
        // Validate and sanitize imported notes
        const validNotes = imported
          .filter((n) => n.id && typeof n.content === 'string')
          .map((n) => ({
            id: n.id || uuidv4(),
            content: n.content || '',
            x: n.x ?? 100,
            y: n.y ?? 100,
            width: n.width ?? NOTE_DEFAULT_WIDTH,
            height: n.height ?? NOTE_DEFAULT_HEIGHT,
            color: n.color || colors[0],
            zIndex: n.zIndex ?? 10,
            createdAt: n.createdAt ?? 0, // Imported notes shouldn't autofocus
          }));
        set({ notes: validNotes });
      },
    }),
    {
      name: 'liber-notes-storage',
      partialize: (state) => ({ notes: state.notes }),
    }
  )
);
