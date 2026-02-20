import React, { useEffect, useMemo, useRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Copy, X } from 'lucide-react';
import { Note, clampPosition, useNotesStore } from '../stores/notesStore';

interface NoteCardProps {
  note: Note;
  isExiting: boolean;
}

// Inline SVG noise texture as data URI for a subtle frosted effect.
const noiseTextureUrl = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

const NoteCard: React.FC<NoteCardProps> = ({ note, isExiting }) => {
  const { removeNote, updateNote, updateNoteContent, bringToFront, searchQuery } = useNotesStore();
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (note.createdAt && Date.now() - note.createdAt < 1000) {
      const timer = setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus();
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(contentRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [note.createdAt]);

  const rotate = useTransform(dragX, [-200, 0, 200], [-3, 0, 3]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const latestText = contentRef.current?.textContent ?? note.content;
    updateNoteContent(note.id, latestText || '');
    removeNote(note.id);
  };

  const copyTextFallback = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const text = contentRef.current?.textContent ?? note.content;
    if (!text) return;

    updateNoteContent(note.id, text);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      copyTextFallback(text);
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const element = cardRef.current;
    const width = element?.offsetWidth ?? note.width;
    const height = element?.offsetHeight ?? note.height;
    const clamped = clampPosition(note.x + info.offset.x, note.y + info.offset.y, width, height);
    updateNote(note.id, { x: clamped.x, y: clamped.y });
    dragX.set(0);
    dragY.set(0);
  };

  const entryRotation = useMemo(() => (Math.random() - 0.5) * 8, []);
  const entryDelay = useMemo(() => Math.random() * 0.15, []);

  const isSearchMatch = !searchQuery || note.content.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <motion.div
      initial={{ y: -window.innerHeight * 0.5, opacity: 0, scale: 0.85, rotate: entryRotation * 3 }}
      animate={
        isExiting
          ? { y: -window.innerHeight * 0.5, opacity: 0, scale: 0.85, rotate: entryRotation * 3 }
          : { y: 0, opacity: 1, scale: 1, rotate: 0 }
      }
      exit={{
        y: -30,
        opacity: 0,
        scale: 0.86,
        rotate: entryRotation * 2,
        transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
      }}
      transition={
        isExiting
          ? { duration: 0.22, ease: [0.4, 0, 1, 1] }
          : {
            type: 'spring',
            stiffness: 200,
            damping: 18,
            mass: 0.8,
            delay: entryDelay,
          }
      }
      onMouseDownCapture={() => bringToFront(note.id)}
      style={{
        position: 'absolute',
        left: note.x,
        top: note.y,
        zIndex: note.zIndex ?? 10,
        pointerEvents: isExiting ? 'none' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <motion.div
        ref={cardRef}
        drag
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.03 }}
        style={{ x: dragX, y: dragY, rotate }}
        className="relative group"
      >
        <div
          className="absolute -inset-16 z-[-1] cursor-auto"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        />

        <div className="absolute -top-9  -right-0 flex items-center gap-1 z-30 bg-white/70 backdrop-blur-sm border border-black/5 shadow-sm rounded-md px-1 py-0.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity duration-150">
          <button
            onClick={handleCopy}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
            title="复制"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={handleDelete}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all"
            title="删除"
          >
            <X size={14} />
          </button>
        </div>
        <div
          className="relative rounded-lg shadow-xl flex flex-col cursor-move group"
          style={{
            backgroundColor: note.color,
            width: note.width,
            height: note.height,
            opacity: isSearchMatch ? 1 : 0.25,
            filter: isSearchMatch ? 'none' : 'grayscale(40%)',
            transition: 'opacity 0.3s ease, filter 0.3s ease',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none rounded-lg z-0"
            style={{ backgroundImage: noiseTextureUrl }}
          />

          <div
            className="flex-1 p-4 relative z-10 overflow-y-auto note-scrollbar"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
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
  );
};

export default NoteCard;
