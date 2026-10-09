import { setAdminAuthenticated } from '../utils/adminStore';
import { storeRequest } from './storeApi';
export interface LoginResponse { success: boolean; token?: string; error?: string; source?: 'cloudflare_worker' | 'local_fallback'; secretKeyName?: string }
export interface UploadResponse { success: boolean; url?: string; key?: string; error?: string }
export const CLOUDFLARE_CONFIG_INFO = { secretName:'ADMIN_PASSWORD', jwtSecretName:'ADMIN_JWT_SECRET',d1BindingName:'DB',d1DatabaseName:'tortilleria-renteria-db',r2BindingName:'MEDIA_BUCKET',r2BucketName:'tortilleria-renteria-media' };
export class AdminService {
  static async login(password: string): Promise<LoginResponse> {
    try { const data = await storeRequest('/api/admin/login', { method:'POST',body:JSON.stringify({password:password.trim()}) });
      setAdminAuthenticated(true); return { success:true,source:'cloudflare_worker' };
    } catch(error) { return {success:false,error:error instanceof Error?error.message:'No se pudo iniciar sesión.'}; }
  }
  static async uploadImageToR2(file: File): Promise<UploadResponse> {
    try { const form = new FormData(); form.append('file', file);
      const response = await fetch('/api/admin/upload', {method:'POST',body:form,credentials:'same-origin'});
      const data = await response.json(); if(!response.ok)throw Error(data.error || 'No se pudo subir la imagen.'); return data;
    } catch(error) { return {success:false,error:error instanceof Error?error.message:'No se pudo subir la imagen.'}; }
  }
  static async sendTestReport(email: string): Promise<{success:boolean;message:string}> {
    try { const data=await storeRequest('/api/admin/send-test-report',{method:'POST',body:JSON.stringify({email})}); return {success:true,message:data.message}; }
    catch(error){return {success:false,message:error instanceof Error?error.message:'No se pudo enviar el reporte.'};}
  }
  static async cleanupCloudflareD1(): Promise<{success:boolean;freedKB:number;message:string}> {
    try { return await storeRequest('/api/admin/cleanup',{method:'POST',body:'{}'}); }
    catch(error){return {success:false,freedKB:0,message:error instanceof Error?error.message:'No se pudo completar la limpieza.'};}
  }
}
