import React, { useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useNotesStore, Note, clampPosition } from '../stores/notesStore';

interface NoteCardProps {
  note: Note;
  isExiting: boolean;
}

// Inline SVG noise texture as data URI — resolution-independent frosted/matte effect
const noiseTextureUrl = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

const NoteCard: React.FC<NoteCardProps> = ({ note, isExiting }) => {
  const { removeNote, updateNote, updateNoteContent, bringToFront, searchQuery } = useNotesStore();
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-focus new notes (created within last 1s)
  useEffect(() => {
    if (note.createdAt && Date.now() - note.createdAt < 1000) {
      // Small delay to ensure animation doesn't eat focus
      const timer = setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus();
          // Move cursor to end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(contentRef.current);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [note.createdAt]);

  // Dynamic rotation based on drag direction: left → tilt left, right → tilt right
  const rotate = useTransform(dragX, [-200, 0, 200], [-3, 0, 3]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    removeNote(note.id);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const el = cardRef.current;
    const w = el?.offsetWidth ?? note.width;
    const h = el?.offsetHeight ?? note.height;
    const clamped = clampPosition(note.x + info.offset.x, note.y + info.offset.y, w, h);
    updateNote(note.id, { x: clamped.x, y: clamped.y });
    dragX.set(0);
    dragY.set(0);
  };

  const screenCenter = useMemo(() => window.innerWidth / 2, []);
  const isLeftSide = note.x + 125 < screenCenter;
  const offscreenX = isLeftSide ? -(note.x + 450) : window.innerWidth - note.x + 50;

  // Search dimming
  const isSearchMatch = !searchQuery || note.content.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key={note.id}
          initial={{ x: offscreenX, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: offscreenX, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          // Capture phase fires before any child's stopPropagation
          onMouseDownCapture={() => bringToFront(note.id)}
          style={{
            position: 'absolute',
            left: note.x,
            top: note.y,
            zIndex: note.zIndex ?? 10,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Drag wrapper */}
          <motion.div
            ref={cardRef}
            drag
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.03 }}
            style={{ x: dragX, y: dragY, rotate }}
          >
            {/* Buffer zone to prevent accidental background clicks */}
            <div 
              className="absolute -inset-16 z-[-1] cursor-auto"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            />
            <div
              className="relative rounded-lg shadow-xl flex flex-col cursor-move"
              style={{
                backgroundColor: note.color,
                width: note.width,
                height: note.height,
                opacity: isSearchMatch ? 1 : 0.25,
                filter: isSearchMatch ? 'none' : 'grayscale(40%)',
                transition: 'opacity 0.3s ease, filter 0.3s ease',
              }}
            >


              {/* Frosted / matte paper texture overlay */}
              <div
                className="absolute inset-0 pointer-events-none rounded-lg z-0"
                style={{ backgroundImage: noiseTextureUrl }}
              />

              {/* Delete button — only visible on self-hover */}
              <button
                onClick={handleDelete}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-1.5 right-2 w-6 h-6 flex items-center justify-center rounded-full text-transparent hover:text-gray-600 hover:bg-black/10 transition-all z-20 text-sm font-bold"
              >
                ×
              </button>

              {/* Content Container */}
              <div
                className="flex-1 p-4 relative z-10 overflow-y-auto note-scrollbar"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div
                  ref={contentRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="outline-none text-gray-800 text-base leading-relaxed whitespace-pre-wrap cursor-text min-h-full"
                  onBlur={(e) => {
                    updateNoteContent(note.id, e.currentTarget.textContent || '');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.currentTarget.blur();
                    }
                  }}
                >
                  {note.content}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NoteCard;
