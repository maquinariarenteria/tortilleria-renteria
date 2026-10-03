import React, { useState } from 'react';
import { 
  CustomerQuote 
} from '../../../types/admin';
import { 
  getStoredQuotes, 
  updateStoredQuoteStatus 
} from '../../../utils/adminStore';
import { 
  Search, MessageSquare, Phone, Mail, MapPin, 
  Calendar, CheckCircle2, Clock, X, ChevronRight, Edit3, Send 
} from 'lucide-react';

export const CotizacionesTab: React.FC = () => {
  const [quotes, setQuotes] = useState<CustomerQuote[]>(getStoredQuotes());
  const [filterStatus, setFilterStatus] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQuote, setSelectedQuote] = useState<CustomerQuote | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<CustomerQuote['status']>('Nueva');

  const filtered = quotes.filter(q => {
    const matchesFilter = filterStatus === 'Todas' || q.status === filterStatus;
    const matchesQuery = 
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.phone.includes(searchQuery) ||
      q.folio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.stateOrCity.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const handleOpenDetail = (quote: CustomerQuote) => {
    setSelectedQuote(quote);
    setEditNotes(quote.notes || '');
    setEditStatus(quote.status);
  };

  const handleSaveDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;
    const updated = updateStoredQuoteStatus(selectedQuote.id, editStatus, editNotes);
    setQuotes(updated);
    setSelectedQuote(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-white max-w-7xl mx-auto">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Cotizaciones de Clientes</span>
            <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
              {quotes.filter(q => q.status === 'Nueva').length} Nuevas
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestiona prospectos interesados en maquinaria para tortillas de harina y maíz.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, teléfono, folio..."
            className="w-full bg-[#161a29] border border-[#272e45] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs select-none">
        {['Todas', 'Nueva', 'Contactada', 'En Negociación', 'Cerrada', 'Descartada'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
              filterStatus === status
                ? 'bg-[#6366f1] text-white'
                : 'bg-[#141826] text-slate-400 hover:text-slate-200 border border-[#202538]'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Quotes Table / Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-[#121520] border border-[#202538] rounded-xl text-xs text-slate-400">
            No se encontraron cotizaciones con ese criterio.
          </div>
        ) : (
          filtered.map((quote) => (
            <div
              key={quote.id}
              className="bg-[#121520] border border-[#202538] hover:border-purple-500/40 p-4 rounded-xl transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] text-purple-400 font-bold bg-[#1a1f33] px-2 py-0.5 rounded border border-purple-500/20">
                    {quote.folio}
                  </span>
                  <span className="font-semibold text-sm text-white">{quote.customerName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    quote.status === 'Nueva' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    quote.status === 'Contactada' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    quote.status === 'En Negociación' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    quote.status === 'Cerrada' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {quote.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{quote.phone}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{quote.stateOrCity}</span>
                  </span>
                  <span className="text-slate-300 font-medium">
                    Giro: {quote.businessType}
                  </span>
                </div>

                <div className="text-xs text-slate-300 bg-[#161a28] p-2.5 rounded-lg border border-[#22283e] inline-block">
                  <span className="text-slate-400">Equipos de interés: </span>
                  <b>{quote.items.map(i => `${i.name} (${i.quantity})`).join(', ')}</b>
                </div>

                {quote.notes && (
                  <p className="text-[11px] text-slate-400 italic">
                    Nota: "{quote.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#1c2133]">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Estimado</span>
                  <span className="text-sm font-bold text-emerald-400">
                    ${quote.estimatedTotal.toLocaleString()} MXN
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/52${quote.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(quote.customerName)},%20te%20escribo%20de%20Maquinaria%20Renteria%20respecto%20a%20tu%20cotizaci%C3%B3n%20${quote.folio}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => handleOpenDetail(quote)}
                    className="bg-[#1e2336] hover:bg-[#282f48] text-slate-200 border border-[#2d3652] text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Detalle</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail / Edit Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121520] border border-[#242b42] rounded-2xl w-full max-w-lg p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#202538] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Editar Cotización: {selectedQuote.folio}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cliente: {selectedQuote.customerName} ({selectedQuote.phone})
                </p>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetail} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Estado de la Cotización
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Nueva">Nueva</option>
                  <option value="Contactada">Contactada</option>
                  <option value="En Negociación">En Negociación</option>
                  <option value="Cerrada">Cerrada</option>
                  <option value="Descartada">Descartada</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Notas Internas de Seguimiento
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Detalles de la llamada, requerimientos técnicos, descuentos ofrecidos..."
                  className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuote(null)}
                  className="px-4 py-2 rounded-lg bg-[#181c2b] hover:bg-[#20263a] text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5255e3] text-white font-semibold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
