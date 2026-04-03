import { useEffect, useState } from "react";
import { Calendar, DollarSign, FileText, Clock } from "lucide-react";
import { fetchAllEvents } from "../../services/eventService";
import type { Event } from "../../types";

const STATUS_COLOR: Record<string, string> = {
  pendiente: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  pagado: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  cancelado: "text-red-400 bg-red-500/10 border-red-500/30",
};

export function EventsPanel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllEvents()
      .then(setEvents)
      .catch((err) => setError(err instanceof Error ? err.message : "Error cargando eventos"))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = events.filter((e) => new Date(e.fecha_evento) >= new Date());
  const past = events.filter((e) => new Date(e.fecha_evento) < new Date());

  if (loading) return <p className="text-sm text-slate-400">Cargando eventos...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  function EventCard({ event }: { event: Event }) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold text-white">{event.nombre_evento}</p>
          <span className={"shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium " + STATUS_COLOR[event.status_pago]}>
            {event.status_pago}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(event.fecha_evento).toLocaleDateString("es-CO")}
          </span>
          {event.fecha_inscripcion && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Inscripcion: {new Date(event.fecha_inscripcion).toLocaleDateString("es-CO")}
            </span>
          )}
          {event.costo && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {Number(event.costo).toLocaleString("es-CO")}
            </span>
          )}
        </div>
        {event.documento_url && (
          <a
            href={event.documento_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-cyan-400 hover:underline"
          >
            <FileText className="h-3 w-3" /> Ver documento
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-cyan-400">Proximos eventos</p>
        {upcoming.length === 0
          ? <p className="text-xs text-slate-600">No hay eventos proximos.</p>
          : <div className="space-y-3">{upcoming.map((e) => <EventCard key={e.id} event={e} />)}</div>}
      </div>
      {past.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-slate-500">Eventos pasados</p>
          <div className="space-y-3 opacity-60">{past.map((e) => <EventCard key={e.id} event={e} />)}</div>
        </div>
      )}
    </div>
  );
}
