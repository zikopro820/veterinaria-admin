/* =========================================================
   MÓDULOS 4: Atención en tiempo real · Recibos · Fotos del historial
   ========================================================= */
Object.assign(I2, {
  play: '<path d="M7 4v16l13-8z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  receipt: '<path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
});

/* ---------- Ajustes que usan estos módulos ---------- */
let TIEMPO_REAL = false, AJ_CACHE = {}, MARCA = {};
const _cargarAjustes4 = cargarAjustes;
cargarAjustes = async function () {   // eslint-disable-line no-global-assign
  const a = await _cargarAjustes4(); TIEMPO_REAL = !!a.tiempoReal; AJ_CACHE = a; return a;
};
const _cargarMarca4 = cargarMarca;
cargarMarca = async function () {   // eslint-disable-line no-global-assign
  await _cargarMarca4();
  try { MARCA = (await DB.getWeb()).marca || {}; } catch (e) { MARCA = {}; }
};
const minDesde = iso => Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
const durTxt = m => m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + " min" : ""}`.trim() : `${m} min`;
const hmDe = iso => { const d = new Date(iso); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };

/* =========================================================
   1) ESTADO DEL DOCTOR EN TIEMPO REAL (opcional en Ajustes)
   ========================================================= */
const _citaCard4 = citaCard;
citaCard = function (c, opt = {}) {   // eslint-disable-line no-global-assign
  let h = _citaCard4(c, opt);
  const at = c.estado === "atendida";
  // recibo cuando ya hay algún pago
  if (+c.pagado > 0) h = h.replace('<div class="c-acts">', `<div class="c-acts"><button class="btn btn-light btn-sm" data-act="recibo">${ic2("receipt")}<span>Recibo</span></button>`);
  if (at && c.code && c.mascotaId) h = h.replace('<div class="c-acts">', `<div class="c-acts"><button class="btn btn-light btn-sm" data-act="receta">${ico("paw")}<span>Receta</span></button>`);
  if (!TIEMPO_REAL || at || c.fecha !== todayISO()) {
    if (c.duracion && at) h = h.replace('<div class="badges">', `<div class="badges"><span class="st">${ic2("clock")} ${durTxt(c.duracion)}</span>`);
    return h;
  }
  let badge = "", btn = "";
  if (c.inicio && !c.fin) {
    const m = minDesde(c.inicio), paso = +AJ_CACHE.turno || 30, tarde = m > paso;
    badge = `<span class="st live ${tarde ? "late" : ""}"><i class="dot-live"></i> En atención · ${durTxt(m)}${tarde ? ` · +${m - paso} min` : ""}</span>`;
    btn = `<button class="btn btn-sm btn-stop" data-act="fin">${ic2("stop")}<span>Terminar</span></button>`;
  } else if (c.fin) {
    badge = `<span class="st info">${ic2("clock")} Terminó a las ${hmDe(c.fin)} · ${durTxt(c.duracion || 0)}</span>`;
  } else {
    btn = `<button class="btn btn-sm btn-go" data-act="ini">${ic2("play")}<span>Iniciar atención</span></button>`;
  }
  return h.replace('<div class="badges">', `<div class="badges">${badge}`).replace('<div class="c-acts">', `<div class="c-acts">${btn}`);
};

// un doctor que sigue atendiendo (aunque se pasó de su horario) aparece ocupado
const _estadoDocs4 = estadoDocs;
estadoDocs = function (f, h, aj, citas, exceptoId) {   // eslint-disable-line no-global-assign
  const l = _estadoDocs4(f, h, aj, citas, exceptoId);
  if (!TIEMPO_REAL || f !== todayISO()) return l;
  return l.map(x => {
    if (x.est !== "libre") return x;
    const enCurso = citas.find(c => c.id !== exceptoId && c.vetId === x.d.id && c.fecha === f && c.inicio && !c.fin && c.estado !== "atendida");
    return enCurso ? { ...x, est: "ocupado", cita: enCurso } : x;
  });
};

async function iniciarAtencion(c) {
  if (!c.vetId) { toast("Primero asigna el doctor que atenderá", true); return asignarDoctor(c); }
  const cs = await DB.rango("citas", c.fecha, c.fecha);
  const otra = cs.find(x => x.id !== c.id && x.vetId === c.vetId && x.inicio && !x.fin && x.estado !== "atendida");
  if (otra && !confirm(`${c.vet} sigue atendiendo a ${otra.mascota}. ¿Terminar esa atención e iniciar esta?`)) return;
  if (otra) { const fin = new Date().toISOString(); await DB.guardarCita(otra.id, { fin, duracion: Math.max(1, minDesde(otra.inicio)) }); }
  await DB.guardarCita(c.id, { inicio: new Date().toISOString(), fin: null, duracion: null });
  toast(`${c.vet} atendiendo a ${c.mascota}`); refresh();
}
async function terminarAtencion(c) {
  const fin = new Date().toISOString(), duracion = Math.max(1, minDesde(c.inicio));
  await DB.guardarCita(c.id, { fin, duracion });
  toast(`Atención terminada · ${durTxt(duracion)}`);
  fichaAtencion({ ...c, fin, duracion }, "atender");
}

// Panel en vivo dentro de Doctores
const _doctores4 = VIEWS.doctores;
VIEWS.doctores = async () => {
  await cargarAjustes();
  await _doctores4();
  if (!TIEMPO_REAL) {
    $(".docs")?.insertAdjacentHTML("beforebegin", `<div class="card rt-off"><div>${ic2("clock")}<div><b>Atención en tiempo real</b><small>Activa en <b>Ajustes</b> los botones «Iniciar» y «Terminar» para ver quién está atendiendo, quién va retrasado y cuánto dura cada atención.</small></div></div><button class="btn btn-light btn-sm" data-goto="ajustes">Activar</button></div>`);
    return;
  }
  const hoy = todayISO(), cs = (await DB.rango("citas", hoy, hoy)).sort((a, b) => a.hora.localeCompare(b.hora)), ahora = aMin(nowHM());
  const filas = docsActivos().map(d => {
    const mias = cs.filter(c => c.vetId === d.id), cur = mias.find(c => c.inicio && !c.fin && c.estado !== "atendida");
    const prox = mias.find(c => !c.inicio && c.estado !== "atendida"), hechas = mias.filter(c => c.duracion);
    const prom = hechas.length ? Math.round(hechas.reduce((a, c) => a + (+c.duracion || 0), 0) / hechas.length) : 0;
    let st, det, btn = "";
    if (ausente(d, hoy)) { st = ["dark", "No vino"]; det = "Ausente hoy"; }
    else if (cur) {
      const m = minDesde(cur.inicio), paso = +AJ_CACHE.turno || 30, retr = prox && aMin(prox.hora) < ahora ? ahora - aMin(prox.hora) : 0;
      st = [m > paso || retr ? "warn" : "bad", m > paso || retr ? "Atendiendo · retrasado" : "Atendiendo"];
      det = `<b>${esc(cur.mascota)}</b> · ${esc(cur.servicio)} · desde ${hmDe(cur.inicio)} (${durTxt(m)})${retr ? ` · <span class="c-red">su cita de las ${esc(prox.hora)} espera ${retr} min</span>` : ""}`;
      CITAS[cur.id] = cur; btn = `<div data-cid="${esc(cur.id)}"><button class="btn btn-sm btn-stop" data-act="fin">${ic2("stop")} Terminar</button></div>`;
    } else if (prox) {
      const espera = aMin(prox.hora) < ahora ? ahora - aMin(prox.hora) : 0;
      st = espera > 5 ? ["warn", "Libre · cita esperando"] : ["ok", "Libre"];
      det = `Próxima: <b>${esc(prox.hora)} h</b> · ${esc(prox.mascota)} (${esc(prox.servicio)})${espera > 5 ? ` · <span class="c-red">lleva ${espera} min esperando</span>` : ""}`;
      CITAS[prox.id] = prox; btn = `<div data-cid="${esc(prox.id)}"><button class="btn btn-sm btn-go" data-act="ini">${ic2("play")} Iniciar con ${esc(prox.mascota)}</button></div>`;
    } else { st = ["ok", "Libre"]; det = mias.length ? "Terminó sus citas de hoy" : "Sin citas asignadas hoy"; }
    return `<div class="rt-row">${avatarDoc(d)}<div class="rt-i"><b>${esc(d.n)}</b><small>${det}</small></div>
      <div class="rt-n"><b>${hechas.length}/${mias.length}</b><small>atendidas</small></div><div class="rt-n"><b>${prom ? durTxt(prom) : "—"}</b><small>promedio</small></div>
      <span class="st ${st[0]}">${st[1]}</span>${btn}</div>`;
  }).join("");
  $(".docs")?.insertAdjacentHTML("beforebegin", `<div class="card rt-card"><div class="card-h"><h2><i class="dot-live"></i> Ahora mismo</h2><small class="sub">Se actualiza solo cada 30 segundos · ${nowHM()} h</small></div><div class="rt-list">${filas || `<p class="empty">Registra doctores para ver su estado.</p>`}</div></div>`);
};
setInterval(() => { if (CUR.v === "doctores" && TIEMPO_REAL && !$("#modal").classList.contains("open") && !$("#recibo")) refresh(); }, 30000);
setInterval(() => { if (CUR.v === "agenda" && TIEMPO_REAL && AG.modo === "dia" && AG.fecha === todayISO() && !$("#modal").classList.contains("open") && !$("#recibo")) refresh(); }, 60000);

// Reportes: cuánto duran las atenciones
const _reportes4 = VIEWS.reportes;
VIEWS.reportes = async () => {
  await _reportes4();
  const hoy = todayISO(), d = toD(hoy), P = CUR.rep || "mes";
  const per = { hoy: [hoy, hoy], semana: [lunes(hoy), hoy], mes: [`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`, hoy],
    pasado: (() => { const x = new Date(d.getFullYear(), d.getMonth() - 1, 1), y = new Date(d.getFullYear(), d.getMonth(), 0); const iso = z => `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, "0")}-${String(z.getDate()).padStart(2, "0")}`; return [iso(x), iso(y)]; })(),
    rango: [CUR.repA || addDays(hoy, -30), CUR.repB || hoy] }[P];
  const cs = (await DB.rango("citas", per[0], per[1])).filter(c => +c.duracion > 0);
  if (!cs.length) return;
  await cargarDocs();
  const agr = key => { const o = {}; cs.forEach(c => { const k = key(c) || "—"; (o[k] = o[k] || []).push(+c.duracion); }); return Object.entries(o).map(([k, v]) => [k, Math.round(v.reduce((a, b) => a + b, 0) / v.length), v.length]).sort((a, b) => b[2] - a[2]); };
  const fila = ([k, m, n]) => `<div class="li"><div><b>${esc(k)}</b><small>${n} atención${n > 1 ? "es" : ""}</small></div><b>${durTxt(m)}</b></div>`;
  $("#view").insertAdjacentHTML("beforeend", `<div class="two-col">
    <div class="card"><div class="card-h"><h2>${ic2("clock")} Duración promedio por servicio</h2></div><div class="list">${agr(c => c.servicio).slice(0, 8).map(fila).join("")}</div></div>
    <div class="card"><div class="card-h"><h2>${ic2("clock")} Duración promedio por doctor</h2></div><div class="list">${agr(c => c.vet).map(fila).join("")}</div></div></div>`);
};

/* =========================================================
   2) RECIBOS: imprimir, guardar en PDF o enviar por WhatsApp
   ========================================================= */
const numRecibo = (pre, f, id) => window.PDFV ? PDFV.num(pre, f, id) : pre + "-" + id;
const negocio = aj => ({ nombre: NOMBRE_V, razon: aj.razonSocial || "", ruc: aj.ruc || "", dir: aj.direccion || "", tel: aj.telefono || "", logo: MARCA.logo || "", color: MARCA.color1 || "#5b3df5",
  pie: aj.reciboPie || "", web: webBase().replace(/^https?:\/\//, "") + "mi-mascota" });
function reciboDeCita(c) {
  const t = totalDe(c), pag = +c.pagado || 0;
  return { num: numRecibo("C", c.fecha, c.id), fecha: (c.pagos || []).slice(-1)[0]?.fecha || todayISO(), hora: (c.pagos || []).slice(-1)[0]?.hora || nowHM(),
    cliente: c.dueno, cel: c.celular, code: c.code, mascota: c.mascota, vet: c.vet, detalle: `Cita del ${fmtD(c.fecha)} · ${c.hora} h`,
    items: [{ n: c.servicio, q: 1, p: precioBaseDe(c), principal: true }, ...(c.cargos || []).map(x => ({ n: x.n, q: +x.q || 1, p: +x.p || 0 }))], total: t, pagos: c.pagos || [], pagado: pag, saldo: r2(Math.max(t - pag, 0)) };
}
function reciboDeMov(m) {
  return { num: numRecibo(m.tipo === "venta" ? "V" : "P", m.fecha, m.id), fecha: m.fecha, hora: m.hora, cliente: m.cliente || "", code: m.code || "", mascota: "", vet: "",
    detalle: m.citaId ? m.concepto : "", items: (m.items || []).map(i => ({ n: i.n, q: i.q, p: i.p })), total: +m.total || 0,
    pagos: [{ monto: +m.total || 0, metodo: m.metodo, fecha: m.fecha, hora: m.hora }], pagado: +m.total || 0, saldo: 0, anulado: m.anulado };
}
async function verRecibo(r) {
  const aj = await cargarAjustes(); if (!MARCA.nombre1 && !MARCA.logo) await cargarMarca();
  $("#recibo")?.remove();
  const logo = MARCA.logo ? `<img src="${esc(foto(MARCA.logo, 200))}" alt="">` : `<span class="rc-paw">${ico("paw")}</span>`;
  const el = document.createElement("div"); el.id = "recibo"; el.className = "rc-wrap";
  el.innerHTML = `<div class="rc-paper">
      <div class="rc-head">${logo}<div><b>${esc(aj.razonSocial || NOMBRE_V)}</b>${aj.razonSocial && aj.razonSocial !== NOMBRE_V ? `<small>${esc(NOMBRE_V)}</small>` : ""}${aj.ruc ? `<small>RUC ${esc(aj.ruc)}</small>` : ""}<small>${esc(aj.direccion || "")}</small><small>${esc(aj.telefono || "")}</small></div></div>
      <div class="rc-title"><span>RECIBO</span><b>N° ${esc(r.num)}</b></div>
      ${r.anulado ? `<div class="rc-anul">ANULADO</div>` : ""}
      <div class="rc-meta"><div><small>Fecha</small><b>${fmt(r.fecha)} · ${esc(r.hora || "")}</b></div>${r.cliente ? `<div><small>Cliente</small><b>${esc(r.cliente)}</b></div>` : ""}${r.code ? `<div><small>Código</small><b>${esc(r.code)}</b></div>` : ""}${r.mascota ? `<div><small>Mascota</small><b>${esc(r.mascota)}</b></div>` : ""}${r.vet ? `<div><small>Atendió</small><b>${esc(r.vet)}</b></div>` : ""}</div>
      ${r.detalle ? `<p class="rc-det">${esc(r.detalle)}</p>` : ""}
      <table class="rc-items"><thead><tr><th>Descripción</th><th>Cant.</th><th>Importe</th></tr></thead><tbody>${r.items.map(i => `<tr><td>${esc(i.n)}${i.q > 1 ? `<small>${S(i.p)} c/u</small>` : ""}</td><td>${i.q}</td><td>${S(i.p * i.q)}</td></tr>`).join("")}</tbody></table>
      <div class="rc-tot"><div><span>Total</span><b>${S(r.total)}</b></div>
        ${r.pagos.map(p => `<div class="sm"><span>Pago ${esc(p.metodo || "")} · ${fmtD(p.fecha)}</span><span>${S(p.monto)}</span></div>`).join("")}
        <div><span>Pagado</span><b>${S(r.pagado)}</b></div>${r.saldo > 0 ? `<div class="due"><span>Saldo pendiente</span><b>${S(r.saldo)}</b></div>` : `<div class="ok"><span>Estado</span><b>Cancelado ✓</b></div>`}</div>
      <p class="rc-foot">${esc(aj.reciboPie || "¡Gracias por confiar en nosotros!")}${r.code ? `<br>Historial y pagos con tu código <b>${esc(r.code)}</b> en ${esc(webBase().replace(/^https?:\/\//, ""))}mi-mascota` : ""}</p>
      <p class="rc-legal">Comprobante interno de pago. No es boleta ni factura electrónica.</p>
    </div>
    <div class="rc-bar"><button class="btn btn-pri" data-rc="print">${ic2("print")} Imprimir</button><button class="btn btn-light" data-rc="pdf">${ic2("file")} Descargar PDF</button>${r.cel ? `<button class="btn btn-wa" data-rc="wa">${ico("wa")} WhatsApp</button>` : ""}<button class="btn btn-light" data-rc="x">Cerrar</button></div>`;
  document.body.appendChild(el);
  el.addEventListener("click", e => {
    const b = e.target.closest("[data-rc]"); if (!b && e.target === el) return el.remove(); if (!b) return;
    const k = b.dataset.rc;
    if (k === "x") return el.remove();
    if (k === "print") { document.body.classList.add("printing-rc"); setTimeout(() => { window.print(); document.body.classList.remove("printing-rc"); }, 50); }
    if (k === "pdf") { b.disabled = true; safe(() => PDFV.recibo({ ...r, neg: negocio(aj) })).finally(() => b.disabled = false); }
    if (k === "wa") {
      const L = [`Hola ${String(r.cliente || "").split(" ")[0]}, te saluda *${NOMBRE_V}*.`, "", `🧾 *Recibo N° ${r.num}*`, `Fecha: ${fmt(r.fecha)} ${r.hora || ""}`];
      if (r.mascota) L.push(`Mascota: ${r.mascota}`);
      if (r.vet) L.push(`Atendió: ${r.vet}`);
      L.push(""); r.items.forEach(i => L.push(`• ${i.q > 1 ? i.q + " x " : ""}${i.n}: ${S(i.p * i.q)}`));
      L.push("", `*Total: ${S(r.total)}*`, `Pagado: ${S(r.pagado)}${r.pagos.length ? " (" + [...new Set(r.pagos.map(p => p.metodo))].join(" + ") + ")" : ""}`);
      L.push(r.saldo > 0 ? `*Saldo pendiente: ${S(r.saldo)}*` : "Estado: *cancelado* ✓");
      if (r.code) L.push("", `Revisa tus pagos e historial con tu código *${r.code}*: ${portalLink(r.code)}`);
      L.push("", aj.reciboPie || "¡Gracias por confiar en nosotros!");
      openWA(r.cel, L.join("\n"));
    }
  });
}

const edadTxt = s => { if (!s) return ""; const m = Math.floor((Date.now() - toD(s)) / (30.44 * 864e5)); return m >= 12 ? `${Math.floor(m / 12)} año${m >= 24 ? "s" : ""}` : `${Math.max(m, 0)} meses`; };
function recetaDe(h, m, cl) {
  return { fecha: h.f, mascota: { nombre: m.nombre, especie: m.especie, raza: m.raza, peso: h.peso || m.peso, edad: edadTxt(m.nac) }, dueno: cl ? cl.dueno : "", cel: cl ? cl.celular : "", code: cl ? cl.codigo : "",
    vet: h.vet, servicio: h.t, diagnostico: h.d, meds: (h.meds || []).filter(x => x.n), ind: h.ind, control: h.control, controlMotivo: h.controlMotivo };
}
function reciboDeHist(h, m, cl) {
  const cargos = h.cargos || [], tot = +h.monto || 0, pag = +h.pagado || 0, base = h.base != null ? +h.base : r2(Math.max(tot - sumaCargos(cargos), 0));
  const pagos = (h.pagos && h.pagos.length) ? h.pagos : pag ? [{ monto: pag, metodo: h.metodo || "", fecha: h.f }] : [];
  return { num: numRecibo("C", h.f, h.citaId || h.id), fecha: (pagos.slice(-1)[0] || {}).fecha || h.f, hora: (pagos.slice(-1)[0] || {}).hora || "", cliente: cl ? cl.dueno : "", cel: cl ? cl.celular : "", code: cl ? cl.codigo : "",
    mascota: m.nombre, vet: h.vet, detalle: `Atención del ${fmtD(h.f)}${h.hora ? " · " + h.hora + " h" : ""}`, items: [{ n: h.t, q: 1, p: base, principal: true }, ...cargos.map(x => ({ n: x.n, q: +x.q || 1, p: +x.p || 0 }))],
    total: tot, pagos, pagado: pag, saldo: r2(Math.max(tot - pag, 0)) };
}
async function verReceta(r) {
  const aj = await cargarAjustes(); if (!MARCA.nombre1 && !MARCA.logo) await cargarMarca();
  $("#recibo")?.remove();
  const logo = MARCA.logo ? `<img src="${esc(foto(MARCA.logo, 200))}" alt="">` : `<span class="rc-paw">${ico("paw")}</span>`, mm = r.mascota || {};
  const el = document.createElement("div"); el.id = "recibo"; el.className = "rc-wrap";
  el.innerHTML = `<div class="rc-paper rx-paper">
      <div class="rc-head">${logo}<div><b>${esc(aj.razonSocial || NOMBRE_V)}</b>${aj.ruc ? `<small>RUC ${esc(aj.ruc)}</small>` : ""}<small>${esc(aj.direccion || "")}</small><small>${esc(aj.telefono || "")}</small></div></div>
      <div class="rc-title"><span>RECETA</span><b>${fmt(r.fecha)}</b></div>
      <div class="rc-meta"><div><small>Mascota</small><b>${esc(mm.nombre || "")}</b></div><div><small>Especie / raza</small><b>${esc([mm.especie, mm.raza].filter(Boolean).join(" · "))}</b></div>${mm.peso ? `<div><small>Peso</small><b>${esc(mm.peso)}</b></div>` : ""}${mm.edad ? `<div><small>Edad</small><b>${esc(mm.edad)}</b></div>` : ""}<div><small>Dueño(a)</small><b>${esc(r.dueno || "")}</b></div><div><small>Doctor(a)</small><b>${esc(r.vet || "")}</b></div></div>
      ${r.diagnostico ? `<p class="rc-det"><b>Diagnóstico:</b> ${esc(r.diagnostico)}</p>` : ""}
      <div class="rx-rp"><i>Rp.</i> Medicamentos para la casa</div>
      ${r.meds.length ? `<ol class="rx-list">${r.meds.map(x => `<li><b>${esc(x.n)}</b><small>${esc([x.dosis && "Dosis: " + x.dosis, x.cada && "Cada " + x.cada, x.dias && "Por " + x.dias + (/^\d+$/.test(x.dias) ? " días" : "")].filter(Boolean).join(" · "))}</small></li>`).join("")}</ol>` : `<p class="rc-det">Sin medicamentos recetados.</p>`}
      ${r.ind ? `<div class="rx-ind"><small>Indicaciones</small>${esc(r.ind)}</div>` : ""}
      ${r.control ? `<p class="rx-ctrl">Próximo control: ${fmt(r.control)}${r.controlMotivo ? " · " + esc(r.controlMotivo) : ""}</p>` : ""}
      <div class="rx-firma"><span></span><b>${esc(r.vet || "Médico veterinario")}</b><small>Médico veterinario</small></div>
    </div>
    <div class="rc-bar"><button class="btn btn-pri" data-rx="print">${ic2("print")} Imprimir</button><button class="btn btn-light" data-rx="pdf">${ic2("file")} Descargar PDF</button>${r.cel ? `<button class="btn btn-wa" data-rx="wa">${ico("wa")} WhatsApp</button>` : ""}<button class="btn btn-light" data-rx="x">Cerrar</button></div>`;
  document.body.appendChild(el);
  el.addEventListener("click", e => {
    const b = e.target.closest("[data-rx]"); if (!b && e.target === el) return el.remove(); if (!b) return;
    const k = b.dataset.rx;
    if (k === "x") return el.remove();
    if (k === "print") { document.body.classList.add("printing-rc"); setTimeout(() => { window.print(); document.body.classList.remove("printing-rc"); }, 50); }
    if (k === "pdf") { b.disabled = true; safe(() => PDFV.receta({ ...r, neg: negocio(aj) })).finally(() => b.disabled = false); }
    if (k === "wa") {
      const L = [`Hola ${String(r.dueno || "").split(" ")[0]}, te saluda *${NOMBRE_V}*.`, "", `💊 *Receta de ${mm.nombre}* (${fmt(r.fecha)})`, `Doctor(a): ${r.vet || ""}`, ""];
      r.meds.forEach((x, i) => L.push(`${i + 1}. *${x.n}*${x.dosis ? " – " + x.dosis : ""}${x.cada ? ", cada " + x.cada : ""}${x.dias ? ", por " + x.dias + (/^\d+$/.test(x.dias) ? " días" : "") : ""}`));
      if (r.ind) L.push("", `*Indicaciones:* ${r.ind}`);
      if (r.control) L.push("", `*Próximo control:* ${fmt(r.control)}${r.controlMotivo ? " – " + r.controlMotivo : ""}`);
      if (r.code) L.push("", `Descárgala en PDF desde Mi Mascota: ${portalLink(r.code)}`);
      openWA(r.cel, L.join("\n"));
    }
  });
}

// botón "Recibo" en la tarjeta de cita y en Caja
document.addEventListener("click", async e => {
  const t = e.target.closest("button"); if (!t || !$("#view").contains(t)) return;
  const box = t.closest("[data-cid]");
  if (box && t.dataset.act) {
    const c = CITAS[box.dataset.cid]; if (!c) return;
    if (t.dataset.act === "recibo") { const fresh = await DB.getDocX("citas", c.id); return verRecibo(reciboDeCita({ ...c, ...(fresh || {}), id: c.id })); }
    if (t.dataset.act === "receta") return safe(async () => { const [cl, m] = await Promise.all([DB.getCliente(c.code), DB.getMascota(c.code, c.mascotaId)]);
      const h = ((m && m.historial) || []).find(x => x.citaId === c.id); if (!h) return toast("Primero guarda la ficha de la atención", true); verReceta(recetaDe(h, m, cl)); });
    if (t.dataset.act === "ini") return safe(() => iniciarAtencion(c));
    if (t.dataset.act === "fin") return safe(() => terminarAtencion(c));
  }
  if (t.dataset.recibo && CUR.movs) { const m = CUR.movs.find(x => x.id === t.dataset.recibo); if (m) return verRecibo(reciboDeMov(m)); }
});
// Caja: botón de recibo en cada movimiento
const _caja4 = VIEWS.caja;
VIEWS.caja = async () => {
  await _caja4();
  $$(".mtable tbody tr").forEach((tr, i) => { const m = CUR.movs[i]; if (!m) return; const td = tr.lastElementChild; if (td) td.insertAdjacentHTML("afterbegin", `<button class="icon-btn" data-recibo="${esc(m.id)}" title="Recibo">${ic2("receipt")}</button>`); });
};
// Cobrar y Venta rápida: opción "mostrar recibo al terminar"
const _cobrar4 = cobrar;
cobrar = async function (c) {   // eslint-disable-line no-global-assign
  await _cobrar4(c);
  const g = $("#modalForm .grid2"); if (!g) return;
  g.insertAdjacentHTML("beforeend", fld("recibo", "Mostrar el recibo al terminar (imprimir o PDF)", false, { type: "checkbox", full: true }));
  const base = mSubmit;
  mSubmit = async d => { const r = await base(d); if (r === false) return false;
    if (d.recibo) { const fresh = await DB.getDocX("citas", c.id); setTimeout(() => verRecibo(reciboDeCita({ ...c, ...(fresh || {}), id: c.id })), d.atender ? 500 : 150); } };
};
const _venta4 = ventaRapida;
ventaRapida = async function () {   // eslint-disable-line no-global-assign
  await _venta4();
  const g = $("#modalForm .grid2"); if (!g) return;
  g.insertAdjacentHTML("beforeend", fld("recibo", "Mostrar el recibo al terminar", true, { type: "checkbox", full: true }));
  const base = mSubmit;
  mSubmit = async d => { const r = await base(d); if (r === false) return false;
    if (d.recibo) { const ms = (await DB.rango("movimientos", todayISO(), todayISO())).filter(m => m.tipo === "venta").sort((a, b) => String(b.actualizado || b.creado || "").localeCompare(String(a.actualizado || a.creado || ""))); if (ms[0]) setTimeout(() => verRecibo(reciboDeMov(ms[0])), 300); } };
};

/* =========================================================
   3) FOTOS EN EL HISTORIAL (radiografías, heridas, análisis)
   ========================================================= */
const MAX_FOTOS = 4;
const _ficha4 = fichaAtencion;
fichaAtencion = async function (c, modo = "atender") {   // eslint-disable-line no-global-assign
  await _ficha4(c, modo);
  const g = $("#modalForm .grid2"); if (!g || !$("#medList")) return;
  let h = {};
  if (c.code && c.mascotaId) { const m = await DB.getMascota(c.code, c.mascotaId); h = ((m && m.historial) || []).find(x => x.citaId === c.id) || {}; }
  const viejas = (h.fotos || []).slice(), nuevas = [], quitar = [];
  const ok = c.code && c.mascotaId;
  const enviar = $("[name=enviar]", g)?.closest(".chk");
  const html = `<div class="field full"><label>Fotos de la atención · radiografías, heridas, análisis (máx. ${MAX_FOTOS})</label>
    ${ok ? `<div class="gal-up" id="hfUp">${viejas.map(id => `<span class="g" data-old="${esc(id)}"><span class="ph-load"></span><button type="button" data-hfdel aria-label="Quitar">×</button></span>`).join("")}
      <label class="g add" title="Agregar foto">${ic2("image")}<input type="file" accept="image/*" multiple hidden id="hfFile"></label></div>
      <small class="sub">El cliente también las verá en Mi Mascota. Se comprimen para que carguen rápido.</small>`
    : `<p class="sub">Vincula la cita a un cliente para poder guardar fotos.</p>`}</div>`;
  if (enviar) enviar.insertAdjacentHTML("beforebegin", html); else g.insertAdjacentHTML("beforeend", html);
  if (!ok) return;
  const up = $("#hfUp");
  viejas.forEach(async id => { const src = await DB.getFoto(c.code, id).catch(() => null); const s = $(`[data-old="${CSS.escape(id)}"]`, up); if (s) s.innerHTML = src ? `<img src="${src}" alt=""><button type="button" data-hfdel aria-label="Quitar">×</button>` : `<small>No disponible</small><button type="button" data-hfdel aria-label="Quitar">×</button>`; });
  const total = () => $$(".g:not(.add)", up).length;
  $("#hfFile").addEventListener("change", async e => {
    for (const f of [...e.target.files]) {
      if (total() >= MAX_FOTOS) { toast(`Máximo ${MAX_FOTOS} fotos por atención`, true); break; }
      const data = await resizeImage(f, 1280, .72); const k = nuevas.push(data) - 1;
      up.querySelector(".add").insertAdjacentHTML("beforebegin", `<span class="g" data-new="${k}"><img src="${data}" alt=""><button type="button" data-hfdel aria-label="Quitar">×</button></span>`);
    }
    e.target.value = "";
  });
  up.addEventListener("click", e => { const b = e.target.closest("[data-hfdel]"); if (!b) return; const s = b.closest(".g");
    if (s.dataset.old) quitar.push(s.dataset.old); if (s.dataset.new != null) nuevas[+s.dataset.new] = null; s.remove(); });
  const base = mSubmit;
  mSubmit = async d => {
    const r = await base(d); if (r === false) return false;
    if (!nuevas.some(Boolean) && !quitar.length) return;
    await safe(async () => {
      const ids = [];
      for (const data of nuevas.filter(Boolean)) ids.push(await DB.saveFoto(c.code, data, { mascotaId: c.mascotaId, citaId: c.id }));
      for (const id of quitar) await DB.delFoto(c.code, id).catch(() => {});
      const m = await DB.getMascota(c.code, c.mascotaId), his = (m && m.historial) || [], i = his.findIndex(x => x.citaId === c.id);
      if (i >= 0) { his[i].fotos = [...(his[i].fotos || []).filter(id => !quitar.includes(id)), ...ids].slice(0, MAX_FOTOS); await DB.saveMascota(c.code, c.mascotaId, { historial: his }); }
      toast(ids.length ? `${ids.length} foto(s) guardada(s) en el historial` : "Fotos actualizadas");
      if (CUR.v === "mascota") refresh();
    });
  };
};

// Fotos visibles en la ficha de la mascota (panel)
const _mascota4 = VIEWS.mascota;
VIEWS.mascota = async p => {
  await _mascota4(p);
  const m = CUR.m; if (!m) return;
  for (const hx of (m.historial || [])) {
    const del = $(`[data-del-item="historial"][data-id="${CSS.escape(hx.id)}"]`); if (!del) continue;
    const tieneRx = (hx.meds || []).some(x => x.n) || hx.ind, tieneRc = +hx.monto > 0 || +hx.pagado > 0;
    if ((hx.cargos || []).length) del.previousElementSibling.insertAdjacentHTML("beforeend", `<p class="h-cg"><b>Usado en la atención:</b> ${hx.cargos.map(x => `${x.q > 1 ? x.q + " × " : ""}${esc(x.n)} (${S(x.q * x.p)})`).join(" · ")}</p>`);
    if (tieneRx || tieneRc) del.previousElementSibling.insertAdjacentHTML("beforeend", `<div class="h-docs">${tieneRc ? `<button type="button" class="btn btn-light btn-sm" data-hrc="${esc(hx.id)}">${ic2("receipt")} Recibo</button>` : ""}${tieneRx ? `<button type="button" class="btn btn-light btn-sm" data-hrx="${esc(hx.id)}">${ico("paw")} Receta</button>` : ""}</div>`);
  }
  for (const hx of (m.historial || []).filter(x => (x.fotos || []).length)) {
    const del = $(`[data-del-item="historial"][data-id="${CSS.escape(hx.id)}"]`); if (!del) continue;
    const box = document.createElement("div"); box.className = "h-fotos"; box.innerHTML = hx.fotos.map(() => `<span class="ph-load"></span>`).join("");
    del.previousElementSibling.appendChild(box);
    Promise.all(hx.fotos.map(id => DB.getFoto(p.code, id).catch(() => null))).then(src => { box.innerHTML = src.filter(Boolean).map(x => `<button type="button" class="h-foto" data-zoom><img src="${x}" alt=""></button>`).join(""); });
  }
};
document.addEventListener("click", e => {
  const b = e.target.closest("[data-hrc], [data-hrx]"); if (!b || CUR.v !== "mascota") return;
  const id = b.dataset.hrc || b.dataset.hrx, h = (CUR.m.historial || []).find(x => x.id === id); if (!h) return;
  if (b.dataset.hrc) verRecibo(reciboDeHist(h, CUR.m, CUR.cliente)); else verReceta(recetaDe(h, CUR.m, CUR.cliente));
});
document.addEventListener("click", e => {
  const z = e.target.closest("[data-zoom]"); if (!z) return;
  e.stopPropagation();
  const lb = document.createElement("div"); lb.className = "lightbox"; lb.innerHTML = `<img src="${z.querySelector("img").src}" alt=""><button type="button" aria-label="Cerrar">×</button>`;
  document.body.appendChild(lb); lb.addEventListener("click", () => lb.remove());
}, true);

/* =========================================================
   AJUSTES: datos del recibo y atención en tiempo real
   ========================================================= */
const _ajustes4 = VIEWS.ajustes;
VIEWS.ajustes = async () => {
  await _ajustes4();
  const a = await cargarAjustes(), F = $("#ajForm"); if (!F) return;
  const last = F.lastElementChild;
  last.insertAdjacentHTML("beforebegin", `
    <div class="card-h" style="margin-top:10px"><h2>${ic2("receipt")} Datos del recibo</h2></div>
    <div class="grid2">
      ${fld("razonSocial", "Nombre o razón social", a.razonSocial || "", { ph: "Ej. Veterinaria Huellitas E.I.R.L." })}
      ${fld("ruc", "RUC (opcional)", a.ruc || "", { ph: "20123456789", extra: 'inputmode="numeric" maxlength="11"' })}
      ${fld("reciboPie", "Mensaje al pie del recibo", a.reciboPie || "", { full: true, ph: "¡Gracias por confiar en nosotros!" })}
    </div>
    <div class="card-h" style="margin-top:10px"><h2>${ic2("clock")} Atención en tiempo real</h2></div>
    ${fld("tiempoReal", "Usar «Iniciar atención» y «Terminar» en la agenda", !!a.tiempoReal, { type: "checkbox", ph: "Muestra en Doctores quién está atendiendo, quién va retrasado y cuánto dura cada atención. Si no lo usan, desactívalo y todo funciona igual." })}
    <div style="height:14px"></div>`);
  F.addEventListener("submit", async () => {
    if ($$("[required]", F).some(x => !x.value.trim())) return;
    const ruc = $("[name=ruc]", F).value.replace(/\D/g, "");
    if (ruc && ruc.length !== 11) return toast("El RUC debe tener 11 dígitos", true);
    await safe(() => DB.saveAjustes({ razonSocial: $("[name=razonSocial]", F).value.trim(), ruc, reciboPie: $("[name=reciboPie]", F).value.trim(), tiempoReal: $("[name=tiempoReal]", F).checked }));
  });
};
