import React, { useState, useEffect } from 'react';
import { Users, Shield, Edit2, UserCheck, UserX, Search, Clock, Key, Plus, Trash2, X } from 'lucide-react';

interface UserRecord {
  idUsuario: number;
  username: string;
  tableroAcceso: string; // 'admin' | 'editor' | 'reader'
  activo: boolean;
  fechaCreacion?: string;
}

interface UserManagementProps {
  token: string;
  currentUserId?: number;
}

export default function UserManagement({ token, currentUserId }: UserManagementProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Formulario de creación
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('reader');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cargar el listado de usuarios');
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const handleUpdateRole = async (userId: number, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tableroAcceso: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar el rol');
      
      // Update locally
      setUsers(prev => prev.map(u => u.idUsuario === userId ? { ...u, tableroAcceso: newRole } : u));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    if (userId === currentUserId) {
      alert('No puedes desactivar tu propia cuenta de administrador.');
      return;
    }

    setUpdatingId(userId);
    const nextStatus = !currentStatus;
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activo: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar estado del usuario');

      // Update locally
      setUsers(prev => prev.map(u => u.idUsuario === userId ? { ...u, activo: nextStatus } : u));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newRole) {
      setCreateError('Todos los campos son obligatorios.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear el usuario');
      
      // Actualizar listado
      fetchUsers();
      // Resetear inputs
      setNewUsername('');
      setNewPassword('');
      setNewRole('reader');
      setShowCreateForm(false);
    } catch (err: any) {
      setCreateError(err.message || 'Error al conectar con el servidor');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (userId === currentUserId) {
      alert('No puedes eliminar tu propia cuenta.');
      return;
    }
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario "${username}"?`)) {
      return;
    }
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar el usuario');
      
      // Actualizar localmente
      setUsers(prev => prev.filter(u => u.idUsuario !== userId));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el usuario');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-6 text-left">
      
      {/* Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Gestión de Usuarios y Accesos
          </h3>
          <p className="text-xs text-slate-450 dark:text-slate-500">
            Administra los usuarios registrados en el sistema, cambia sus niveles de acceso o inhabilita sus cuentas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-60">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-700 dark:text-slate-350 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition"
            />
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow shadow-blue-500/15 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            {showCreateForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            <span>{showCreateForm ? 'Cancelar' : 'Nuevo Usuario'}</span>
          </button>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateUser} className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-205 dark:border-slate-850 rounded-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
            <span className="text-xs font-bold text-slate-850 dark:text-slate-200">Crear Nuevo Colaborador</span>
            <button 
              type="button" 
              onClick={() => setShowCreateForm(false)}
              className="text-slate-450 hover:text-slate-750 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {createError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/40 rounded-xl text-rose-700 dark:text-rose-450 text-xs">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 mb-1">Nombre de Usuario</label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="ej: mzalazar"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 mb-1">Rol / Nivel de Acceso</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 dark:text-slate-350 font-semibold cursor-pointer"
              >
                <option value="reader">Lector (Solo ver)</option>
                <option value="editor">Editor (Editar indicadores)</option>
                <option value="admin">Administrador (Gestión total)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
            >
              {creating ? 'Guardando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/40 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
          <span className="h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Cargando listado de usuarios...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs italic">
          No se encontraron usuarios registrados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-955 border-b border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 text-left">Usuario</th>
                <th className="p-3 text-center">Nivel de Acceso</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Fecha de Registro</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u) => (
                <tr 
                  key={u.idUsuario} 
                  className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
                    !u.activo ? 'opacity-60 bg-slate-50/20 dark:bg-slate-950/10' : ''
                  }`}
                >
                  
                  {/* Column 1: Username & ID */}
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center uppercase shadow-sm">
                        {u.username.substring(0, 2)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                          {u.username}
                        </span>
                        <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono block">
                          ID: #{u.idUsuario} {u.idUsuario === currentUserId && '(Tú)'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Role selector */}
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center justify-center">
                      <div className="relative">
                        <select
                          value={u.tableroAcceso}
                          disabled={updatingId === u.idUsuario || u.idUsuario === currentUserId}
                          onChange={(e) => handleUpdateRole(u.idUsuario, e.target.value)}
                          className="pl-3.5 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer disabled:opacity-60"
                        >
                          <option value="admin">Administrador</option>
                          <option value="editor">Editor</option>
                          <option value="reader">Lector</option>
                        </select>
                        <Shield className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </td>

                  {/* Column 3: Active state badge */}
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      u.activo 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-450' 
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/45 dark:text-rose-450'
                    }`}>
                      {u.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>

                  {/* Column 4: Creation date */}
                  <td className="p-3 text-center text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {u.fechaCreacion 
                        ? new Date(u.fechaCreacion).toLocaleDateString('es-AR') 
                        : 'S/D'}
                    </div>
                  </td>

                  {/* Column 5: Action Buttons to disable/enable & delete */}
                  <td className="p-3 text-center flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(u.idUsuario, u.activo)}
                      disabled={updatingId === u.idUsuario || u.idUsuario === currentUserId}
                      className={`p-1.5 rounded-lg border transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1 text-[11px] font-bold ${
                        u.activo
                          ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-955/20'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-950/20'
                      }`}
                      title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                    >
                      {u.activo ? (
                        <>
                          <UserX className="h-3.5 w-3.5" />
                          <span>Suspender</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Habilitar</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteUser(u.idUsuario, u.username)}
                      disabled={updatingId === u.idUsuario || u.idUsuario === currentUserId}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-955/20 transition cursor-pointer disabled:opacity-50 inline-flex items-center"
                      title="Eliminar usuario permanentemente"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
