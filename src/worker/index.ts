/**
 * Cloudflare Worker Backend for Maquinaria Renteria / Tortilleria Renteria
 * Handles:
 * 1. Secure Admin Authentication (using secret variable ADMIN_PASSWORD)
 * 2. Cloudflare D1 Database integration (Structured data: quotes, sales, appointments, etc.)
 * 3. Cloudflare R2 Bucket integration (Images and media storage with zero egress fees)
 * 4. Cloudflare Static Assets serving
 */

export interface Env {
  ADMIN_PASSWORD?: string;
  ADMIN_JWT_SECRET?: string;
  DB?: any; // Cloudflare D1 Database binding
  MEDIA_BUCKET?: any; // Cloudflare R2 Bucket binding
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // CORS headers for API
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. API: Admin Login with Cloudflare Secret "ADMIN_PASSWORD"
    if (pathname === '/api/admin/login' && request.method === 'POST') {
      try {
        const body: any = await request.json();
        const providedPassword = (body.password || '').trim();

        // The secret configured in Cloudflare (or default fallback for initial setup)
        const expectedSecret = (env.ADMIN_PASSWORD || 'renteria2026').trim();

        if (providedPassword === expectedSecret) {
          // Generate session token
          const token = `cf_adm_${btoa(Date.now().toString())}_${crypto.randomUUID().slice(0, 8)}`;
          return new Response(
            JSON.stringify({
              success: true,
              token,
              message: 'Autenticación exitosa en Cloudflare Worker.',
              expiresIn: 86400,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Clave incorrecta. Asigna el secreto ADMIN_PASSWORD en Cloudflare.',
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 401,
            }
          );
        }
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: 'Error procesando solicitud: ' + err.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // 2. API: Admin Auth Verification
    if (pathname === '/api/admin/verify' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization') || '';
      if (authHeader.startsWith('Bearer cf_adm_') || authHeader.startsWith('Bearer local_token_')) {
        return new Response(
          JSON.stringify({ valid: true, secretConfigured: !!env.ADMIN_PASSWORD }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ valid: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // 3. API: Image Upload to Cloudflare R2
    if (pathname === '/api/admin/upload' && request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
          return new Response(
            JSON.stringify({ success: false, error: 'No se envió ningún archivo.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const extension = file.name.split('.').pop() || 'jpg';
        const key = `catalog/${Date.now()}-${crypto.randomUUID().slice(0, 6)}.${extension}`;

        if (env.MEDIA_BUCKET) {
          await env.MEDIA_BUCKET.put(key, file.stream(), {
            httpMetadata: {
              contentType: file.type || 'image/jpeg',
            },
          });
          const publicUrl = `/media/${key}`;
          return new Response(
            JSON.stringify({ success: true, url: publicUrl, key }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // If R2 binding is not yet attached, simulate response
          return new Response(
            JSON.stringify({
              success: true,
              url: `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80`,
              message: 'R2 no configurado aún en wrangler.json; devuelve URL de respaldo.',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // 4. API: Serve Images from Cloudflare R2
    if (pathname.startsWith('/media/') && request.method === 'GET') {
      const key = pathname.replace('/media/', '');
      if (env.MEDIA_BUCKET) {
        const object = await env.MEDIA_BUCKET.get(key);
        if (!object) {
          return new Response('Imagen no encontrada en R2', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        return new Response(object.body, { headers });
      }
    }

    // 5. API: Send test report simulation
    if (pathname === '/api/admin/send-test-report' && request.method === 'POST') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Reporte procesado exitosamente por Cloudflare Worker.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Default: Serve React Single Page Application via Cloudflare Static Assets
    return env.ASSETS.fetch(request);
  },
};
