import { useModalFocus } from '../hooks/useModalFocus';
import { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { recordABConversion } from '../utils/adminStore';

type PaymentStatus = { status: string; folio: string; currency: 'MXN' | 'USD'; paymentType: 'full'; amountPaid: number; balanceDue: number };
export function StripePaymentResult({ onPaid }: { onPaid?: () => void }) {
  const [reference] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    return { payment: params.get('payment'), sessionId: params.get('session_id'), token: fragment.get('stripe_token') || params.get('token') };
  });
  const [result, setResult] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [visible, setVisible] = useState(!!reference.payment);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const modalRef = useModalFocus(visible, () => setVisible(false));
  const copyFolio = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.folio);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
  };
  useEffect(() => {
    if (!reference.payment) return;
    // Remove the private return token before the customer visits other links.
    const current = new URL(window.location.href);
    ['payment', 'session_id', 'token'].forEach(key => current.searchParams.delete(key));
    if (current.hash.startsWith('#stripe_token=')) current.hash = '';
    window.history.replaceState(null, '', current.pathname + current.search + current.hash);
    if (reference.payment !== 'success') return;
    if (!reference.sessionId || !reference.token) {
      setError('No encontramos la referencia del pago. Contacta al asesor.');
      return;
    }
    const controller = new AbortController();
    setError('');
    fetch('/api/stripe/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: reference.sessionId, token: reference.token }), signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo verificar el pago.');
        setResult(data);
        if (data.status === 'paid') {
          sessionStorage.removeItem('mr_stripe_cart');
          sessionStorage.removeItem('mr_cart');
          onPaid?.();
          const key = `mr_stripe_conversion_${reference.sessionId}`;
          if (!sessionStorage.getItem(key)) { recordABConversion('B'); sessionStorage.setItem(key, '1'); }
        }
      })
      .catch(error => { if (error.name !== 'AbortError') setError(error.message || 'No se pudo verificar el pago.'); });
    return () => controller.abort();
  }, [reference, retry]);
  if (!visible) return null;
  const paid = result?.status === 'paid';
  return <div ref={modalRef} className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="stripe-result-title">
    <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 text-slate-900">
      <h2 id="stripe-result-title" className="text-xl font-bold">{reference.payment === 'cancel' ? 'Pago cancelado' : paid ? 'Pago completo confirmado' : 'Verificación del pago'}</h2>
      {reference.payment === 'cancel' ? <p>Tu carrito está disponible para volver a intentar el pago. Si llegaste a completar un cobro, contacta al asesor para verificarlo.</p> : <>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {!result && !error && <p role="status">Estamos consultando el estado de tu pago…</p>}
        {result && <div className="space-y-2 text-sm">
          <p className="break-all">Folio: <strong className="select-all">{result.folio}</strong></p>
          <button type="button" onClick={copyFolio} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            {copyStatus === 'copied' ? 'Código copiado' : 'Copiar código'}
          </button>
          <p role="status" aria-live="polite" className={copyStatus === 'error' ? 'text-red-700' : 'text-green-700'}>
            {copyStatus === 'copied' ? 'Folio copiado al portapapeles.' : copyStatus === 'error' ? 'No se pudo copiar automáticamente. Selecciona el folio para copiarlo.' : ''}
          </p>
          {paid ? <><p>Pagado: <strong>{formatCurrency(result.amountPaid, result.currency)} {result.currency}</strong></p>
            <p>Contacta al asesor con este folio para acordar el flete y la entrega.</p></>
            : <p>Estado: {result.status === 'failed' ? 'Pago fallido' : result.status === 'expired' ? 'Sesión expirada' : 'Pendiente de confirmación'}. El pedido se registra como pagado únicamente al verificarlo con Stripe.</p>}
        </div>}
        {!paid && <button className="bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={() => setRetry(value => value + 1)}>Volver a verificar</button>}
      </>}
      <button className="bg-slate-100 px-4 py-2 rounded-lg" onClick={() => setVisible(false)}>Cerrar</button>
    </div>
  </div>;
}
