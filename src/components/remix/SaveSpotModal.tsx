import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FolderPlus, Folder, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface SaveSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  spotId: string | null;
}

export const SaveSpotModal: React.FC<SaveSpotModalProps> = ({ isOpen, onClose, spotId }) => {
  const { session } = useAuth();
  const [folders, setFolders] = useState<any[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && session?.user?.id) {
      fetchFolders();
    }
  }, [isOpen, session?.user?.id]);

  const fetchFolders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('remix_folders')
      .select('*')
      .eq('user_id', session?.user?.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setFolders(data);
    }
    setIsLoading(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !session?.user?.id) return;
    setIsSaving(true);
    const { data, error } = await supabase
      .from('remix_folders')
      .insert({ user_id: session.user.id, name: newFolderName.trim() })
      .select()
      .single();
    
    if (!error && data) {
      setFolders([data, ...folders]);
      setNewFolderName('');
      await handleSaveToFolder(data.id);
    } else {
      setIsSaving(false);
    }
  };

  const handleSaveToFolder = async (folderId: string) => {
    if (!spotId) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('saved_spots')
      .insert({ folder_id: folderId, spot_id: spotId });
    
    if (error && error.code !== '23505') { // Ignore unique violation if already saved
      console.error('Error saving spot', error);
    }
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-zinc-100 flex flex-col max-h-[80vh]"
        >
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-2xl font-display font-bold text-[#0A192F]">Save to Remix Folder</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-500">
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-2 mb-6 shrink-0">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name..."
              className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400"
            />
            <button
              onClick={handleCreateFolder}
              disabled={isSaving || !newFolderName.trim()}
              className="px-6 py-3 bg-[#0A192F] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <FolderPlus size={18} />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-orange-500" size={24} />
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 font-bold uppercase tracking-widest text-xs">
                No folders yet. Create one above!
              </div>
            ) : (
              <div className="space-y-2">
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => handleSaveToFolder(folder.id)}
                    disabled={isSaving}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Folder size={20} />
                      </div>
                      <span className="font-bold text-[#0A192F]">{folder.name}</span>
                    </div>
                    <Check size={20} className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
