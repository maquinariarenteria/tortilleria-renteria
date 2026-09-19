import React from 'react';

interface FloatingActionsProps {
  onOpenEmail: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({ onOpenEmail }) => {
  const whatsappUrl = "https://wa.me/526391141084?text=Hola,%20me%20comunico%20desde%20la%20web%20de%20Maquinaria%20Renteria%20para%20cotizar.";

  return (
    <aside
      aria-label="Contacto flotante"
      className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2.5 sm:gap-3 pointer-events-auto select-none"
      style={{
        paddingRight: 'max(0px, env(safe-area-inset-right))',
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
      }}
    >
      
      {/* 1. Email Button (White Logo, Perfectly Sized for Small Screens) */}
      <button
        onClick={onOpenEmail}
        className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#2563eb] text-white shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1 active:scale-95 transition-all duration-200 border-2 border-white"
        title="Enviar Correo Electrónico"
        aria-label="Enviar Correo Electrónico"
      >
        {/* Pure White Email Logo SVG */}
        <svg 
          className="w-5 h-5 sm:w-6 sm:h-6 fill-white transition-transform group-hover:scale-110 duration-200" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>

        {/* Hover Tooltip Label - only on desktop to never overflow mobile edge */}
        <span className="hidden lg:block absolute right-16 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md">
          Correo Electrónico
        </span>
      </button>

      {/* 2. Official WhatsApp Button (Identical Size & Border) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-1 active:scale-95 transition-all duration-200 border-2 border-white"
        title="Chat Oficial de WhatsApp"
        aria-label="Chat Oficial de WhatsApp"
      >
        {/* Official WhatsApp Logo SVG in White */}
        <svg 
          className="w-6 h-6 sm:w-7 sm:h-7 fill-white transition-transform group-hover:scale-110 duration-200" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.776.979-.951 1.18-.175.2-.35.225-.651.075-.3-.15-1.267-.467-2.414-1.489-.893-.796-1.496-1.78-1.671-2.08-.175-.301-.019-.464.132-.613.136-.134.301-.35.451-.526.151-.175.2-.301.301-.501.1-.2.05-.375-.025-.526-.075-.15-.675-1.628-.925-2.228-.243-.585-.49-.506-.675-.515-.175-.008-.375-.01-.576-.01s-.526.075-.802.375c-.275.3-1.052 1.028-1.052 2.508 0 1.479 1.077 2.908 1.228 3.109.15.2 2.119 3.235 5.132 4.538.717.31 1.277.495 1.713.633.72.229 1.376.196 1.895.119.578-.087 1.78-.727 2.031-1.429.25-.701.25-1.303.175-1.428-.075-.126-.275-.201-.576-.351zM12.04 2c-5.523 0-10 4.477-10 10 0 1.768.461 3.428 1.264 4.872l-1.344 4.908 5.039-1.322c1.401.764 3.003 1.202 4.704 1.202 5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18.277c-1.536 0-2.98-.415-4.228-1.137l-.303-.176-3.14.824.838-3.061-.194-.31c-.792-1.267-1.21-2.735-1.21-4.267 0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8.127-8 8.127z"/>
        </svg>

        {/* Hover Tooltip Label - only on desktop */}
        <span className="hidden lg:block absolute right-16 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md">
          WhatsApp Oficial
        </span>
      </a>

    </aside>
  );
};
