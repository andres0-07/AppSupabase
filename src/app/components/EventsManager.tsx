import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Calendar } from 'lucide-react';
import { fetchAllEvents, createEvent, updateEvent, deleteEvent } from '../../services/eventService';
import { useAuth } from '../../contexts/AuthContext';
import type { Event, PaymentStatus } from '../../types';

const EMPTY_FORM = {
  nombre_evento: '',
  fecha_evento: '',
  fecha_inscripcion: '',
  costo: '',
  status_pago: 'pendiente' as PaymentStatus,
  documento_url: '',
};

const STATUS_COLOR: Record<string, string> = {
  pendiente: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  pagado: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  cancelado: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export function EventsManager() {
  const { profile } = useAuth();
  const [events, setEvents]       = useState<Event[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [busyId, setBusyId]       = useState<string | null>(null);

  async function loadEvents() {
    try {
      const rows = await fetchAllEvents();
      setEvents(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando eventos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEvents(); }, []);

  function openCreate() {
    setEditingEvent(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  }

  function openEdit(event: Event) {
    setEditingEvent(event);
    setForm({
      nombre_evento:     event.nombre_evento,
      fecha_evento:      event.fecha_evento.slice(0, 10),
      fecha_inscripcion: event.fecha_inscripcion ? event.fecha_inscripcion.slice(0, 10) : '',
      costo:             event.costo ? String(event.costo) : '',
      status_pago:       event.status_pago,
      documento_url:     event.documento_url ?? '',
    });
    setFormError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.nombre_evento.trim() || !form.fecha_evento) {
      setFormError('Nombre y fecha del evento son obligatorios.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        nombre_evento:     form.nombre_evento.trim(),
        fecha_evento:      new Date(form.fecha_evento).toISOString(),
        fecha_inscripcion: form.fecha_inscripcion ? new Date(form.fecha_inscripcion).toISOString() : null,
        costo:             form.costo ? Number(form.costo) : null,
        status_pago:       form.status_pago,
        documento_url:     form.documento_url.trim() || null,
        created_by:        profile?.id ?? null,
      };
      if (editingEvent) {
        await updateEvent(editingEvent.id, payload);
      } else {
        await createEvent(payload);
      }
      setShowForm(false);
      await loadEvents();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error guardando evento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(eventId: string) {
    setBusyId(eventId);
    try {
      await deleteEvent(eventId);
      await loadEvents();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Cargando eventos...</p>;

  return (
    <div>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-400">{events.length} eventos registrados</p>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400">
          <Plus className="h-4 w-4" /> Nuevo evento
        </button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
          <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No hay eventos. Crea el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-white">{event.nombre_evento}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[event.status_pago]}`}>
                    {event.status_pago}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>Fecha: {new Date(event.fecha_evento).toLocaleDateString('es-CO')}</span>
                  {event.fecha_inscripcion && <span>Inscripcion: {new Date(event.fecha_inscripcion).toLocaleDateString('es-CO')}</span>}
                  {event.costo && <span>Costo: ${Number(event.costo).toLocaleString('es-CO')}</span>}
                </div>
                {event.documento_url && (
                  <a href={event.documento_url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">
                    Ver documento
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(event)} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-cyan-500 hover:text-cyan-400">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button disabled={busyId === event.id} onClick={() => handleDelete(event.id)} className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-red-500 hover:text-red-400 disabled:opacity-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold">{editingEvent ? 'Editar evento' : 'Nuevo evento'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Nombre del evento *</label>
                <input className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500" value={form.nombre_evento} onChange={(e) => setForm({ ...form, nombre_evento: e.target.value })} placeholder="Ej: Congreso de bioingenieria" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Fecha del evento *</label>
                  <input type="date" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500" value={form.fecha_evento} onChange={(e) => setForm({ ...form, fecha_evento: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Fecha de inscripcion</label>
                  <input type="date" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500" value={form.fecha_inscripcion} onChange={(e) => setForm({ ...form, fecha_inscripcion: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Costo</label>
                  <input type="number" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500" value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Estado de pago</label>
                  <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500" value={form.status_pago} onChange={(e) => setForm({ ...form, status_pago: e.target.value as PaymentStatus })}>
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">URL del documento</label>
                <input className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-cyan-500" value={form.documento_url} onChange={(e) => setForm({ ...form, documento_url: e.target.value })} placeholder="https://..." />
              </div>
              {formError && <p className="text-sm text-red-400">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
                  {saving ? 'Guardando...' : editingEvent ? 'Guardar cambios' : 'Crear evento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
