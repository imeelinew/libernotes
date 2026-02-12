import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotesStore } from './stores/notesStore';
import NoteCard from './components/NoteCard';
import { Plus, Trash2, Search, Download, Upload, Undo2 } from 'lucide-react';

const HIDE_ANIMATION_MS = 260;

function App() {
  const {
    notes, addNote, clearAllNotes, isVisible, setVisibility,
    searchQuery, setSearchQuery, importNotes,
    undoDelete, canUndoDelete, resetDeleteHistory,
  } = useNotesStore();
  const [isExiting, setIsExiting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onShowNotes(() => {
        setIsExiting(false);
        setVisibility(true);
      });

      window.electronAPI.onHideNotes(() => {
        setIsExiting(true);
        setTimeout(() => {
          setVisibility(false);
          setSearchQuery('');
          resetDeleteHistory();
        }, HIDE_ANIMATION_MS);
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('show-notes');
        window.electronAPI.removeAllListeners('hide-notes');
      }
    };
  }, [setVisibility, setSearchQuery, resetDeleteHistory]);

  useEffect(() => {
    if (notes.length === 0 && isVisible && !hasInitialized.current) {
      hasInitialized.current = true;
      addNote();
    }
  }, [isVisible, notes.length, addNote]);

  const handleClearAll = () => {
    clearAllNotes();
    setShowConfirm(false);
  };

  const handleExport = () => {
    const data = JSON.stringify(notes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'liber-notes-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (Array.isArray(data)) {
            importNotes(data);
          }
        } catch {
          // Invalid JSON — ignore
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!isVisible) {
    return null;
  }

  const pillStyle = 'bg-white/90 backdrop-blur-md shadow-md rounded-full select-none';
  const btnStyle = 'w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:text-gray-800 hover:bg-black/10 transition-all';

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      {/* Background overlay — fades independently */}
      <AnimatePresence>
        {!isExiting && (
          <motion.div
            className="absolute inset-0 bg-black/15 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
            }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => window.electronAPI?.hideWindow()}
          />
        )}
      </AnimatePresence>
      {/* Title Bar */}
      <AnimatePresence>
        {!isExiting && (
          <motion.div
            className="fixed top-3 left-1/2 z-50"
            initial={{ y: -50, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{
              y: -40,
              x: '-50%',
              opacity: 0,
              transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className={`${pillStyle} px-5 py-1.5 text-sm font-semibold text-gray-700 tracking-wide`}>
              LiberNotes
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes */}
      <div className="relative w-full h-full pointer-events-none">
        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-gray-400/50 text-xl font-medium select-none text-center">
              <p>暂无便签</p>
              <p className="text-sm mt-2 opacity-75">点击底栏 + 号新建</p>
            </div>
          </div>
        )}
        <AnimatePresence>
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isExiting={isExiting}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Toolbar */}
      <AnimatePresence>
        {!isExiting && (
          <motion.div
            className="fixed bottom-4 left-1/2 z-50"
            initial={{ y: 60, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{
              y: 42,
              x: '-50%',
              opacity: 0,
              transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className={`${pillStyle} px-3 py-1.5 flex items-center gap-1.5`}>
              {/* Search */}
              <div className="flex items-center gap-1 px-1">
                <Search size={15} className="text-gray-600 shrink-0" />
                <input
                  type="text"
                  placeholder="搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 w-20 focus:w-32 transition-all"
                />
              </div>

              <div className="w-px h-5 bg-gray-200" />

              {/* Import / Export */}
              <button onClick={handleImport} className={btnStyle} title="导入">
                <Upload size={16} />
              </button>
              <button onClick={handleExport} className={btnStyle} title="导出">
                <Download size={16} />
              </button>

              <div className="w-px h-5 bg-gray-200" />

              {/* Delete all + Add */}
              <button
                onClick={undoDelete}
                disabled={!canUndoDelete}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                  canUndoDelete
                    ? 'text-gray-600 hover:text-amber-500 hover:bg-amber-50'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="撤回删除"
              >
                <Undo2 size={16} />
              </button>
              {notes.length > 0 && (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={addNote}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:text-blue-500 hover:bg-blue-50 transition-all"
              >
                <Plus size={18} />
              </button>

              <div className="w-px h-5 bg-gray-200" />
              <span className="text-xs text-gray-600 px-1.5 whitespace-nowrap">双击 Ctrl 以关闭</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div
              className="absolute inset-0 backdrop-blur-sm"
              initial={{ opacity: 0, backgroundColor: 'rgba(0, 0, 0, 0)' }}
              animate={{
                opacity: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.32)',
                transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
              }}
              exit={{
                opacity: 0,
                backgroundColor: 'rgba(0, 0, 0, 0)',
                transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
              }}
              onClick={() => setShowConfirm(false)}
            />
            <motion.div
              className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4 text-center relative z-10"
              initial={{ scale: 0.96, y: 10, opacity: 0 }}
              animate={{
                scale: 1,
                y: 0,
                opacity: 1,
                transition: {
                  type: 'spring',
                  stiffness: 450,
                  damping: 32,
                  mass: 0.85,
                  delay: 0.04,
                },
              }}
              exit={{
                scale: 0.98,
                y: 8,
                opacity: 0,
                transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
              }}
            >
              <p className="text-gray-800 text-lg font-medium mb-2">删除全部便签？</p>
              <p className="text-gray-500 text-sm mb-6">此操作不可撤销</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-medium"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
