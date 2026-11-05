/* =========================================================
   BASE DE DATOS — Firebase (Firestore + Auth) o MODO DEMO
   Estructura en Firestore:
     clientes/{CODIGO}                 → datos del dueño
     clientes/{CODIGO}/mascotas/{id}   → ficha, vacunas, historial, cita
   ========================================================= */
(function () {
  const CFG = window.FIREBASE_CONFIG || {};
  const DEMO = !CFG.apiKey || CFG.apiKey.startsWith("PEGA");
  const V = "10.12.2";
  const KEY = "hv_db";
  const ALFA = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";   // sin 0, O, 1, I para no confundir
  const now = () => new Date().toISOString();
  const uid = () => Math.random().toString(36).slice(2, 10);
  const iso = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

  /* ---------------- MODO DEMO (localStorage) ---------------- */
  function seed() {
    return { clientes: {
      "HV-1024": { codigo: "HV-1024", dueno: "María López", celular: "987654321", email: "maria@correo.com", direccion: "Calle Los Pinos 145, Miraflores", notas: "", creado: now(), mascotas: {
        rocky: { nombre: "Rocky", especie: "Perro", raza: "Labrador Retriever", sexo: "Macho", nac: iso(-4 * 365 - 40), peso: "31.5 kg", chip: "604 0981 2234", alergias: "Alergia al pollo", foto: "1581958485706-3c6f6eb4c1bf",
          prox: { servicio: "Vacunación", detalle: "Antirrábica anual", fecha: iso(2), hora: "10:30", vet: "Dra. Carla Méndez", sede: "Sede Miraflores · Consultorio 2" },
          vacunas: [{ id: uid(), n: "Antirrábica", ult: iso(-363), prox: iso(2) }, { id: uid(), n: "Séxtuple (DHPPI+L)", ult: iso(-200), prox: iso(165) }, { id: uid(), n: "Bordetella (tos de las perreras)", ult: iso(-340), prox: iso(25) }],
          historial: [
            { id: uid(), f: iso(-18), t: "Baño medicado y corte", d: "Piel en buen estado. Se recomienda shampoo hipoalergénico.", vet: "Grooming · Luis R.", peso: "" },
            { id: uid(), f: iso(-45), t: "Consulta dermatológica", d: "Dermatitis leve por alergia alimentaria. Se cambió a alimento hipoalergénico.", vet: "Dra. Carla Méndez", peso: "31.2 kg" },
            { id: uid(), f: iso(-120), t: "Desparasitación interna", d: "Tableta según peso (31 kg). Próxima en 3 meses.", vet: "Dr. Andrés Salas", peso: "31 kg" }],
          rec: [{ id: uid(), i: "pill", t: "Desparasitación", f: iso(3) }, { id: uid(), i: "bath", t: "Próximo baño", f: iso(12) }, { id: uid(), i: "food", t: "Recompra de alimento", f: iso(6) }], actualizado: now() },
        luna: { nombre: "Luna", especie: "Gato", raza: "Mestiza", sexo: "Hembra (esterilizada)", nac: iso(-2 * 365 - 100), peso: "4.2 kg", chip: "604 0981 5521", alergias: "Ninguna", foto: "1592194996308-7b43878e84a6",
          prox: { servicio: "Control post operatorio", detalle: "Control post esterilización", fecha: iso(9), hora: "16:00", vet: "Dr. Andrés Salas", sede: "Sede Miraflores · Consultorio 1" },
          vacunas: [{ id: uid(), n: "Triple Felina", ult: iso(-380), prox: iso(-15) }, { id: uid(), n: "Leucemia Felina", ult: iso(-300), prox: iso(65) }],
          historial: [{ id: uid(), f: iso(-21), t: "Esterilización (OVH)", d: "Cirugía sin complicaciones. Retiro de puntos realizado.", vet: "Dr. Andrés Salas", peso: "4.1 kg" }],
          rec: [{ id: uid(), i: "pill", t: "Desparasitación", f: iso(20) }], actualizado: now() } } },
      "HV-2048": { codigo: "HV-2048", dueno: "Jorge Ramos", celular: "912345678", email: "", direccion: "Av. Benavides 890, Surco", notas: "Prefiere citas temprano", creado: now(), mascotas: {
        max: { nombre: "Max", especie: "Perro", raza: "Bulldog Francés", sexo: "Macho", nac: iso(-445), peso: "11.8 kg", chip: "604 0981 7710", alergias: "Ninguna", foto: "1746483966037-c3c9e6374e08",
          prox: { servicio: "Odontología / limpieza dental", detalle: "Limpieza dental con ultrasonido", fecha: iso(5), hora: "09:00", vet: "Dr. Andrés Salas", sede: "Sede Miraflores · Sala de procedimientos" },
          vacunas: [{ id: uid(), n: "Séxtuple (DHPPI+L)", ult: iso(-340), prox: iso(25) }, { id: uid(), n: "Antirrábica", ult: iso(-300), prox: iso(65) }],
          historial: [{ id: uid(), f: iso(-30), t: "Consulta general", d: "Sarro moderado. Se programa limpieza dental en ayunas de 12 h.", vet: "Dr. Andrés Salas", peso: "11.8 kg" }],
          rec: [{ id: uid(), i: "alert", t: "Ayuno 12 h antes de la limpieza", f: iso(4) }], actualizado: now() } } } } };
  }
  // Citas y caja de ejemplo para el MODO DEMO
  function seedAgenda(d) {
    d.citas = {}; d.turnos = {}; d.movimientos = d.movimientos || {};
    const hhmm = () => { const n = new Date(); return String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0"); };
    const add = (dias, hora, code, mid, mascota, especie, dueno, cel, servicio, precio, pagado, origen) => {
      const fecha = iso(dias), id = `${fecha}_${hora}_1`;
      d.turnos[id] = { fecha, hora, k: 1, creado: now() };
      d.citas[id] = { fecha, hora, k: 1, servicioId: "", servicio, precio, total: precio, pagado, estadoPago: pagado >= precio ? "pagado" : pagado > 0 ? "adelanto" : "pendiente",
        pagos: pagado ? [{ monto: pagado, metodo: "Yape", fecha: iso(0), hora: hhmm() }] : [], code, mascotaId: mid, mascota, especie, raza: "", dueno, celular: cel, motivo: "", origen, estado: "confirmada", vet: "Dra. Carla Méndez", vetId: "carla", creado: now() };
      if (pagado) { const mid2 = uid(); d.movimientos[mid2] = { fecha: iso(0), hora: hhmm(), tipo: "servicio", concepto: `Adelanto · ${servicio} – ${mascota}`, total: pagado, metodo: "Yape", items: [{ tipo: "servicio", n: servicio, q: 1, p: pagado }], citaId: id, code, cliente: dueno, anulado: false, creado: now() }; }
    };
    add(0, "10:00", "HV-2048", "max", "Max", "Perro", "Jorge Ramos", "912345678", "Consulta general", 50, 0, "panel");
    add(0, "16:30", "", "", "Pelusa", "Gato", "Andrea Torres", "934567812", "Baño y peluquería", 40, 0, "web");
    add(2, "10:30", "HV-1024", "rocky", "Rocky", "Perro", "María López", "987654321", "Vacunación", 45, 20, "panel");
    add(5, "09:00", "HV-2048", "max", "Max", "Perro", "Jorge Ramos", "912345678", "Odontología", 150, 50, "web");
    add(9, "16:00", "HV-1024", "luna", "Luna", "Gato", "María López", "987654321", "Control post operatorio", 0, 0, "panel");
    // ventas de los últimos días para que los reportes no estén vacíos
    const P = window.DATOS.productos, metodos = ["Efectivo", "Yape", "Plin", "Tarjeta"], md = (x, n) => ((x % n) + n) % n;
    for (let dd = -20; dd <= 0; dd++) {
      const n = 1 + md(dd * 7, 3);
      for (let j = 0; j < n; j++) {
        const p = P[md(dd * 5 + j * 3, P.length)], q = 1 + md(j + dd, 2), costo = Math.round(p.p * .62 * 10) / 10;
        d.movimientos[uid()] = { fecha: iso(dd), hora: `1${j}:${j ? "15" : "40"}`, tipo: "venta", concepto: `Venta · ${p.n}`, total: Math.round(p.p * q * 100) / 100, metodo: metodos[md(j + dd, 4)],
          items: [{ tipo: "producto", id: p.id, n: p.n, q, p: p.p, costo }], cliente: "", anulado: false, creado: now() };
      }
      if (dd % 2 === 0) d.movimientos[uid()] = { fecha: iso(dd), hora: "11:30", tipo: "servicio", concepto: "Consulta general", total: 50, metodo: metodos[md(dd + 1, 4)], items: [{ tipo: "servicio", n: "Consulta general", q: 1, p: 50 }], cliente: "Cliente de mostrador", anulado: false, creado: now() };
      if (dd % 3 === 0) d.movimientos[uid()] = { fecha: iso(dd), hora: "15:00", tipo: "servicio", concepto: "Baño y peluquería", total: 40, metodo: "Yape", items: [{ tipo: "servicio", n: "Baño y peluquería", q: 1, p: 40 }], cliente: "Cliente de mostrador", anulado: false, creado: now() };
    }
    // las mascotas de ejemplo ya no usan "prox" (ahora todo está en la agenda)
    Object.values(d.clientes || {}).forEach(c => Object.values(c.mascotas || {}).forEach(m => { delete m.prox; }));
  }

  // Pet Shop, servicios y ajustes de ejemplo (datos.js)
  function ensure(d) {
    const X = window.DATOS; if (!X) return d; let ch = false;
    const toMap = l => { const m = {}; l.forEach(({ id, ...r }) => m[id] = r); return m; };
    if (!d.productos) { d.productos = toMap(X.productos); ch = true; }
    if (!d.servicios) { d.servicios = toMap(X.servicios); ch = true; }
    if (!d.ajustes) { d.ajustes = { ...X.ajustes }; ch = true; }
    if (!d.inventario) { d.inventario = {}; X.productos.forEach((p, i) => d.inventario[p.id] = { cantidad: [12, 0, 8, 25, 2, 30, 14, 9, 6, 20, 5, 4, 3, 7, 15, 18][i % 16], costo: Math.round(p.p * .62 * 10) / 10, minimo: 3 }); ch = true;
      Object.entries(d.inventario).forEach(([id, v]) => { if (d.productos[id]) d.productos[id].stock = v.cantidad > 0 ? "disponible" : "agotado"; }); }
    if (!d.web && X.web) { d.web = JSON.parse(JSON.stringify(X.web)); ch = true; }
    if (!d.citas) { seedAgenda(d); ch = true; }
    if (ch) save(d); return d;
  }
  const load = () => { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.clientes) return ensure(d); } catch (e) {} const d = seed(); save(d); return ensure(d); };
  const save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { alert("No se pudo guardar (almacenamiento lleno). Usa fotos más pequeñas."); } };
  const clone = o => JSON.parse(JSON.stringify(o));

  const demo = {
    mode: "demo",
    async onUser(cb) { let u = null; try { u = JSON.parse(sessionStorage.getItem("hv_admin")); } catch (e) {} cb(u); this._cb = cb; },
    async login(email, pass) {
      if (!email || pass.length < 4) throw new Error("Correo o contraseña incorrectos.");
      const u = { email }; try { sessionStorage.setItem("hv_admin", JSON.stringify(u)); } catch (e) {} this._cb && this._cb(u); return u;
    },
    async logout() { try { sessionStorage.removeItem("hv_admin"); } catch (e) {} this._cb && this._cb(null); },
    async listClientes() { const d = load(); return Object.values(d.clientes).map(c => { const { mascotas, ...r } = c; return { ...clone(r), nMascotas: Object.keys(mascotas || {}).length }; }); },
    async getCliente(code) { const c = load().clientes[code]; if (!c) return null; const { mascotas, ...r } = c; return clone(r); },
    async codeExists(code) { return !!load().clientes[code]; },
    async saveCliente(code, data) { const d = load(); const old = d.clientes[code] || { mascotas: {}, creado: now() }; d.clientes[code] = { ...old, ...data, codigo: code, mascotas: old.mascotas, actualizado: now() }; save(d); },
    async deleteCliente(code) { const d = load(); delete d.clientes[code]; save(d); },
    async listMascotas(code) { const c = load().clientes[code]; return c ? Object.entries(c.mascotas || {}).map(([id, m]) => ({ id, ...clone(m) })) : []; },
    async getMascota(code, id) { const m = load().clientes[code]?.mascotas?.[id]; return m ? { id, ...clone(m) } : null; },
    async saveMascota(code, id, data) { const d = load(); id = id || uid(); const c = d.clientes[code]; c.mascotas = c.mascotas || {}; c.mascotas[id] = { ...(c.mascotas[id] || {}), ...data, actualizado: now() }; save(d); return id; },
    async deleteMascota(code, id) { const d = load(); delete d.clientes[code].mascotas[id]; save(d); },
    async allMascotas() { const d = load(); const out = []; for (const [code, c] of Object.entries(d.clientes)) for (const [id, m] of Object.entries(c.mascotas || {})) out.push({ code, id, dueno: c.dueno, celular: c.celular, ...clone(m) }); return out; },
  };

  /* ---------------- FIREBASE ---------------- */
  let fb = null;
  async function F() {
    if (fb) return fb;
    const base = `https://www.gstatic.com/firebasejs/${V}/`;
    const [app, auth, fs] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js")]);
    const a = app.initializeApp(CFG);
    fb = { ...auth, ...fs, auth: auth.getAuth(a), db: fs.getFirestore(a) };
    return fb;
  }
  const firebase = {
    mode: "firebase",
    async onUser(cb) { const f = await F(); f.onAuthStateChanged(f.auth, u => cb(u ? { email: u.email } : null)); },
    async login(email, pass) {
      const f = await F();
      try { await f.signInWithEmailAndPassword(f.auth, email, pass); }
      catch (e) {
        if (/api-key|configuration-not-found|unauthorized-domain|operation-not-allowed/.test(e.code || "")) throw new Error("Revisa la configuración de Firebase: " + e.code + " (ver COMO-CONFIGURAR.txt)");
        throw new Error(/invalid|wrong|not-found|credential/.test(e.code || "") ? "Correo o contraseña incorrectos." : "No se pudo ingresar: " + (e.code || e.message)); }
    },
    async logout() { const f = await F(); await f.signOut(f.auth); },
    // Datos públicos (clientes/) = solo el nombre. Celular, correo, dirección y notas van en privado/ (solo el panel).
    async listClientes() {
      const f = await F();
      const [s, p, all] = await Promise.all([f.getDocs(f.collection(f.db, "clientes")), f.getDocs(f.collection(f.db, "privado")), this.allMascotas()]);
      const pv = {}; p.docs.forEach(d => pv[d.id] = d.data());
      const n = {}; all.forEach(m => n[m.code] = (n[m.code] || 0) + 1);
      return s.docs.map(d => ({ ...d.data(), ...(pv[d.id] || {}), codigo: d.id, nMascotas: n[d.id] || 0 }));
    },
    async getCliente(code) {
      const f = await F();
      const [s, p] = await Promise.all([f.getDoc(f.doc(f.db, "clientes", code)), f.getDoc(f.doc(f.db, "privado", code))]);
      return s.exists() ? { ...s.data(), ...(p.exists() ? p.data() : {}), codigo: code } : null;
    },
    async codeExists(code) { const f = await F(); return (await f.getDoc(f.doc(f.db, "clientes", code))).exists(); },
    async saveCliente(code, data) {
      const f = await F(); const ref = f.doc(f.db, "clientes", code); const ex = await f.getDoc(ref);
      const { dueno, ...priv } = data;
      await f.setDoc(ref, { dueno, codigo: code, actualizado: now(), ...(ex.exists() ? {} : { creado: now() }) }, { merge: true });
      await f.setDoc(f.doc(f.db, "privado", code), priv, { merge: true });
    },
    async deleteCliente(code) {
      const f = await F();
      for (const m of await this.listMascotas(code)) await f.deleteDoc(f.doc(f.db, "clientes", code, "mascotas", m.id));
      await f.deleteDoc(f.doc(f.db, "privado", code)); await f.deleteDoc(f.doc(f.db, "clientes", code));
    },
    async listMascotas(code) { const f = await F(); const s = await f.getDocs(f.collection(f.db, "clientes", code, "mascotas")); return s.docs.map(d => ({ id: d.id, ...d.data() })); },
    async getMascota(code, id) { const f = await F(); const s = await f.getDoc(f.doc(f.db, "clientes", code, "mascotas", id)); return s.exists() ? { id, ...s.data() } : null; },
    async saveMascota(code, id, data) { const f = await F();
      if (!id) { const r = await f.addDoc(f.collection(f.db, "clientes", code, "mascotas"), { ...data, actualizado: now() }); return r.id; }
      await f.setDoc(f.doc(f.db, "clientes", code, "mascotas", id), { ...data, actualizado: now() }, { merge: true }); return id; },
    async deleteMascota(code, id) { const f = await F(); await f.deleteDoc(f.doc(f.db, "clientes", code, "mascotas", id)); },
    async allMascotas() {
      const f = await F(); const [ms, cs, ps] = await Promise.all([f.getDocs(f.collectionGroup(f.db, "mascotas")), f.getDocs(f.collection(f.db, "clientes")), f.getDocs(f.collection(f.db, "privado"))]);
      const cl = {}; cs.docs.forEach(d => cl[d.id] = d.data()); ps.docs.forEach(d => cl[d.id] = { ...(cl[d.id] || {}), ...d.data() });
      return ms.docs.map(d => { const code = d.ref.parent.parent.id; return { code, id: d.id, dueno: cl[code]?.dueno || "", celular: cl[code]?.celular || "", ...d.data() }; });
    },
  };

  /* ---------- Pet Shop, servicios y ajustes ---------- */
  Object.assign(demo, {
    async listCol(col) { return Object.entries(load()[col] || {}).map(([id, x]) => ({ ...clone(x), id })); },
    async saveDocCol(col, id, data) { const d = load(); d[col] = d[col] || {}; id = id || uid(); d[col][id] = { ...(d[col][id] || {}), ...data, actualizado: now() }; save(d); return id; },
    async delDocCol(col, id) { const d = load(); delete d[col][id]; save(d); },
    async getAjustes() { return clone(load().ajustes || {}); },
    async saveAjustes(a) { const d = load(); d.ajustes = { ...(d.ajustes || {}), ...a }; save(d); },
    async importar(col) { const d = load(); d[col] = d[col] || {}; (window.DATOS[col] || []).forEach(({ id, ...r }) => d[col][id] = r);
      if (col === "productos") { d.inventario = d.inventario || {}; window.DATOS.productos.forEach(p => { if (!d.inventario[p.id]) d.inventario[p.id] = { cantidad: 10, costo: Math.round(p.p * .62 * 10) / 10, minimo: 3 }; d.productos[p.id].stock = "disponible"; }); }
      save(d); },
  });
  Object.assign(firebase, {
    async listCol(col) { const f = await F(); const s = await f.getDocs(f.collection(f.db, col)); return s.docs.map(d => ({ ...d.data(), id: d.id })); },
    async saveDocCol(col, id, data) { const f = await F();
      if (!id) { const r = await f.addDoc(f.collection(f.db, col), { ...data, actualizado: now() }); return r.id; }
      await f.setDoc(f.doc(f.db, col, id), { ...data, actualizado: now() }, { merge: true }); return id; },
    async delDocCol(col, id) { const f = await F(); await f.deleteDoc(f.doc(f.db, col, id)); },
    async getAjustes() { const f = await F(); const s = await f.getDoc(f.doc(f.db, "ajustes", "general")); return s.exists() ? s.data() : {}; },
    async saveAjustes(a) { const f = await F(); await f.setDoc(f.doc(f.db, "ajustes", "general"), a, { merge: true }); },
    async importar(col) { const f = await F();
      for (const { id, ...r } of (window.DATOS[col] || [])) {
        await f.setDoc(f.doc(f.db, col, id), { ...r, ...(col === "productos" ? { stock: "disponible" } : {}), actualizado: now() });
        if (col === "productos") await f.setDoc(f.doc(f.db, "inventario", id), { cantidad: 10, costo: Math.round(r.p * .62 * 10) / 10, minimo: 3 }, { merge: true });
      } },
  });

  /* ---------- Agenda, caja e inventario ---------- */
  const pubCita = c => ({ fecha: c.fecha, hora: c.hora, servicio: c.servicio, precio: +c.precio || 0, total: +(c.total ?? c.precio) || 0, pagado: +c.pagado || 0,
    estadoPago: c.estadoPago || "pendiente", mascota: c.mascota || "", mascotaId: c.mascotaId || "", estado: c.estado || "confirmada", vet: c.vet || "", sede: c.sede || "" });
  Object.assign(demo, {
    async getDocX(col, id) { const d = load(); return d[col] && d[col][id] ? clone(d[col][id]) : null; },
    async setDocX(col, id, data) { const d = load(); d[col] = d[col] || {}; d[col][id] = { ...(d[col][id] || {}), ...data }; save(d); },
    async rango(col, a, b) { return Object.entries(load()[col] || {}).filter(([, x]) => x.fecha >= a && x.fecha <= b).map(([id, x]) => ({ ...clone(x), id })); },
    async turnosRango(a, b) { return this.rango("turnos", a, b); },
    async crearCita(base, cap) {
      const d = load(); d.turnos = d.turnos || {}; d.citas = d.citas || {};
      for (let k = 1; k <= cap; k++) { const id = `${base.fecha}_${base.hora}_${k}`; if (d.turnos[id]) continue;
        d.turnos[id] = { fecha: base.fecha, hora: base.hora, k, creado: now() }; d.citas[id] = { ...base, k, creado: now() }; save(d); return id; }
      return null;
    },
    async guardarCita(id, data) { const d = load(); d.citas[id] = { ...(d.citas[id] || {}), ...data, actualizado: now() }; save(d); },
    async borrarCita(c) { const d = load(); delete d.citas[c.id]; delete d.turnos[c.id]; save(d); },
    async bloquear(fecha, hora, cap, motivo) { const d = load(); d.turnos = d.turnos || {}; for (let k = 1; k <= cap; k++) { const id = `${fecha}_${hora}_${k}`; if (!d.turnos[id]) d.turnos[id] = { fecha, hora, k, bloqueo: true, motivo: motivo || "", creado: now() }; } save(d); },
    async desbloquear(fecha, hora) { const d = load(); Object.entries(d.turnos || {}).forEach(([id, t]) => { if (t.fecha === fecha && t.hora === hora && t.bloqueo) delete d.turnos[id]; }); save(d); },
    async stock(id, delta, extra = {}) {
      const d = load(); d.inventario = d.inventario || {}; const inv = d.inventario[id] || { cantidad: 0, costo: 0, minimo: 3 };
      inv.cantidad = (+inv.cantidad || 0) + delta; Object.assign(inv, extra); d.inventario[id] = inv;
      if (d.productos && d.productos[id]) d.productos[id].stock = inv.cantidad > 0 ? "disponible" : "agotado";
      save(d); return inv.cantidad;
    },
  });
  Object.assign(firebase, {
    async getDocX(col, id) { const f = await F(); const s = await f.getDoc(f.doc(f.db, col, id)); return s.exists() ? s.data() : null; },
    async setDocX(col, id, data) { const f = await F(); await f.setDoc(f.doc(f.db, col, id), data, { merge: true }); },
    async rango(col, a, b) { const f = await F(); const s = await f.getDocs(f.query(f.collection(f.db, col), f.where("fecha", ">=", a), f.where("fecha", "<=", b))); return s.docs.map(d => ({ ...d.data(), id: d.id })); },
    async turnosRango(a, b) { return this.rango("turnos", a, b); },
    async crearCita(base, cap) {
      const f = await F();
      for (let k = 1; k <= cap; k++) {
        const id = `${base.fecha}_${base.hora}_${k}`;
        try {
          await f.runTransaction(f.db, async tx => {
            const t = f.doc(f.db, "turnos", id); if ((await tx.get(t)).exists()) throw new Error("ocupado");
            tx.set(t, { fecha: base.fecha, hora: base.hora, k, creado: now() });
            tx.set(f.doc(f.db, "citas", id), { ...base, k, creado: now() });
            if (base.code) tx.set(f.doc(f.db, "clientes", base.code, "agenda", id), pubCita(base));
          });
          return id;
        } catch (e) { if (e.message !== "ocupado") throw e; }
      }
      return null;
    },
    async guardarCita(id, data) {
      const f = await F(); const ref = f.doc(f.db, "citas", id);
      await f.setDoc(ref, { ...data, actualizado: now() }, { merge: true });
      const c = (await f.getDoc(ref)).data();
      if (c && c.code) await f.setDoc(f.doc(f.db, "clientes", c.code, "agenda", id), pubCita(c));
    },
    async borrarCita(c) {
      const f = await F(); const b = f.writeBatch(f.db);
      b.delete(f.doc(f.db, "citas", c.id)); b.delete(f.doc(f.db, "turnos", c.id));
      if (c.code) b.delete(f.doc(f.db, "clientes", c.code, "agenda", c.id));
      await b.commit();
    },
    async bloquear(fecha, hora, cap, motivo) {
      const f = await F();
      for (let k = 1; k <= cap; k++) { const ref = f.doc(f.db, "turnos", `${fecha}_${hora}_${k}`);
        if (!(await f.getDoc(ref)).exists()) await f.setDoc(ref, { fecha, hora, k, bloqueo: true, motivo: motivo || "", creado: now() }); }
    },
    async desbloquear(fecha, hora) {
      const f = await F(); const s = await f.getDocs(f.query(f.collection(f.db, "turnos"), f.where("fecha", "==", fecha)));
      for (const d of s.docs) if (d.data().hora === hora && d.data().bloqueo) await f.deleteDoc(d.ref);
    },
    async stock(id, delta, extra = {}) {
      const f = await F(); const ref = f.doc(f.db, "inventario", id);
      await f.setDoc(ref, { ...extra, cantidad: f.increment(delta) }, { merge: true });
      const q = +((await f.getDoc(ref)).data().cantidad) || 0;
      await f.setDoc(f.doc(f.db, "productos", id), { stock: q > 0 ? "disponible" : "agotado" }, { merge: true });
      return q;
    },
  });
  Object.assign(demo, {
    async getWeb() { return clone(load().web || window.DATOS.web || {}); },
    async saveWeb(w) { const d = load(); d.web = w; save(d); },
    async citasDeCliente(code) { return Object.entries(load().citas || {}).filter(([, c]) => c.code === code).map(([id, c]) => ({ ...clone(c), id })); },
  });
  Object.assign(firebase, {
    async getWeb() { const w = await this.getDocX("ajustes", "web"); return w || JSON.parse(JSON.stringify(window.DATOS.web || {})); },
    async saveWeb(w) { const f = await F(); await f.setDoc(f.doc(f.db, "ajustes", "web"), w); },
    async citasDeCliente(code) { const f = await F(); const s = await f.getDocs(f.query(f.collection(f.db, "citas"), f.where("code", "==", code))); return s.docs.map(d => ({ ...d.data(), id: d.id })); },
  });
  /* ---------- Categorías, páginas e info extra de productos ---------- */
  Object.assign(demo, {
    async getConf(n) { const c = (load().conf || {})[n]; return c ? clone(c) : null; },
    async saveConf(n, data) { const d = load(); d.conf = d.conf || {}; d.conf[n] = data; save(d); },
    async getProdInfo(id) { const x = (load().productos_info || {})[id]; return x ? clone(x) : null; },
    async saveProdInfo(id, data) { const d = load(); d.productos_info = d.productos_info || {}; d.productos_info[id] = data; save(d); },
    async delProdInfo(id) { const d = load(); if (d.productos_info) delete d.productos_info[id]; save(d); },
  });
  Object.assign(firebase, {
    async getConf(n) { return this.getDocX("ajustes", n); },
    async saveConf(n, data) { const f = await F(); await f.setDoc(f.doc(f.db, "ajustes", n), data); },
    async getProdInfo(id) { return this.getDocX("productos_info", id); },
    async saveProdInfo(id, data) { const f = await F(); await f.setDoc(f.doc(f.db, "productos_info", id), data); },
    async delProdInfo(id) { const f = await F(); await f.deleteDoc(f.doc(f.db, "productos_info", id)); },
  });

  // Cuando una cita (o un cambio de pago) es del panel en modo demo también sincroniza la copia del cliente
  demo.pubCita = firebase.pubCita = pubCita;

  const api = DEMO ? demo : firebase;
  api.nuevoCodigo = async function () {
    const pre = (window.APP && window.APP.prefijoCodigo) || "HV";
    for (let i = 0; i < 20; i++) {
      let c = pre + "-"; for (let j = 0; j < 5; j++) c += ALFA[Math.floor(Math.random() * ALFA.length)];
      if (!(await api.codeExists(c))) return c;
    }
    throw new Error("No se pudo generar un código. Intenta de nuevo.");
  };
  window.DB = api;
})();
