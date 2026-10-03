import React, { useState, useEffect } from 'react';
import { CustomerQuote } from '../../../types/admin';
import { getStoredQuotes, updateStoredQuoteStatus } from '../../../utils/adminStore';
import { Search, Phone, MapPin, X, Edit3, MessageSquare } from 'lucide-react';

export const CotizacionesTab: React.FC = () => {
  const [quotes, setQuotes] = useState<CustomerQuote[]>(getStoredQuotes());
  const [filterStatus, setFilterStatus] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQuote, setSelectedQuote] = useState<CustomerQuote | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<CustomerQuote['status']>('Nueva');

  useEffect(() => {
    const handleUpdate = () => {
      setQuotes(getStoredQuotes());
    };
    window.addEventListener('mr_quotes_updated', handleUpdate);
    return () => window.removeEventListener('mr_quotes_updated', handleUpdate);
  }, []);

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
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <span>Cotizaciones de Clientes</span>
            <span className="text-xs bg-blue-50 text-[#2563eb] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              {quotes.filter(q => q.status === 'Nueva').length} Nuevas
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
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
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563eb] shadow-2xs"
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
            className={`px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
              filterStatus === status
                ? 'bg-[#2563eb] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Quotes Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 font-medium">
            No se encontraron cotizaciones con ese criterio de búsqueda.
          </div>
        ) : (
          filtered.map((quote) => (
            <div
              key={quote.id}
              className="bg-white border border-slate-200 hover:border-blue-300 p-5 rounded-2xl transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {quote.folio}
                  </span>
                  <span className="font-bold text-sm text-slate-900">{quote.customerName}</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    quote.status === 'Nueva' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    quote.status === 'Contactada' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    quote.status === 'En Negociación' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                    quote.status === 'Cerrada' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {quote.status}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(quote.createdAt).toLocaleDateString('es-MX')}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap font-medium">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{quote.phone}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{quote.stateOrCity}</span>
                  </span>
                  <span className="text-slate-800 font-bold">
                    Giro: {quote.businessType}
                  </span>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 inline-block font-medium">
                  <span className="text-slate-500">Equipos de interés: </span>
                  <b className="text-slate-900">{quote.items.map(i => `${i.name} (${i.quantity})`).join(', ')}</b>
                </div>

                {quote.notes && (
                  <p className="text-[11px] text-slate-600 italic">
                    Nota: "{quote.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Estimado</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    ${quote.estimatedTotal.toLocaleString()} MXN
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/52${quote.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(quote.customerName)},%20te%20escribo%20de%20Maquinaria%20Renteria%20respecto%20a%20tu%20cotizaci%C3%B3n%20${quote.folio}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => handleOpenDetail(quote)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-xs space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Editar Cotización: {selectedQuote.folio}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Cliente: {selectedQuote.customerName} ({selectedQuote.phone})
                </p>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetail} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">
                  Estado de la Cotización
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="Nueva">Nueva</option>
                  <option value="Contactada">Contactada</option>
                  <option value="En Negociación">En Negociación</option>
                  <option value="Cerrada">Cerrada</option>
                  <option value="Descartada">Descartada</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wide mb-1">
                  Notas Internas de Seguimiento
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Detalles de la llamada con el cliente, dudas técnicas de masa, requerimientos de instalación eléctrica/gas..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-[#2563eb] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedQuote(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold uppercase tracking-wider shadow-md shadow-blue-500/20 cursor-pointer"
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
