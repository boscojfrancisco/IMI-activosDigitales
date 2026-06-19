import React, { useState, useEffect } from 'react';
import { Organismo } from '../types';
import { X, Save, History, Loader2, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup, User } from 'firebase/auth';

interface OrganismoEditModalProps {
  organismo: Organismo;
  onClose: () => void;
  onSaved: (updated: Organismo) => void;
}

export default function OrganismoEditModal({ organismo, onClose, onSaved }: OrganismoEditModalProps) {
  const [formData, setFormData] = useState<Partial<Organismo>>(organismo);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'history'>('edit');
  const [historyDocs, setHistoryDocs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && user && organismo.id) {
      loadHistory();
    }
  }, [activeTab, user]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/organismos/${organismo.id}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryDocs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (e) {
      console.error('Login failed', e);
    }
  };

  const handleChange = (field: keyof Organismo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !organismo.id) return;
    
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/organismos/${organismo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      onSaved(updated);
    } catch (e) {
      console.error(e);
      alert('Error updating. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {organismo.nombre}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user ? (
          <div className="p-8 flex flex-col items-center justify-center flex-1">
            <LogIn className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">Requiere Autenticación</h3>
            <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
              Necesitas iniciar sesión para editar los indicadores de este organismo y guardar el historial de cambios.
            </p>
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-sm"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <>
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-2">
              <button 
                onClick={() => setActiveTab('edit')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === 'edit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Editar Indicadores
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <History className="w-4 h-4" />
                Historial
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === 'edit' ? (
                <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-1 md:col-span-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.tieneWeb} 
                          onChange={(e) => handleChange('tieneWeb', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sitio Web Oficial</span>
                      </label>
                      {formData.tieneWeb && (
                        <input 
                          type="url" 
                          placeholder="Ej: https://..." 
                          value={formData.enlaceWeb || ''} 
                          onChange={(e) => handleChange('enlaceWeb', e.target.value)} 
                          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-2" 
                        />
                      )}
                    </div>

                    <div className="space-y-2 col-span-1 md:col-span-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.tieneWebPropia} 
                          onChange={(e) => handleChange('tieneWebPropia', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dominio Propio / Web Propia</span>
                      </label>
                      {formData.tieneWebPropia && (
                        <input 
                          type="url" 
                          placeholder="Ej: https://..." 
                          value={formData.enlaceWebPropia || ''} 
                          onChange={(e) => handleChange('enlaceWebPropia', e.target.value)} 
                          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-2" 
                        />
                      )}
                    </div>

                    <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                      <span className="text-xs font-semibold text-slate-500 ml-1">Guía de Trámites</span>
                      <select 
                        value={formData.guiaTramites}
                        onChange={(e) => handleChange('guiaTramites', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Tiene">Tiene</option>
                        <option value="No">No</option>
                      </select>
                      {formData.guiaTramites === 'Tiene' && (
                        <input 
                          type="url" 
                          placeholder="Enlace Guía (Ej: https://...)" 
                          value={formData.enlaceGuia || ''} 
                          onChange={(e) => handleChange('enlaceGuia', e.target.value)} 
                          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-2" 
                        />
                      )}
                    </div>

                    <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                      <span className="text-xs font-semibold text-slate-500 ml-1">Trámites Online</span>
                      <select 
                        value={formData.tramitesOnline}
                        onChange={(e) => handleChange('tramitesOnline', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Tiene">Tiene</option>
                        <option value="No">No</option>
                      </select>
                      {formData.tramitesOnline === 'Tiene' && (
                        <input 
                          type="url" 
                          placeholder="Enlace Trámites (Ej: https://...)" 
                          value={formData.enlaceTramitesOnline || ''} 
                          onChange={(e) => handleChange('enlaceTramitesOnline', e.target.value)} 
                          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-2" 
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500 ml-1">Turnos Online</span>
                      <select 
                        value={formData.turnosOnline}
                        onChange={(e) => handleChange('turnosOnline', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Tiene">Tiene</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500 ml-1">Expediente Digital</span>
                      <select 
                        value={formData.expedienteDigital}
                        onChange={(e) => handleChange('expedienteDigital', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Tiene">Tiene</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition">
                      <input 
                        type="checkbox" 
                        checked={formData.usaIA} 
                        onChange={(e) => handleChange('usaIA', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Usa IA</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition">
                      <input 
                        type="checkbox" 
                        checked={formData.chatbot} 
                        onChange={(e) => handleChange('chatbot', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tiene Chatbot</span>
                    </label>

                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {loadingHistory ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                  ) : historyDocs.length === 0 ? (
                     <div className="text-center p-8 text-slate-500 text-sm">No hay cambios registrados todavía.</div>
                  ) : (
                    <div className="space-y-3">
                      {historyDocs.map((doc, idx) => (
                        <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-900">
                          <div className="flex justify-between items-center mb-2">
                             <span className="font-medium text-slate-700 dark:text-slate-300">Modificación</span>
                             <span className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-950 p-2 rounded overflow-x-auto">
                            {doc.snapshot}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {activeTab === 'edit' && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  form="edit-form"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Cambios
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
