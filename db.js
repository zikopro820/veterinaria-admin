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
  const iso = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

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
  const load = () => { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.clientes) return d; } catch (e) {} const d = seed(); save(d); return d; };
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
