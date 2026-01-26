import { Injectable } from '@angular/core';
import {
  Firestore,
  collectionData,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  docData,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';
import { Observable, firstValueFrom, of } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from '@angular/fire/auth';

export interface Categoria {
  id: string;
  nombre: string;
  nombreEn?: string;
  nombreFr?: string;
  nombreDe?: string;
  nombreIt?: string;
  orden?: number;
  oculta?: boolean;
  comanderoId?: string;
}

export interface Comandero {
  id: string;
  numero: number;
  descripcion: string;
  printerName?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  imagen?: string | null;
  descripcion?: string;
  alergenos?: string;
  opciones?: string[];
  nombreEn?: string;
  descripcionEn?: string;
  alergenosEn?: string;
  opcionesEn?: string[];
  nombreFr?: string;
  descripcionFr?: string;
  alergenosFr?: string;
  opcionesFr?: string[];
  nombreDe?: string;
  descripcionDe?: string;
  alergenosDe?: string;
  opcionesDe?: string[];
  nombreIt?: string;
  descripcionIt?: string;
  alergenosIt?: string;
  opcionesIt?: string[];
  agotado?: boolean;
}

export interface BarRegistro {
  nombre: string;
  usuario: string;
  password: string;
  correo: string;
  trialStart: string;
  // Idioma predeterminado del bar (código: 'es'|'en'|'it'|'de'|'fr')
  defaultLanguage?: string;
}

export interface Promotion {
  id: string;
  name: string;
  type: '2x1' | 'discount_percent' | 'discount_fixed';
  value?: number; // e.g. 20 for 20% or 5 for 5€
  days: number[]; // 0-6 (Sun-Sat)
  startTime: string; // "18:00"
  endTime: string; // "20:00"
  productIds: string[]; // Specific products or empty for ALL
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  // Cache sencillo para Observables compartidos para evitar múltiples escuchas
  private cache: { [key: string]: Observable<any> } = {};

  constructor(private firestore: Firestore, private auth: Auth) {}

  private getCachedObservable<T>(key: string, observableQuery: Observable<T>): Observable<T> {
    if (!this.cache[key]) {
      // refCount: true hace que cuando no haya suscriptores se desconecte de Firestore
      // bufferSize: 1 recuerda el último valor para nuevos suscriptores inmediatos
      this.cache[key] = observableQuery.pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.cache[key];
  }

  // Obtiene la imagen de cabecera en bares/{barId}/cabecera/imagen
  getCabeceraImagen(barId: string) {
    const key = `cabecera-${barId}`;
    const ref = doc(this.firestore, `bares/${barId}/cabecera/imagen`);
    return this.getCachedObservable(key, docData(ref));
  }

  // Obtiene el trialStart del bar - OPTIMIZADO: Lectura única (no real-time)
  async getTrialStart(barId: string) {
    const ref = doc(this.firestore, `bares/${barId}`);
    return getDoc(ref).then(snap => snap.data());
  }

  // Obtiene la configuración global del bar (impresora admin, etc.)
  getBarConfig(barId: string): Observable<any> {
    const ref = doc(this.firestore, `bares/${barId}`);
    return docData(ref);
  }

  // Actualiza la impresora de administración
  async updateAdminPrinter(barId: string, printerName: string) {
    const ref = doc(this.firestore, `bares/${barId}`);
    await setDoc(ref, { adminPrinterName: printerName }, { merge: true });
  }

  // Guarda la imagen de cabecera en bares/{barId}/cabecera
  async guardarCabeceraImagen(barId: string, imagenBase64: string) {
    const ref = doc(this.firestore, `bares/${barId}/cabecera/imagen`);
    await setDoc(ref, { imagen: imagenBase64 });
  }

  // --- CATEGORÍAS ---
  getCategorias(barId: string): Observable<Categoria[]> {
    const key = `categorias-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/categorias`);
    const q = query(ref, orderBy('orden', 'asc'));
    return this.getCachedObservable(key, collectionData(q, { idField: 'id' })) as Observable<Categoria[]>;
  }

  async addCategoria(barId: string, categoria: Omit<Categoria, 'id'>) {
    const ref = collection(this.firestore, `bares/${barId}/categorias`);
    // Obtener categorías existentes para calcular el siguiente `orden`
    const existing =
      (await firstValueFrom(
        collectionData(ref, { idField: 'id' }) as Observable<any[]>
      )) || [];
    const maxOrden = existing.reduce((m, c) => {
      const o = typeof c.orden === 'number' ? c.orden : -1;
      return Math.max(m, o);
    }, -1);
    const newOrden = maxOrden + 1;
    const toAdd = { ...categoria, orden: newOrden } as any;
    return addDoc(ref, toAdd);
  }

  updateCategoria(barId: string, categoria: Categoria) {
    const ref = doc(
      this.firestore,
      `bares/${barId}/categorias/${categoria.id}`
    );
    // Usar merge para no sobreescribir campos existentes (p.ej. `orden`)
    return setDoc(ref, categoria, { merge: true });
  }

  deleteCategoria(barId: string, id: string) {
    const ref = doc(this.firestore, `bares/${barId}/categorias/${id}`);
    return deleteDoc(ref);
  }

  // --- PRODUCTOS ---
  getProductos(barId: string): Observable<Producto[]> {
    const key = `productos-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/productos`);
    return this.getCachedObservable(key, collectionData(ref, { idField: 'id' })) as Observable<Producto[]>;
  }

  addProducto(barId: string, producto: Omit<Producto, 'id'>) {
    const ref = collection(this.firestore, `bares/${barId}/productos`);
    return addDoc(ref, producto);
  }

  updateProducto(barId: string, producto: Producto) {
    const ref = doc(this.firestore, `bares/${barId}/productos/${producto.id}`);
    // Use merge to avoid overwriting translation fields when they're not provided
    return setDoc(ref, producto, { merge: true });
  }

  deleteProducto(barId: string, id: string) {
    const ref = doc(this.firestore, `bares/${barId}/productos/${id}`);
    return deleteDoc(ref);
  }

  // --- COMANDAS ---
  getComandas(barId: string): Observable<any[]> {
    const key = `comandas-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/comandas`);
    return this.getCachedObservable(key, collectionData(ref, { idField: 'id' })) as Observable<any[]>;
  }

  addComanda(barId: string, comanda: any) {
    // Asegura que el campo estado nunca sea undefined
    if (comanda.estado === undefined) {
      comanda.estado = 'pendiente'; // Valor por defecto
    }
    const ref = collection(this.firestore, `bares/${barId}/comandas`);
    return addDoc(ref, comanda);
  }

  updateComanda(barId: string, comanda: any) {
    const ref = doc(this.firestore, `bares/${barId}/comandas/${comanda.id}`);
    return setDoc(ref, comanda);
  }

  deleteComanda(barId: string, id: string) {
    const ref = doc(this.firestore, `bares/${barId}/comandas/${id}`);
    return deleteDoc(ref);
  }

  // --- USUARIOS (para login y administración) ---
  getUsuarios(barId: string): Observable<any[]> {
    const key = `usuarios-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/usuarios`);
    return this.getCachedObservable(key, collectionData(ref, { idField: 'id' })) as Observable<any[]>;
  }

  addUsuario(barId: string, usuario: { usuario: string; password: string }) {
    const ref = collection(this.firestore, `bares/${barId}/usuarios`);
    return addDoc(ref, usuario);
  }

  // --- REGISTRO DE BARES Y USUARIO ADMIN ---
  async registrarBar(data: BarRegistro) {
    // 1. Crear el usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      data.correo,
      data.password
    );
    const uid = userCredential.user.uid;

    // 2. Crear el documento del bar en Firestore usando el UID de Auth como ID
    const barRef = doc(this.firestore, `bares/${uid}`);
    await setDoc(barRef, {
      nombre: data.nombre,
      correo: data.correo,
      usuario: data.usuario, // Alias para compatibilidad
      trialStart: data.trialStart,
      defaultLanguage: data.defaultLanguage || 'es',
    });

    // 3. Crear el perfil de usuario en la subcolección (opcional, para roles futuros)
    const usuariosRef = collection(this.firestore, `bares/${uid}/usuarios`);
    await addDoc(usuariosRef, {
      usuario: data.usuario,
      correo: data.correo,
      rol: 'admin',
    });

    return uid;
  }

  // --- RECUPERACIÓN DE CONTRASEÑA ---
  async recuperarPassword(correo: string) {
    try {
      await sendPasswordResetEmail(this.auth, correo.trim());
      return { success: true };
    } catch (e: any) {
      console.error('Error enviando reset email:', e);
      return { success: false, error: e.code };
    }
  }

  async buscarUsuarioPorCorreo(
    correo: string
  ): Promise<{ usuario: string; barId: string } | null> {
    // Nota: El flujo de Auth ahora debería ser mediante sendPasswordResetEmail
    // Aquí devolvemos null ya que no buscamos en colecciones de forma abierta
    return null;
  }

  async cambiarPasswordUsuario(
    barId: string,
    usuario: string,
    nuevaPassword: string
  ) {
    // Esto se gestiona vía Firebase Auth console o API de reset
  }

  /**
   * Login usando Firebase Auth.
   */
  async loginMultiBar(
    correo: string,
    password: string
  ): Promise<{ usuario: any; barId: string } | null> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        correo,
        password
      );
      const uid = userCredential.user.uid;
      
      // Intentamos recuperar los datos del bar asociado a este UID
      const barRef = doc(this.firestore, `bares/${uid}`);
      const barSnap = await getDoc(barRef);
      const barData = barSnap.data();

      if (barData) {
        return {
          usuario: { correo: userCredential.user.email, id: uid },
          barId: uid
        };
      }
      return null;
    } catch (e) {
      console.error('Error login Auth:', e);
      return null;
    }
  }

  // --- Historial de pedidos ---
  // Guarda un pedido en el historial
  addHistorial(barId: string, pedido: any) {
    const ref = collection(this.firestore, `bares/${barId}/historial`);
    return addDoc(ref, pedido);
  }

  // Devuelve el historial de pedidos
  getHistorial(barId: string) {
    const key = `historial-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/historial`);
    const q = query(ref, orderBy('fecha', 'desc'));
    return this.getCachedObservable(key, collectionData(q, { idField: 'id' }));
  }

  // Devuelve el historial de pedidos filtrado por fecha y mesa
  // NOTE: This usually changes filters a lot, so maybe caching is less effective
  // but if frequently called with same filters, it could be useful.
  // For now, simpler to NOT cache parameterized queries or use a complex key.
  getHistorialFiltrado(barId: string, fecha: string, mesa?: string) {
    const ref = collection(this.firestore, `bares/${barId}/historial`);
    let filtros = [where('fechaDia', '==', fecha)];
    if (mesa) {
      filtros.push(where('mesa', '==', mesa));
    }
    const q = query(ref, ...filtros, orderBy('fecha', 'desc'));
    return collectionData(q, { idField: 'id' });
  }

  // --- Utilidad: obtener barId actual (desde localStorage o auth) ---
  getBarId(): string {
    return localStorage.getItem('usuario') || 'bar-demo';
  }

  // Guarda el nombre del producto/plan de la suscripción en el documento del bar
  async setSubscriptionProductName(barId: string, productName: string) {
    const ref = doc(this.firestore, `bares/${barId}`);
    try {
      await updateDoc(ref, { subscriptionProductName: productName });
    } catch (e) {
      // Si update falla (p. ej. doc no existe), usar setDoc con merge
      await setDoc(
        ref,
        { subscriptionProductName: productName },
        { merge: true }
      );
    }
  }
  // --- PROMOTIONS ---
  getPromotions(barId: string): Observable<Promotion[]> {
    const key = `promotions-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/promotions`);
    return this.getCachedObservable(key, collectionData(ref, { idField: 'id' })) as Observable<Promotion[]>;
  }

  addPromotion(barId: string, promotion: Omit<Promotion, 'id'>) {
    const ref = collection(this.firestore, `bares/${barId}/promotions`);
    return addDoc(ref, promotion);
  }

  updatePromotion(barId: string, promotion: Promotion) {
    const ref = doc(this.firestore, `bares/${barId}/promotions/${promotion.id}`);
    return setDoc(ref, promotion, { merge: true });
  }

  deletePromotion(barId: string, id: string) {
    const ref = doc(this.firestore, `bares/${barId}/promotions/${id}`);
    return deleteDoc(ref);
  }
  // --- COMANDEROS ---
  getComanderos(barId: string): Observable<Comandero[]> {
    const key = `comanderos-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/comanderos`);
    const q = query(ref, orderBy('numero', 'asc'));
    return this.getCachedObservable(key, collectionData(q, { idField: 'id' })) as Observable<Comandero[]>;
  }

  addComandero(barId: string, comandero: Omit<Comandero, 'id'>) {
    const ref = collection(this.firestore, `bares/${barId}/comanderos`);
    return addDoc(ref, comandero);
  }

  updateComandero(barId: string, comandero: Comandero) {
    const ref = doc(this.firestore, `bares/${barId}/comanderos/${comandero.id}`);
    return setDoc(ref, comandero, { merge: true });
  }

  deleteComandero(barId: string, id: string) {
    const ref = doc(this.firestore, `bares/${barId}/comanderos/${id}`);
    return deleteDoc(ref);
  }
}
