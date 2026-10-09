import { useEffect, useState } from 'react';
import { AdminSaleOrder } from '../types/admin';
import { getAdminToken, getStoredSales } from '../utils/adminStore';

export function useAdminSales() {
  const [sales, setSales] = useState<AdminSaleOrder[]>(getStoredSales());
  const [remoteSales, setRemoteSales] = useState<AdminSaleOrder[]>([]);
  const [remoteError, setRemoteError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let controller: AbortController | undefined;
    const refresh = async () => {
      setSales(getStoredSales());
      controller?.abort();
      const current = new AbortController();
      controller = current;
      try {
        const response = await fetch('/api/admin/stripe-orders', {
          headers: { Authorization: `Bearer ${getAdminToken() || ''}` }, signal: current.signal,
        });
        if (response.status === 401) throw new Error('Vuelve a iniciar sesión para consultar los pagos de Stripe.');
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.orders)) throw new Error(data.error || 'No se pudieron consultar los pagos de Stripe.');
        if (current.signal.aborted) return;
        setRemoteSales(data.orders);
        setRemoteError('');
      } catch (error) {
        if (!current.signal.aborted) setRemoteError(error instanceof Error ? error.message : 'No se pudieron consultar los pagos de Stripe.');
      } finally {
        if (!current.signal.aborted) setLoading(false);
      }
    };
    const refreshVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    void refresh();
    const interval = window.setInterval(refreshVisible, 30000);
    window.addEventListener('mr_sales_updated', refreshVisible);
    window.addEventListener('focus', refreshVisible);
    document.addEventListener('visibilitychange', refreshVisible);
    return () => {
      controller?.abort();
      window.clearInterval(interval);
      window.removeEventListener('mr_sales_updated', refreshVisible);
      window.removeEventListener('focus', refreshVisible);
      document.removeEventListener('visibilitychange', refreshVisible);
    };
  }, []);

  // Only payments verified by the backend count as recorded sales.
  const orders = remoteSales;
  return { orders, sales, setSales, remoteSales, setRemoteSales, remoteError, setRemoteError, loading };
}
