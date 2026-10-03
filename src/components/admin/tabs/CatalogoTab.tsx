import React, { useState } from 'react';
import { MachineProduct, MachineCategory, EnergyType, Model3DType } from '../../../types';
import { 
  getStoredMachines, 
  updateStoredMachine, 
  addStoredMachine, 
  deleteStoredMachine 
} from '../../../utils/adminStore';
import { AdminService } from '../../../services/adminService';
import { 
  Wrench, Plus, Edit3, Trash2, Upload, 
  Star, Sparkles, X 
} from 'lucide-react';

export const CatalogoTab: React.FC = () => {
  const [machines, setMachines] = useState<MachineProduct[]>(getStoredMachines());
  const [editingMachine, setEditingMachine] = useState<MachineProduct | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isUploadingR2, setIsUploadingR2] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenEdit = (machine: MachineProduct) => {
    setEditingMachine({ ...machine });
    setIsNew(false);
  };

  const handleOpenCreate = () => {
    const newMachine: MachineProduct = {
      id: `maquina_${Date.now()}`,
      name: '',
      sku: `MR-${Math.floor(100 + Math.random() * 900)}`,
      category: 'prensas',
      modelType: 'press',
      priceUSD: 4500,
      priceMXN: 85000,
      capacityPerHour: 1200,
      diameterRange: '12 cm - 28 cm',
      energyType: 'Gas LP',
      motorPowerHP: '1.5 HP',
      dimensionsMeters: '1.40m x 0.80m x 1.30m',
      weightKg: 280,
      warrantyYears: 1,
      badge: 'Nuevo Modelo 2026',
      featured: false,
      shortDescription: 'Maquinaria de alta eficiencia para tortillas de harina y maíz.',
      fullDescription: 'Construcción en acero inoxidable de grado alimenticio.',
      features: ['Acero inoxidable', 'Calibrador de grosor', 'Garantía 1 año'],
      specs: [
        { label: 'Dimensiones', value: '1.40m x 0.80m x 1.30m' },
        { label: 'Garantía', value: '1 año' }
      ],
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    };
    setEditingMachine(newMachine);
    setIsNew(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingMachine) return;

    setIsUploadingR2(true);
    showToast('Subiendo imagen a Cloudflare R2...');

    const res = await AdminService.uploadImageToR2(file);
    setIsUploadingR2(false);

    if (res.success && res.url) {
      setEditingMachine({ ...editingMachine, imageUrl: res.url });
      showToast('Imagen vinculada exitosamente.');
    } else {
      showToast(res.error || 'Error al subir la imagen.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMachine || !editingMachine.name.trim()) {
      showToast('El nombre de la máquina es obligatorio.');
      return;
    }

    if (isNew) {
      const updated = addStoredMachine(editingMachine);
      setMachines(updated);
      showToast('¡Máquina agregada exitosamente al catálogo!');
    } else {
      const updated = updateStoredMachine(editingMachine.id, editingMachine);
      setMachines(updated);
      showToast('¡Máquina actualizada exitosamente!');
    }

    setEditingMachine(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta máquina del catálogo?')) {
      const updated = deleteStoredMachine(id);
      setMachines(updated);
      showToast('Máquina eliminada.');
    }
  };

  const handleToggleFeatured = (machine: MachineProduct) => {
    const updated = updateStoredMachine(machine.id, { featured: !machine.featured });
    setMachines(updated);
    showToast(`Máquina ${!machine.featured ? 'destacada' : 'retirada'} en página de inicio.`);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-white max-w-7xl mx-auto">
      
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#1c2237] border border-purple-500/50 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Catálogo de Maquinaria</span>
            <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
              {machines.length} Modelos
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Administra precios, fotos alojadas en Cloudflare R2, fichas técnicas y modelos destacados.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#6366f1] hover:bg-[#5255e3] active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Máquina</span>
        </button>
      </div>

      {/* Machines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {machines.map((m) => (
          <div
            key={m.id}
            className="bg-[#121520] border border-[#202538] hover:border-purple-500/40 rounded-xl overflow-hidden shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              {/* Image Preview with badge */}
              <div className="relative h-44 bg-[#0a0c14] overflow-hidden">
                <img
                  src={m.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'}
                  alt={m.name}
                  className="w-full h-full object-cover object-center"
                />
                {m.badge && (
                  <span className="absolute top-2.5 left-2.5 bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    {m.badge}
                  </span>
                )}
                <button
                  onClick={() => handleToggleFeatured(m)}
                  className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-sm transition-colors cursor-pointer ${
                    m.featured ? 'bg-amber-500 text-white' : 'bg-black/60 text-slate-300 hover:text-amber-400'
                  }`}
                  title={m.featured ? 'Destacada en inicio' : 'Destacar en inicio'}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-white line-clamp-1">{m.name}</h3>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-[#191d2c] px-2 py-0.5 rounded border border-[#262c42]">
                    {m.category}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {m.shortDescription}
                </p>

                <div className="bg-[#161a28] p-2.5 rounded-lg border border-[#22283e] text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Capacidad:</span>
                    <b>{m.capacityPerHour.toLocaleString()} tortillas/hr</b>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Energía:</span>
                    <span>{m.energyType}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-baseline justify-between border-t border-[#1c2032]">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Precio Lista</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      ${m.priceMXN.toLocaleString()} MXN
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    ${m.priceUSD.toLocaleString()} USD
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 bg-[#0f111a] border-t border-[#1a1f30] flex items-center justify-between text-xs">
              <button
                onClick={() => handleOpenEdit(m)}
                className="bg-[#1a1f30] hover:bg-[#252c42] text-slate-200 border border-[#2d354e] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                <span>Editar Ficha</span>
              </button>
              <button
                onClick={() => handleDelete(m.id)}
                className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition-colors cursor-pointer"
                title="Eliminar del catálogo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {editingMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#121520] border border-[#242b42] rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-xs space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#202538] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isNew ? 'Nueva Máquina en Catálogo' : `Editar: ${editingMachine.name}`}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Las imágenes se vinculan con Cloudflare R2 (almacenamiento masivo sin costo de ancho de banda).
                </p>
              </div>
              <button onClick={() => setEditingMachine(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Image Preview & Upload */}
              <div className="bg-[#161a29] border border-[#252c42] p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={editingMachine.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg border border-[#2b334e] bg-black"
                />
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <span className="font-semibold text-white block">Imagen Principal de la Máquina</span>
                  <p className="text-[11px] text-slate-400">
                    Sube una foto clara (JPG, PNG, WebP). En Cloudflare se aloja en el bucket <code className="text-purple-300">MEDIA_BUCKET</code>.
                  </p>
                  <label className="inline-flex items-center gap-1.5 bg-[#6366f1] hover:bg-[#5255e3] text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingR2 ? 'Subiendo a R2...' : 'Seleccionar archivo local'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre del Modelo</label>
                  <input
                    type="text"
                    required
                    value={editingMachine.name}
                    onChange={(e) => setEditingMachine({ ...editingMachine, name: e.target.value })}
                    placeholder="Ej. Rodillo Doble Industrial 2026"
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoría</label>
                  <select
                    value={editingMachine.category}
                    onChange={(e) => setEditingMachine({ ...editingMachine, category: e.target.value as MachineCategory })}
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="prensas">Prensas para Tortillas</option>
                    <option value="hornos">Hornos Térmicos</option>
                    <option value="lineas-completas">Líneas Completas</option>
                    <option value="amasadoras-boleadoras">Amasadoras y Boleadoras</option>
                    <option value="comales-rotativos">Comales Rotativos</option>
                    <option value="enfriadores">Enfriadores</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descripción Breve</label>
                <input
                  type="text"
                  value={editingMachine.shortDescription}
                  onChange={(e) => setEditingMachine({ ...editingMachine, shortDescription: e.target.value })}
                  placeholder="Ej. El estándar de oro para taquerías y fábricas"
                  className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Precio MXN</label>
                  <input
                    type="number"
                    required
                    value={editingMachine.priceMXN}
                    onChange={(e) => setEditingMachine({ ...editingMachine, priceMXN: Number(e.target.value) })}
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Precio USD</label>
                  <input
                    type="number"
                    required
                    value={editingMachine.priceUSD}
                    onChange={(e) => setEditingMachine({ ...editingMachine, priceUSD: Number(e.target.value) })}
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Etiqueta Badge</label>
                  <input
                    type="text"
                    value={editingMachine.badge || ''}
                    onChange={(e) => setEditingMachine({ ...editingMachine, badge: e.target.value })}
                    placeholder="Ej. Más Vendida"
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Technical specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Capacidad (tortillas/hora)</label>
                  <input
                    type="number"
                    value={editingMachine.capacityPerHour}
                    onChange={(e) => setEditingMachine({ ...editingMachine, capacityPerHour: Number(e.target.value) })}
                    placeholder="Ej. 1200"
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Energía</label>
                  <select
                    value={editingMachine.energyType}
                    onChange={(e) => setEditingMachine({ ...editingMachine, energyType: e.target.value as EnergyType })}
                    className="w-full bg-[#181c2b] border border-[#2a3047] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Gas LP">Gas LP</option>
                    <option value="Gas Natural">Gas Natural</option>
                    <option value="Eléctrica 110V">Eléctrica 110V</option>
                    <option value="Eléctrica 220V">Eléctrica 220V</option>
                    <option value="Trifásica 440V">Trifásica 440V</option>
                    <option value="Dual (Gas LP + Eléctrica 110V)">Dual (Gas LP + Eléctrica 110V)</option>
                    <option value="Manual (Sin electricidad)">Manual (Sin electricidad)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={!!editingMachine.featured}
                  onChange={(e) => setEditingMachine({ ...editingMachine, featured: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="featuredCheck" className="text-slate-300 cursor-pointer">
                  Mostrar como modelo destacado en la página de inicio
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#202538]">
                <button
                  type="button"
                  onClick={() => setEditingMachine(null)}
                  className="px-4 py-2 rounded-lg bg-[#181c2b] hover:bg-[#20263a] text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5255e3] text-white font-semibold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Guardar en Catálogo
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
