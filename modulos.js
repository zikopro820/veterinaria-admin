/* =========================================================
   MÓDULOS: Agenda · Caja · Reportes · Inventario · Personalizar web
   ========================================================= */
const MET = ["Efectivo", "Yape", "Plin", "Tarjeta", "Transferencia"];
const DIAS_L = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const r2 = n => Math.round((+n || 0) * 100) / 100;
const S = n => "S/ " + r2(n).toFixed(2);
const nowHM = () => { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const largo = f => { const d = toD(f); return `${DIAS_L[d.getDay()]} ${d.getDate()} de ${MESES_L[d.getMonth()]}`; };
const aMin = t => { const [h, m] = String(t || "0:00").split(":").map(Number); return h * 60 + (m || 0); };
const aHora = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const lunes = f => { const d = toD(f); const k = (d.getDay() + 6) % 7; return addDays(f, -k); };
const I2 = {
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  left: '<path d="M15 18l-6-6 6-6"/>', right: '<path d="M9 18l6-6-6-6"/>', print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>', palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><path d="M12 2a10 10 0 1 0 0 20c1 0 1.5-.8 1.5-1.6 0-.5-.3-.9-.3-1.4 0-.9.7-1.5 1.6-1.5H17a5 5 0 0 0 5-5c0-5-4.5-8.5-10-8.5z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
};
const ic2 = k => `<svg class="ico" viewBox="0 0 24 24">${I2[k]}</svg>`;

/* ---------- Datos que se usan en varias pantallas ---------- */
let NOMBRE_V = A.nombre;
async function cargarAjustes() { return { ...(window.DATOS?.ajustes || {}), ...(await DB.getAjustes()) }; }
async function cargarMarca() {
  try {
    const w = await DB.getWeb(), m = w.marca || {};
    NOMBRE_V = ((m.nombre1 || "") + (m.nombre2 || "")).trim() || A.nombre;
    const b = $(".side .brand");
    if (b) b.innerHTML = `<span class="paw">${m.logo ? `<img src="${esc(foto(m.logo, 120))}" alt="">` : b.querySelector(".paw").innerHTML}</span><span>${esc(NOMBRE_V)}<small>Panel</small></span>`;
    if (m.color1) document.documentElement.style.setProperty("--pri", m.color1);
  } catch (e) { console.warn(e); }
}
function horasDia(f, aj) {
  const dom = toD(f).getDay() === 0, fin = dom ? aj.domingoCierra : aj.cierra; if (!fin) return [];
  const paso = +aj.turno || 30, out = [];
  for (let t = aMin(aj.abre); t + paso <= aMin(fin); t += paso) out.push(aHora(t));
  return out;
}
const totalDe = c => +(c.total ?? c.precio) || 0;
function pagoInfo(c) {
  const t = totalDe(c), p = +c.pagado || 0, saldo = r2(Math.max(t - p, 0));
  if (t > 0 && p >= t) return { cls: "ok", txt: "Pagado", wa: `Pagado (${S(p)})`, saldo: 0 };
  if (p > 0) return { cls: "warn", txt: `Adelanto ${S(p)} · Saldo ${S(saldo)}`, wa: `Adelanto ${S(p)} · *Saldo pendiente ${S(saldo)}*`, saldo };
  return { cls: "bad", txt: t ? `Pago pendiente · ${S(t)}` : "Pago pendiente", wa: t ? `Pendiente (${S(t)})` : "Pendiente (precio a confirmar)", saldo };
}
function msgCitaWA(c, aj) {
  const n = String(c.dueno || "").split(" ")[0], p = pagoInfo(c), at = c.estado === "atendida";
  const L = [`Hola ${n}, te saluda *${NOMBRE_V}*.`, "", at ? "Resumen de la atención:" : "Tu cita está *confirmada*:",
    `• Mascota: ${c.mascota}`, `• Servicio: ${c.servicio}`, `• Fecha: ${largo(c.fecha)}`, `• Hora: ${c.hora} h`];
  if (c.vet) L.push(`• Atiende: ${c.vet}`);
  if (totalDe(c)) L.push(`• Precio: ${S(totalDe(c))}`);
  L.push(`• Pago: ${p.wa}`);
  if (c.domicilio && !at) L.push(`• *Atención a domicilio:* ${[c.dirCliente, c.distrito].filter(Boolean).join(", ")}${c.referencia ? " (Ref: " + c.referencia + ")" : ""}`);
  else if (aj && aj.direccion && !at) L.push(`• Dirección: ${aj.direccion}`);
  if (c.code) L.push("", `Tus citas y pagos con tu código *${c.code}*: ${portalLink(c.code)}`);
  L.push("", at ? "¡Gracias por confiar en nosotros!" : c.domicilio ? "Te escribiremos cuando estemos en camino. Si necesitas reprogramar, responde este mensaje." : "Te esperamos 10 minutos antes. Si necesitas reprogramar, responde este mensaje.");
  return L.join("\n");
}

/* ---------- Tarjeta de cita (agenda, inicio, ficha) ---------- */
let CITAS = {};
function citaCard(c, opt = {}) {
  CITAS[c.id] = c;
  const p = pagoInfo(c), at = c.estado === "atendida", pas = c.fecha < todayISO() || (c.fecha === todayISO() && aMin(c.hora) < aMin(nowHM()) - 60);
  return `<div class="cita ${at ? "done" : ""} ${!at && pas ? "late" : ""}" data-cid="${esc(c.id)}">
    <div class="c-top">${opt.fecha ? `<span class="c-hora">${fmtD(c.fecha)} · ${esc(c.hora)}</span>` : `<span class="c-hora">${esc(c.hora)}</span>`}
      <div class="c-info"><b>${esc(c.mascota || "—")}</b> <span class="c-serv">${esc(c.servicio)}</span>
        <small>${esc(c.dueno || "")}${c.celular ? " · " + esc(c.celular) : ""}</small>
        <div class="badges">${(() => { const dd = typeof DOCS !== "undefined" && DOCS.find(x => x.id === c.vetId);
          if (!c.vet) return at ? "" : `<span class="st warn">Sin doctor asignado</span>`;
          return `<span class="st doc" style="--dc:${esc((dd && dd.color) || "#5b3df5")}">${esc(c.vet)}</span>` + (!at && dd && ausente(dd, c.fecha) ? `<span class="st bad">Doctor ausente · reasignar</span>` : ""); })()}${at ? `<span class="st ok">Atendida</span>` : ""}<span class="st ${p.cls}">${p.txt}</span>${c.origen === "web" ? `<span class="st info">Web</span>` : ""}${!c.code ? `<span class="st">Sin código</span>` : `<span class="st">${esc(c.code)}</span>`}${!at && pas ? `<span class="st warn">Por cerrar</span>` : ""}</div>
        ${c.domicilio ? `<p class="c-dom">${ico("home")} <b>A domicilio:</b> ${esc([c.dirCliente, c.distrito].filter(Boolean).join(", "))}${c.referencia ? ` · Ref: ${esc(c.referencia)}` : ""}${c.ubicacion ? ` · <a href="${esc(/^https?:/.test(c.ubicacion) ? c.ubicacion : "https://www.google.com/maps/search/" + encodeURIComponent(c.ubicacion))}" target="_blank" rel="noopener">Ver mapa</a>` : ` · <a href="https://www.google.com/maps/search/${encodeURIComponent([c.dirCliente, c.distrito].join(", "))}" target="_blank" rel="noopener">Ver mapa</a>`}</p>` : ""}
        ${c.motivo ? `<p class="c-mot">“${esc(c.motivo)}”</p>` : ""}</div></div>
    <div class="c-acts">
      <button class="btn btn-wa btn-sm" data-act="wa" title="Enviar por WhatsApp">${ico("wa")}<span>WhatsApp</span></button>
      ${p.saldo > 0 || !totalDe(c) ? `<button class="btn btn-light btn-sm" data-act="cobrar">${ic2("cash")}<span>Cobrar</span></button>` : ""}
      ${!at ? `<button class="btn btn-light btn-sm" data-act="asignar">${ico("users")}<span>${c.vet ? "Doctor" : "Asignar doctor"}</span></button>` : ""}
      ${!at ? `<button class="btn btn-light btn-sm" data-act="atender">${ico("check")}<span>Atendida</span></button>` : c.code && c.mascotaId ? `<button class="btn btn-light btn-sm" data-act="diag">${ico("edit")}<span>Ficha clínica</span></button>` : ""}
      ${!c.code || !c.mascotaId ? `<button class="btn btn-light btn-sm" data-act="vincular">${ic2("link")}<span>Vincular</span></button>` : c.mascotaId ? `<button class="btn btn-light btn-sm" data-act="ficha">${ico("paw")}<span>Ficha</span></button>` : ""}
      ${!at ? `<button class="icon-btn" data-act="cancelar" title="Cancelar cita">${ico("trash")}</button>` : ""}
    </div></div>`;
}

/* =========================================================
   CITAS: crear, cobrar, atender, vincular, cancelar
   ========================================================= */
async function opcionesHora(fecha, aj, sel) {
  const [cs, ts] = await Promise.all([DB.rango("citas", fecha, fecha), DB.turnosRango(fecha, fecha)]);
  await cargarDocs();
  const occ = {};
  ts.forEach(t => occ[t.hora] = (occ[t.hora] || 0) + 1);
  const hoy = fecha === todayISO(), ahora = aMin(nowHM());
  const hs = horasDia(fecha, aj), cap = h => capSlot(fecha, h, aj);
  const libres = hs.filter(h => (occ[h] || 0) < cap(h) && !(hoy && aMin(h) < ahora - 30));
  if (!hs.length) return `<option value="">Día sin atención (puedes cambiar el horario en Ajustes)</option>`;
  if (!libres.length) return `<option value="">No hay horarios libres este día</option>`;
  return libres.map(h => `<option value="${h}" ${h === sel ? "selected" : ""}>${h} h · ${cap(h) - (occ[h] || 0)} doctor(es) libre(s)</option>`).join("");
}
async function nuevaCita(pre = {}) {
  const [aj, cls, svs] = await Promise.all([cargarAjustes(), DB.listClientes(), DB.listCol("servicios")]);
  const servs = ordenar(svs.length ? svs : window.DATOS.servicios);
  const fecha0 = pre.fecha || todayISO();
  modal("Nueva cita", `
    <div class="grid2">
      ${fld("cli", "Cliente", pre.code || "", { full: true, opts: [["", "— Cliente nuevo o sin código —"], ...cls.sort((a, b) => a.dueno.localeCompare(b.dueno)).map(c => [c.codigo, `${c.dueno} · ${c.codigo}`])] })}
      <div class="full grid2 sub-grid" id="ncNew">
        ${fld("dueno", "Nombre del dueño(a)", "", { req: true })}
        ${fld("celular", "Celular", "", { req: true, type: "tel" })}
      </div>
      <div class="field full" id="ncPetSel"><label>Mascota *</label><select name="mid"></select></div>
      <div class="full grid2 sub-grid" id="ncPetNew">
        ${fld("mascota", "Nombre de la mascota", "", { req: true })}
        ${fld("especie", "Especie", "Perro", { opts: ["Perro", "Gato", "Conejo", "Ave", "Otro"] })}
      </div>
      ${fld("sid", "Servicio", pre.sid || servs[0]?.id, { req: true, opts: servs.map(x => [x.id, x.n + (+x.p ? ` · desde S/ ${x.p}` : "") + (x.domicilio ? " · a domicilio" : "")]) })}
      ${fld("precio", "Precio (S/)", servs.find(x => x.id === (pre.sid || servs[0]?.id))?.p || 0, { type: "number", extra: 'min="0" step="0.5"' })}
      ${fld("fecha", "Fecha", fecha0, { req: true, type: "date" })}
      <div class="field"><label>Hora *</label><select name="hora" required><option>Cargando…</option></select></div>
      <div class="full grid2 sub-grid dom-box" id="ncDom">
        ${fld("dirCliente", "Dirección del cliente (a domicilio)", "", { req: true, full: true, ph: "Calle, número, dpto." })}
        ${fld("distrito", "Distrito", "", { req: true })}
        ${fld("referencia", "Referencia", "", { ph: "Opcional" })}
      </div>
      <div class="field"><label>Doctor</label><select name="vetId"><option value="">Asignar después</option></select></div>
      ${fld("motivo", "Motivo / notas", "", { ph: "Opcional" })}
      ${fld("adelanto", "Adelanto recibido (S/)", "", { type: "number", ph: "0 si no pagó nada", extra: 'min="0" step="0.5"' })}
      ${fld("metodo", "Forma de pago del adelanto", "Efectivo", { opts: MET })}
      ${fld("enviar", "Enviar la cita por WhatsApp al cliente", true, { type: "checkbox", full: true })}
    </div>`, async d => {
    const cap = Math.max(1, +aj.capacidad || 1), sv = servs.find(x => x.id === d.sid) || {};
    if (!d.hora) { toast("Elige un horario libre", true); return false; }
    let dueno = d.dueno, celular = d.celular, code = d.cli || "", mid = "", mascota = d.mascota, especie = d.especie;
    if (code) {
      const c = cls.find(x => x.codigo === code); dueno = c.dueno; celular = c.celular;
      if (d.mid && d.mid !== "__nueva") { const m = PETS.find(x => x.id === d.mid); mid = m.id; mascota = m.nombre; especie = m.especie; }
      else mid = await DB.saveMascota(code, null, { nombre: mascota, especie, raza: "", vacunas: [], historial: [], rec: [] });
    } else if (celular.replace(/\D/g, "").length < 9) { toast("Celular no válido", true); return false; }
    const dom = !!sv.domicilio;
    const precio = r2(d.precio), base = { fecha: d.fecha, hora: d.hora, servicioId: sv.id || "", servicio: sv.n || "Consulta", precio, total: precio, pagado: 0, pagos: [], estadoPago: "pendiente",
      domicilio: dom, dirCliente: dom ? d.dirCliente : "", distrito: dom ? d.distrito : "", referencia: dom ? d.referencia : "", ubicacion: "",
      code, mascotaId: mid, mascota, especie, raza: "", dueno, celular, motivo: d.motivo, origen: "panel", estado: "confirmada", vetId: d.vetId || "", vet: (DOCS.find(x => x.id === d.vetId) || {}).n || "", sede: "" };
    const id = await DB.crearCita(base, cap);
    if (!id) { toast("Ese horario ya se llenó. Elige otro.", true); return false; }
    let c = { ...base, id };
    if (+d.adelanto > 0) c = await registrarPago(c, r2(d.adelanto), d.metodo, "Adelanto");
    toast("Cita registrada");
    if (d.enviar) openWA(celular, msgCitaWA(c, aj));
    AG.fecha = d.fecha; AG.modo = "dia"; go("agenda");
  }, "Guardar cita");
  let PETS = [];
  const F = $("#modalForm"), cli = $("[name=cli]", F), fecha = $("[name=fecha]", F), hora = $("[name=hora]", F);
  const req = (box, on) => { box.style.display = on ? "" : "none"; $$("[data-req], input, select", box).forEach(x => { if (x.closest(".field") && x.type !== "checkbox") x.required = on && !["especie", "referencia"].includes(x.name); }); };
  async function onCli() {
    const code = cli.value; req($("#ncNew"), !code);
    if (!code) { $("#ncPetSel").style.display = "none"; req($("#ncPetNew"), true); return; }
    PETS = await DB.listMascotas(code);
    $("#ncPetSel").style.display = ""; $("[name=mid]", F).innerHTML = PETS.map(m => `<option value="${esc(m.id)}" ${m.id === pre.mid ? "selected" : ""}>${esc(m.nombre)} (${esc(m.especie)})</option>`).join("") + `<option value="__nueva">+ Otra mascota</option>`;
    onPet();
  }
  const onPet = () => req($("#ncPetNew"), cli.value && $("[name=mid]", F).value !== "__nueva" ? false : true);
  async function onHora() {
    const cs = await DB.rango("citas", fecha.value, fecha.value), sel = $("[name=vetId]", F);
    const l = hora.value ? estadoDocs(fecha.value, hora.value, aj, cs) : [];
    sel.innerHTML = `<option value="">Asignar después</option>` + l.map(x => `<option value="${esc(x.d.id)}" ${x.est !== "libre" ? "disabled" : ""}>${esc(x.d.n)} · ${EST_TXT[x.est][1].toLowerCase()}</option>`).join("");
    const libre = l.find(x => x.est === "libre"); if (libre) sel.value = libre.d.id;
  }
  async function onFecha() { hora.innerHTML = await opcionesHora(fecha.value, aj, pre.hora); await onHora(); }
  hora.addEventListener("change", onHora);
  cli.addEventListener("change", onCli); $("[name=mid]", F).addEventListener("change", onPet); fecha.addEventListener("change", onFecha);
  const onSv = () => { const s = servs.find(x => x.id === $("[name=sid]", F).value); req($("#ncDom"), !!(s && s.domicilio)); };
  $("[name=sid]", F).addEventListener("change", e => { const s = servs.find(x => x.id === e.target.value); $("[name=precio]", F).value = s ? s.p || 0 : 0; onSv(); });
  await onCli(); await onFecha(); onSv();
}
async function registrarPago(c, monto, metodo, etiqueta) {
  const f = todayISO(), h = nowHM();
  const cg = (c.cargos || []).reduce((a, x) => a + (Math.max(1, +x.q || 1)) * (+x.p || 0), 0), tt = totalDe(c);
  const pIns = cg > 0 && tt > 0 ? r2(monto * Math.min(cg / tt, 1)) : 0;
  const items = [{ tipo: "servicio", n: c.servicio, q: 1, p: r2(monto - pIns) }, ...(pIns ? [{ tipo: "insumo", n: "Medicamentos y materiales de la atención", q: 1, p: pIns }] : [])];
  await DB.saveDocCol("movimientos", null, { fecha: f, hora: h, tipo: "servicio", concepto: `${etiqueta} · ${c.servicio} – ${c.mascota}`, total: monto, metodo,
    items, citaId: c.id, code: c.code || "", cliente: c.dueno || "", anulado: false });
  const pagado = r2((+c.pagado || 0) + monto), t = totalDe(c);
  const patch = { pagado, pagos: [...(c.pagos || []), { monto, metodo, fecha: f, hora: h }], estadoPago: t > 0 && pagado >= t ? "pagado" : pagado > 0 ? "adelanto" : "pendiente" };
  await DB.guardarCita(c.id, patch);
  const nc = { ...c, ...patch };
  if (nc.estado === "atendida") await syncHistorial(nc);
  return nc;
}
async function syncHistorial(c, extra = {}) {   // crea o actualiza la atención en el historial de la mascota
  if (!c.code || !c.mascotaId) return;
  const m = await DB.getMascota(c.code, c.mascotaId); if (!m) return;
  const cg = (c.cargos || []).reduce((a, x) => a + (Math.max(1, +x.q || 1)) * (+x.p || 0), 0);
  const datos = { monto: totalDe(c), pagado: +c.pagado || 0, metodo: [...new Set((c.pagos || []).map(p => p.metodo))].join(" + "),
    base: c.precioBase != null && c.precioBase !== "" ? +c.precioBase : r2(Math.max(totalDe(c) - cg, 0)), cargos: c.cargos || [], pagos: (c.pagos || []).map(p => ({ monto: +p.monto || 0, metodo: p.metodo || "", fecha: p.fecha || "", hora: p.hora || "" })) };
  const his = m.historial || [], i = his.findIndex(x => x.citaId === c.id);
  if (i >= 0) his[i] = { ...his[i], ...datos, ...extra };
  else his.push({ id: uid(), f: c.fecha, hora: c.hora, t: c.servicio, d: "", vet: c.vet || "", peso: "", citaId: c.id, ...datos, ...extra });
  await DB.saveMascota(c.code, c.mascotaId, { historial: his, ...(extra.peso ? { peso: extra.peso } : {}) });
}
async function cobrar(c) {
  const aj = await cargarAjustes(), p = pagoInfo(c);
  modal("Registrar pago", `
    <div class="pay-box"><div><small>Total</small><b>${S(totalDe(c))}</b></div><div><small>Pagado</small><b>${S(c.pagado)}</b></div><div class="due"><small>Saldo</small><b>${S(p.saldo)}</b></div></div>
    <div class="grid2">
      ${(c.cargos || []).length ? `<div class="field"><label>Precio total</label><input value="${S(totalDe(c))} (incluye ${(c.cargos || []).length} producto/s usado/s)" disabled><input type="hidden" name="total" value="${totalDe(c)}"></div>` : fld("total", "Precio total del servicio (S/)", totalDe(c), { type: "number", extra: 'min="0" step="0.5"' })}
      ${fld("monto", "Monto que paga ahora (S/)", p.saldo || "", { req: true, type: "number", extra: 'min="0.1" step="0.1"' })}
      ${fld("metodo", "Forma de pago", "Efectivo", { opts: MET })}
      ${fld("enviar", "Enviar el estado de pago por WhatsApp", true, { type: "checkbox" })}
      ${c.estado !== "atendida" && c.fecha <= todayISO() ? fld("atender", "Después de cobrar, abrir la ficha clínica para guardarla en el historial", true, { type: "checkbox", full: true, ph: "Doctor, diagnóstico y medicamentos" }) : ""}
    </div>`, async d => {
    let nc = { ...c };
    if (r2(d.total) !== totalDe(c)) { const t = r2(d.total); nc.precioBase = r2(Math.max(t - (c.cargos || []).reduce((a, x) => a + (Math.max(1, +x.q || 1)) * (+x.p || 0), 0), 0)); await DB.guardarCita(c.id, { precioBase: nc.precioBase, total: t, estadoPago: t > 0 && (+c.pagado || 0) >= t ? "pagado" : (+c.pagado || 0) > 0 ? "adelanto" : "pendiente" }); nc.total = t; }
    const m = r2(d.monto); if (!(m > 0)) { toast("Monto no válido", true); return false; }
    nc = await registrarPago(nc, m, d.metodo, pagoInfo(nc).saldo <= m ? "Pago" : "Adelanto");
    toast("Pago registrado en caja"); if (d.enviar) openWA(c.celular, msgCitaWA(nc, aj));
    if (d.atender) setTimeout(() => fichaAtencion(nc, "atender"), 350); else refresh();
  }, "Registrar pago");
}
async function atender(c) {
  const aj = await cargarAjustes(), p = pagoInfo(c);
  modal("Marcar como atendida", `
    <p class="sub" style="margin-bottom:12px">${esc(c.mascota)} · ${esc(c.servicio)} · ${fmtD(c.fecha)} ${esc(c.hora)} h</p>
    <div class="grid2">
      ${fld("d", "Diagnóstico, tratamiento e indicaciones (lo verá el cliente)", "", { type: "textarea", full: true })}
      ${fld("vet", "Atendido por", c.vet || A.veterinarios[0], { opts: A.veterinarios })}
      ${fld("peso", "Peso del día", "", { ph: "Ej. 12.4 kg" })}
      ${fld("total", "Precio final (S/)", totalDe(c), { type: "number", extra: 'min="0" step="0.5"' })}
      ${fld("monto", `Cobrar ahora (S/) · ya pagó ${S(c.pagado)}`, p.saldo || "", { type: "number", ph: "0 = queda pendiente", extra: 'min="0" step="0.1"' })}
      ${fld("metodo", "Forma de pago", "Efectivo", { opts: MET })}
      ${fld("enviar", "Enviar resumen y estado de pago por WhatsApp", true, { type: "checkbox" })}
    </div>`, async d => {
    const t = r2(d.total);
    await DB.guardarCita(c.id, { total: t, estado: "atendida", vet: d.vet, atendida: new Date().toISOString() });
    let nc = { ...c, total: t, estado: "atendida", vet: d.vet };
    await syncHistorial(nc, { d: d.d, vet: d.vet, peso: d.peso });
    if (+d.monto > 0) nc = await registrarPago(nc, r2(d.monto), d.metodo, "Pago");
    else { nc.estadoPago = t > 0 && (+c.pagado || 0) >= t ? "pagado" : (+c.pagado || 0) > 0 ? "adelanto" : "pendiente"; await DB.guardarCita(c.id, { estadoPago: nc.estadoPago }); }
    toast(pagoInfo(nc).saldo > 0 ? "Atendida · queda saldo pendiente" : "Atendida y pagada");
    if (d.enviar) openWA(c.celular, msgCitaWA(nc, aj));
    refresh();
  }, "Guardar atención");
}
async function diagnostico(c) {   // completar o corregir lo que verá el cliente en su historial
  const m = await DB.getMascota(c.code, c.mascotaId), h = ((m && m.historial) || []).find(x => x.citaId === c.id) || {};
  modal("Diagnóstico de la atención", `<p class="sub" style="margin-bottom:12px">${esc(c.mascota)} · ${esc(c.servicio)} · ${fmtD(c.fecha)} ${esc(c.hora)} h</p><div class="grid2">
    ${fld("d", "Diagnóstico, tratamiento e indicaciones (lo verá el cliente)", h.d || "", { type: "textarea", full: true })}
    ${fld("vet", "Atendido por", h.vet || c.vet || A.veterinarios[0], { opts: A.veterinarios })}
    ${fld("peso", "Peso del día", h.peso || "", { ph: "Ej. 12.4 kg" })}</div>`, async d => {
    await syncHistorial(c, { d: d.d, vet: d.vet, peso: d.peso }); toast("Historial actualizado");
  }, "Guardar");
}
async function vincular(c) {
  const cls = (await DB.listClientes()).sort((a, b) => a.dueno.localeCompare(b.dueno));
  modal("Vincular cita a un cliente", `
    <p class="sub" style="margin-bottom:12px">Reservó: <b>${esc(c.dueno)}</b> · ${esc(c.celular)} · Mascota: <b>${esc(c.mascota)}</b> (${esc(c.especie || "")})</p>
    <div class="grid2">
      ${fld("cli", "Cliente", c.code || "__nuevo", { full: true, opts: [["__nuevo", `+ Crear cliente nuevo (${c.dueno})`], ...cls.map(x => [x.codigo, `${x.dueno} · ${x.codigo}`])] })}
      <div class="field full" id="vPet" style="display:none"><label>Mascota</label><select name="mid"></select></div>
      ${fld("enviar", "Enviar su código de cliente por WhatsApp", true, { type: "checkbox", full: true })}
    </div>`, async d => {
    let code = d.cli, mid = d.mid;
    if (code === "__nuevo") { code = await DB.nuevoCodigo(); await DB.saveCliente(code, { dueno: c.dueno, celular: c.celular, email: "", direccion: "", notas: "Creado desde una cita web" }); mid = "__nueva"; }
    if (!mid || mid === "__nueva") mid = await DB.saveMascota(code, null, { nombre: c.mascota, especie: c.especie || "Perro", raza: c.raza || "", vacunas: [], historial: [], rec: [] });
    await DB.guardarCita(c.id, { code, mascotaId: mid });
    if (c.estado === "atendida") await syncHistorial({ ...c, code, mascotaId: mid });
    toast("Cita vinculada · Código " + code);
    if (d.enviar) { const cl = await DB.getCliente(code);
      openWA(cl.celular, `Hola ${cl.dueno.split(" ")[0]}, te saluda *${NOMBRE_V}*.\n\nTu código de cliente es: *${code}*\n\nCon él puedes ver tus citas, pagos, vacunas e historial de ${c.mascota} aquí:\n${portalLink(code)}`); }
    refresh();
  }, "Vincular");
  const sel = $("#modalForm [name=cli]");
  const onSel = async () => {
    const box = $("#vPet");
    if (sel.value === "__nuevo") { box.style.display = "none"; return; }
    const ms = await DB.listMascotas(sel.value); box.style.display = "";
    $("[name=mid]", box).innerHTML = ms.map(m => `<option value="${esc(m.id)}" ${m.nombre.toLowerCase() === String(c.mascota).toLowerCase() ? "selected" : ""}>${esc(m.nombre)}</option>`).join("") + `<option value="__nueva">+ Crear ${esc(c.mascota)}</option>`;
  };
  sel.addEventListener("change", onSel); if (c.code) onSel();
}
function cancelarCita(c) {
  confirmDel(`Se cancelará la cita de <b>${esc(c.mascota)}</b> (${fmtD(c.fecha)} ${esc(c.hora)} h) y el horario quedará libre.${+c.pagado ? `<br><br><b>Ojo:</b> el cliente ya pagó ${S(c.pagado)}. Si le devuelves el dinero, anula el pago en <b>Caja</b>.` : ""}`,
    async () => { await DB.borrarCita(c); toast("Cita cancelada"); if (c.celular) openWA(c.celular, `Hola ${String(c.dueno).split(" ")[0]}, te saluda *${NOMBRE_V}*. Tu cita de ${c.servicio} para ${c.mascota} del ${largo(c.fecha)} a las ${c.hora} h fue *cancelada*. Si deseas otra fecha, responde este mensaje.`); refresh(); });
}

/* =========================================================
   VISTAS
   ========================================================= */
let AG = { modo: "dia", fecha: todayISO() };
Object.assign(VIEWS, {
  /* ---------------- INICIO ---------------- */
  async inicio() {
    await cargarMarca(); await cargarDocs();
    const hoy = todayISO();
    const [aj, cl, ms, citasHoy, movs, prox, prods, inv] = await Promise.all([cargarAjustes(), DB.listClientes(), DB.allMascotas(), DB.rango("citas", hoy, hoy),
      DB.rango("movimientos", hoy, hoy), DB.rango("citas", addDays(hoy, -60), addDays(hoy, 60)), DB.listCol("productos"), DB.listCol("inventario")]);
    const ingreso = movs.filter(m => !m.anulado).reduce((a, m) => a + (+m.total || 0), 0);
    const porCobrar = prox.filter(c => pagoInfo(c).saldo > 0 && (c.estado === "atendida" || c.fecha <= hoy));
    const invM = {}; inv.forEach(x => invM[x.id] = x);
    const bajos = prods.map(p => ({ ...p, inv: invM[p.id] })).filter(p => p.inv && +p.inv.cantidad <= (+p.inv.minimo || 0));
    const vac = ms.flatMap(m => (m.vacunas || []).map(v => ({ ...v, m }))).filter(v => diff(v.prox) <= 30).sort((a, b) => a.prox.localeCompare(b.prox));
    const h = new Date().getHours();
    citasHoy.sort((a, b) => a.hora.localeCompare(b.hora));
    $("#view").innerHTML = topBar(h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches", `${esc(NOMBRE_V)} · ${largo(hoy)}`,
      `<button class="btn btn-light" data-goto="caja">${ic2("cash")}<span class="hide-m">Venta rápida</span></button><button class="btn btn-pri" data-act="nueva">${ico("plus")} Nueva cita</button>`) + `
      <div class="stats">
        <div class="stat"><i>${ic2("cash")}</i><div><b>${S(ingreso)}</b><span>Ingresos de hoy</span></div></div>
        <div class="stat"><i>${ico("cal")}</i><div><b>${citasHoy.length}</b><span>Citas hoy</span></div></div>
        <div class="stat"><i>${ico("bell")}</i><div><b>${S(porCobrar.reduce((a, c) => a + pagoInfo(c).saldo, 0))}</b><span>Por cobrar</span></div></div>
        <div class="stat"><i>${ico("alert")}</i><div><b>${bajos.length}</b><span>Productos por agotarse</span></div></div>
      </div>
      <div class="two-col">
        <div class="card"><div class="card-h"><h2>${ico("cal")} Citas de hoy</h2><button class="btn btn-light btn-sm" data-goto="agenda">Ver agenda</button></div>
          <div class="citas">${citasHoy.map(c => citaCard(c)).join("") || `<p class="empty">No hay citas hoy.</p>`}</div></div>
        <div>
          ${DOCS.length ? `<div class="card"><div class="card-h"><h2>${ico("users")} Doctores hoy</h2><button class="btn btn-light btn-sm" data-goto="doctores">Gestionar</button></div><div class="list">${docsActivos().map(d => { const aus = ausente(d, hoy), tr = (d.dias || []).includes(toD(hoy).getDay()), n = citasHoy.filter(c => c.vetId === d.id).length;
            return `<div class="li">${avatarDoc(d)}<div><b>${esc(d.n)}</b><small>${esc(d.esp || "")}${tr && !aus ? ` · ${n} cita${n === 1 ? "" : "s"} hoy` : ""}</small></div><span class="st ${aus ? "dark" : tr ? "ok" : ""}">${aus ? "No vino" : tr ? "Presente" : "Descanso"}</span></div>`; }).join("")}</div></div>` : ""}
          ${porCobrar.length ? `<div class="card"><div class="card-h"><h2>${ic2("cash")} Saldos por cobrar</h2></div><div class="list">${porCobrar.slice(0, 5).map(c => `<div class="li"><div><b>${esc(c.mascota)} · ${esc(c.dueno)}</b><small>${esc(c.servicio)} · ${fmtD(c.fecha)}</small></div><span class="st warn">${S(pagoInfo(c).saldo)}</span></div>`).join("")}</div></div>` : ""}
          <div class="card"><div class="card-h"><h2>${ic2("box")} Stock bajo</h2><button class="btn btn-light btn-sm" data-goto="tienda">Inventario</button></div>
            <div class="list">${bajos.slice(0, 6).map(p => `<div class="li"><div><b>${esc(p.n)}</b><small>Mínimo ${+p.inv.minimo || 0}</small></div><span class="st ${+p.inv.cantidad <= 0 ? "bad" : "warn"}">${+p.inv.cantidad <= 0 ? "Agotado" : p.inv.cantidad + " und."}</span></div>`).join("") || `<p class="empty">Todo con stock suficiente.</p>`}</div></div>
          <div class="card"><div class="card-h"><h2>${ico("shield")} Vacunas por avisar</h2><button class="btn btn-light btn-sm" data-goto="vacunas">${(() => { const n = vac.filter(v => diff(v.prox) <= 7 && !avisado(v)).length; return n ? `<b class="pill-n">${n}</b> por avisar esta semana` : "Ver todas"; })()}</button></div>${vacList(vac.filter(v => !avisado(v) || diff(v.prox) >= 0).slice(0, 4))}</div>
        </div>
      </div>`;
  },

  /* ---------------- AGENDA ---------------- */
  async agenda() {
    await cargarDocs();
    const aj = await cargarAjustes(), cap = capMax(aj), f = AG.fecha, capH = (d, h) => capSlot(d, h, aj);
    let a = f, b = f;
    if (AG.modo === "semana") { a = lunes(f); b = addDays(a, 6); }
    if (AG.modo === "mes") { const d = toD(f); a = lunes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`); b = addDays(a, 41); }
    const [cs, ts] = await Promise.all([DB.rango("citas", a, b), DB.turnosRango(a, b)]);
    CITAS = {};
    const porDia = {}; cs.forEach(c => (porDia[c.fecha] = porDia[c.fecha] || []).push(c));
    Object.values(porDia).forEach(l => l.sort((x, y) => x.hora.localeCompare(y.hora)));
    const bloq = {}; ts.filter(t => t.bloqueo).forEach(t => { const k = t.fecha + "_" + t.hora; (bloq[k] = bloq[k] || []).push(t); });
    const resumen = d => { const hs = horasDia(d, aj), l = porDia[d] || []; let libres = 0;
      let total = 0; hs.forEach(h => { const k = capH(d, h), o = l.filter(c => c.hora === h).length + (bloq[d + "_" + h] || []).length; total += k; libres += Math.max(k - o, 0); });
      return { citas: l.length, libres, total, cerrado: !hs.length }; };
    const titulo = AG.modo === "dia" ? largo(f).replace(/^./, x => x.toUpperCase()) + " " + toD(f).getFullYear()
      : AG.modo === "semana" ? `Semana del ${toD(a).getDate()} ${MES[toD(a).getMonth()]} al ${toD(b).getDate()} ${MES[toD(b).getMonth()]}`
      : MESES_L[toD(f).getMonth()].replace(/^./, x => x.toUpperCase()) + " " + toD(f).getFullYear();
    let body = "";
    if (AG.modo === "dia") {
      const hs = horasDia(f, aj), l = porDia[f] || [], horas = [...new Set([...hs, ...l.map(c => c.hora)])].sort();
      const r = resumen(f), cob = l.reduce((s, c) => s + pagoInfo(c).saldo, 0);
      const docsDia = docsActivos().map(d => ({ d, aus: ausente(d, f), trab: (d.dias || []).includes(toD(f).getDay()), n: l.filter(c => c.vetId === d.id).length }));
      body = `<div class="day-sum"><span><b>${r.citas}</b> citas</span><span><b>${r.libres}</b> lugares libres</span><span><b>${S(cob)}</b> por cobrar</span>${l.filter(c => !c.vet && c.estado !== "atendida").length ? `<span class="warn"><b>${l.filter(c => !c.vet && c.estado !== "atendida").length}</b> sin doctor</span>` : ""}</div>` +
        (docsDia.length ? `<div class="doc-strip">${docsDia.map(x => `<span class="ds ${x.aus ? "aus" : !x.trab ? "off" : ""}">${avatarDoc(x.d)}<span><b>${esc(x.d.n)}</b><small>${x.aus ? "No vino" : !x.trab ? "No trabaja hoy" : `${esc(x.d.desde)}–${esc(x.d.hasta)} · ${x.n} cita${x.n === 1 ? "" : "s"}`}</small></span></span>`).join("")}<button class="btn btn-sm ghost" data-goto="doctores">${ico("edit")} Doctores</button></div>` : "") +
        (!horas.length ? `<p class="empty">Este día no hay atención. Puedes cambiar el horario en Ajustes.</p>` :
        `<div class="slots-day">${horas.map(h => {
          const cc = l.filter(c => c.hora === h), bl = bloq[f + "_" + h] || [], occ = cc.length + bl.length, lib = Math.max(capH(f, h) - occ, 0);
          const libresN = docsActivos().filter(d => trabaja(d, f, h, aj) && !cc.some(c => c.vetId === d.id)).map(d => d.n.replace(/^(Dra?\.)\s*/i, "").split(" ")[0]);
          const pas = f < todayISO() || (f === todayISO() && aMin(h) < aMin(nowHM()) - 30);
          return `<div class="srow ${pas ? "past" : ""}"><div class="s-h">${h}</div><div class="s-body">
            ${cc.map(c => citaCard(c)).join("")}
            ${bl.length ? `<div class="blk">${ic2("lock")} Bloqueado${bl[0].motivo ? " · " + esc(bl[0].motivo) : ""}<button class="btn btn-sm" data-unblock="${h}">${ic2("unlock")} Desbloquear</button></div>` : ""}
            ${!bl.length && hs.includes(h) ? `<div class="free ${lib ? "" : "full"}"><span>${lib ? `${lib} libre${lib > 1 ? "s" : ""}` : "Lleno"}</span>${lib && DOCS.length && libresN.length ? `<small class="free-docs">${esc(libresN.join(", "))}</small>` : ""}${lib && !pas ? `<button class="btn btn-light btn-sm" data-new-at="${h}">${ico("plus")} Cita</button>${!cc.length ? `<button class="btn btn-sm ghost" data-block="${h}">${ic2("lock")} Bloquear</button>` : ""}` : ""}</div>` : ""}
          </div></div>`; }).join("")}</div>`);
    } else if (AG.modo === "semana") {
      body = `<div class="week">${[0, 1, 2, 3, 4, 5, 6].map(i => { const d = addDays(a, i), r = resumen(d), l = porDia[d] || [];
        return `<div class="wday ${d === todayISO() ? "today" : ""}"><button class="wd-h" data-dia="${d}"><b>${DIA[toD(d).getDay()]} ${toD(d).getDate()}</b><small>${r.cerrado ? "Cerrado" : `${r.citas} citas · ${r.libres} libres`}</small><i class="bar"><i style="width:${r.total ? Math.round((1 - r.libres / r.total) * 100) : 0}%"></i></i></button>
          <div class="wd-b">${l.map(c => { CITAS[c.id] = c; const p = pagoInfo(c); return `<button class="wc ${c.estado === "atendida" ? "done" : ""}" data-dia="${d}"><b>${esc(c.hora)}</b> ${esc(c.mascota)}<small>${esc(c.servicio)}</small><i class="dot ${p.cls}"></i></button>`; }).join("") || `<small class="muted">Sin citas</small>`}</div></div>`; }).join("")}</div>`;
    } else {
      const mes = toD(f).getMonth();
      body = `<div class="month"><div class="m-head">${["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(x => `<span>${x}</span>`).join("")}</div><div class="m-grid">${Array.from({ length: 42 }, (_, i) => {
        const d = addDays(a, i), r = resumen(d), out = toD(d).getMonth() !== mes, pct = r.total ? Math.round((1 - r.libres / r.total) * 100) : 0;
        return `<button class="mcell ${out ? "out" : ""} ${d === todayISO() ? "today" : ""} ${r.cerrado ? "closed" : ""}" data-dia="${d}"><b>${toD(d).getDate()}</b>${r.citas ? `<span class="mc-n">${r.citas} cita${r.citas > 1 ? "s" : ""}</span>` : ""}${!r.cerrado ? `<small>${r.libres} libres</small><i class="bar"><i style="width:${pct}%"></i></i>` : `<small>Cerrado</small>`}</button>`; }).join("")}</div></div>`;
    }
    $("#view").innerHTML = topBar("Agenda", DOCS.length ? `Horarios libres y ocupados · ${docsActivos().length} doctor(es)` : `Horarios libres y ocupados · ${cap} cita${cap > 1 ? "s" : ""} por horario`,
      `<button class="btn btn-pri" data-act="nueva">${ico("plus")} Nueva cita</button>`) + `
      <div class="card ag-card">
        <div class="ag-bar">
          <div class="seg">${[["dia", "Día"], ["semana", "Semana"], ["mes", "Mes"]].map(([k, t]) => `<button class="${AG.modo === k ? "on" : ""}" data-modo="${k}">${t}</button>`).join("")}</div>
          <div class="ag-nav"><button class="icon-btn" data-mov="-1" aria-label="Anterior">${ic2("left")}</button><button class="btn btn-light btn-sm" data-hoy>Hoy</button><button class="icon-btn" data-mov="1" aria-label="Siguiente">${ic2("right")}</button>
            <input type="date" id="agDate" value="${f}" aria-label="Ir a fecha"></div>
          <h2 class="ag-title">${esc(titulo)}</h2>
          ${AG.modo === "dia" && horasDia(f, aj).length ? `<button class="btn btn-sm ghost" data-block-day>${ic2("lock")} Bloquear día</button>` : ""}
        </div>
        ${body}
      </div>`;
    $("#agDate").addEventListener("change", e => { if (e.target.value) { AG.fecha = e.target.value; refresh(); } });
    CUR.aj = aj; CUR.cap = cap;
  },

  /* ---------------- CAJA ---------------- */
  async caja() {
    const f = CUR.cajaF || todayISO();
    const movs = (await DB.rango("movimientos", f, f)).sort((a, b) => b.hora.localeCompare(a.hora));
    CUR.movs = movs;
    const ok = movs.filter(m => !m.anulado), tot = ok.reduce((a, m) => a + (+m.total || 0), 0);
    const porM = {}; ok.forEach(m => porM[m.metodo] = (porM[m.metodo] || 0) + (+m.total || 0));
    const serv = ok.reduce((a, m) => a + (m.items || []).filter(i => i.tipo !== "producto").reduce((s, i) => s + i.p * i.q, 0), 0);
    $("#view").innerHTML = topBar("Caja", "Cobros de servicios y ventas del Pet Shop",
      `<button class="btn btn-pri" data-venta>${ico("plus")} Venta rápida</button>`) + `
      <div class="card"><div class="ag-bar"><div class="ag-nav"><button class="icon-btn" data-cmov="-1">${ic2("left")}</button><button class="btn btn-light btn-sm" data-choy>Hoy</button><button class="icon-btn" data-cmov="1">${ic2("right")}</button><input type="date" id="cDate" value="${f}"></div>
        <h2 class="ag-title">${esc(largo(f).replace(/^./, x => x.toUpperCase()))}</h2></div>
        <div class="stats" style="margin:16px 0 6px">
          <div class="stat"><i>${ic2("cash")}</i><div><b>${S(tot)}</b><span>Total del día</span></div></div>
          <div class="stat"><i>${ico("check")}</i><div><b>${S(serv)}</b><span>Atenciones (servicio + medicamentos)</span></div></div>
          <div class="stat"><i>${ic2("box")}</i><div><b>${S(tot - serv)}</b><span>Pet Shop</span></div></div>
          <div class="stat"><i>${ic2("file")}</i><div><b>${ok.length}</b><span>Operaciones</span></div></div>
        </div>
        <div class="met-row">${MET.map(m => `<div><small>${m}</small><b>${S(porM[m] || 0)}</b></div>`).join("")}</div>
      </div>
      <div class="card"><div class="card-h"><h2>${ic2("file")} Movimientos</h2></div>
        <div class="table-wrap"><table class="ptable mtable"><thead><tr><th>Hora</th><th>Concepto</th><th class="hide-m">Pago</th><th style="text-align:right">Monto</th><th></th></tr></thead><tbody>
        ${movs.map(m => `<tr class="${m.anulado ? "dim" : ""}"><td>${esc(m.hora)}</td><td><b>${esc(m.concepto)}</b><small class="sub">${(m.items || []).length > 1 ? (m.items || []).map(i => `${i.q} × ${esc(i.n)}`).join(" · ") : ""}${m.cliente ? (m.items || []).length > 1 ? " · " : "" : ""}${esc(m.cliente || "")}</small></td>
          <td class="hide-m"><span class="st info">${esc(m.metodo)}</span></td><td style="text-align:right;white-space:nowrap"><b>${S(m.total)}</b>${m.anulado ? `<br><span class="st bad">Anulado</span>` : ""}</td>
          <td style="text-align:right">${!m.anulado ? `<button class="icon-btn" data-anular="${esc(m.id)}" title="Anular">${ic2("x")}</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="5" class="empty">No hay movimientos este día.</td></tr>`}
        </tbody></table></div></div>`;
    $("#cDate").addEventListener("change", e => { if (e.target.value) { CUR.cajaF = e.target.value; refresh(); } });
  },

  /* ---------------- REPORTES ---------------- */
  async reportes() {
    const hoy = todayISO(), d = toD(hoy);
    const P = CUR.rep || "mes";
    const per = {
      hoy: [hoy, hoy, "Hoy"], semana: [lunes(hoy), hoy, "Esta semana"],
      mes: [`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`, hoy, "Este mes"],
      pasado: (() => { const x = new Date(d.getFullYear(), d.getMonth() - 1, 1), y = new Date(d.getFullYear(), d.getMonth(), 0); const iso = z => `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, "0")}-${String(z.getDate()).padStart(2, "0")}`; return [iso(x), iso(y), "Mes pasado"]; })(),
      rango: [CUR.repA || addDays(hoy, -30), CUR.repB || hoy, "Rango"],
    };
    const [a, b] = per[P];
    const [movs, cs] = await Promise.all([DB.rango("movimientos", a, b), DB.rango("citas", addDays(hoy, -120), addDays(hoy, 60))]);
    const ok = movs.filter(m => !m.anulado);
    let serv = 0, prod = 0, gan = 0, ins = 0; const porM = {}, porD = {}, topS = {}, topP = {};
    ok.forEach(m => {
      porM[m.metodo] = (porM[m.metodo] || 0) + (+m.total || 0); porD[m.fecha] = (porD[m.fecha] || 0) + (+m.total || 0);
      (m.items || []).forEach(i => { const v = i.p * i.q;
        if (i.tipo === "insumo") { ins += v; return; }
        if (i.tipo === "producto") { prod += v; gan += (i.p - (+i.costo || 0)) * i.q; const t = topP[i.n] = topP[i.n] || { q: 0, v: 0 }; t.q += i.q; t.v += v; }
        else { serv += v; const t = topS[i.n] = topS[i.n] || { q: 0, v: 0 }; t.q += i.q; t.v += v; } });
    });
    const total = serv + prod + ins, maxM = Math.max(1, ...Object.values(porM)), dias = [];
    for (let x = a; x <= b && dias.length < 62; x = addDays(x, 1)) dias.push(x);
    const maxD = Math.max(1, ...dias.map(x => porD[x] || 0));
    const deudas = cs.filter(c => pagoInfo(c).saldo > 0 && (c.estado === "atendida" || c.fecha < hoy));
    const top = (o, n) => Object.entries(o).sort((x, y) => y[1].v - x[1].v).slice(0, n);
    $("#view").innerHTML = topBar("Reportes", `${per[P][2]} · del ${fmt(a)} al ${fmt(b)}`, `<button class="btn btn-light" onclick="window.print()">${ic2("print")}<span class="hide-m">Imprimir</span></button>`) + `
      <div class="card"><div class="ag-bar"><div class="seg">${[["hoy", "Hoy"], ["semana", "Semana"], ["mes", "Mes"], ["pasado", "Mes pasado"], ["rango", "Rango"]].map(([k, t]) => `<button class="${P === k ? "on" : ""}" data-rep="${k}">${t}</button>`).join("")}</div>
        ${P === "rango" ? `<div class="ag-nav"><input type="date" id="rA" value="${a}"> <span class="sub">a</span> <input type="date" id="rB" value="${b}"></div>` : ""}</div></div>
      <div class="stats">
        <div class="stat"><i>${ic2("cash")}</i><div><b>${S(total)}</b><span>Ingresos totales</span></div></div>
        <div class="stat"><i>${ico("check")}</i><div><b>${S(serv)}</b><span>Servicios</span></div></div>
        <div class="stat"><i>${ico("shield")}</i><div><b>${S(ins)}</b><span>Medicamentos y materiales</span></div></div>
        <div class="stat"><i>${ic2("box")}</i><div><b>${S(prod)}</b><span>Pet Shop · gana ${S(gan)}</span></div></div>
      </div>
      <div class="two-col">
        <div class="card"><div class="card-h"><h2>${ic2("chart")} Ingresos por día</h2><small class="sub">${ok.length} operaciones · ticket promedio ${S(ok.length ? total / ok.length : 0)}</small></div>
          <div class="bars">${dias.map(x => `<div class="bcol" title="${fmt(x)}: ${S(porD[x] || 0)}"><i style="height:${Math.round((porD[x] || 0) / maxD * 100)}%"></i><small>${toD(x).getDate()}</small></div>`).join("")}</div></div>
        <div class="card"><div class="card-h"><h2>${ic2("cash")} Por forma de pago</h2></div>
          <div class="hbars">${MET.map(m => `<div class="hb"><span>${m}</span><i><i style="width:${Math.round((porM[m] || 0) / maxM * 100)}%"></i></i><b>${S(porM[m] || 0)}</b></div>`).join("")}</div></div>
      </div>
      <div class="two-col">
        <div class="card"><div class="card-h"><h2>${ico("check")} Servicios más vendidos</h2></div><div class="list">${top(topS, 8).map(([n, t]) => `<div class="li"><div><b>${esc(n)}</b><small>${t.q} atención${t.q > 1 ? "es" : ""}</small></div><b>${S(t.v)}</b></div>`).join("") || `<p class="empty">Sin datos en este periodo.</p>`}</div></div>
        <div class="card"><div class="card-h"><h2>${ic2("box")} Productos más vendidos</h2></div><div class="list">${top(topP, 8).map(([n, t]) => `<div class="li"><div><b>${esc(n)}</b><small>${t.q} unidad${t.q > 1 ? "es" : ""}</small></div><b>${S(t.v)}</b></div>`).join("") || `<p class="empty">Sin datos en este periodo.</p>`}</div></div>
      </div>
      <div class="card"><div class="card-h"><h2>${ico("bell")} Saldos por cobrar</h2><b class="money">${S(deudas.reduce((s, c) => s + pagoInfo(c).saldo, 0))}</b></div>
        <div class="citas">${deudas.map(c => citaCard(c, { fecha: true })).join("") || `<p class="empty">No hay saldos pendientes.</p>`}</div></div>`;
    if (P === "rango") ["rA", "rB"].forEach(k => $("#" + k).addEventListener("change", () => { CUR.repA = $("#rA").value; CUR.repB = $("#rB").value; CUR.rep = "rango"; refresh(); }));
  },

  /* ---------------- PET SHOP E INVENTARIO ---------------- */
  async tienda() {
    await cargarCats();
    const [ps, inv] = await Promise.all([DB.listCol("productos"), DB.listCol("inventario")]);
    const im = {}; inv.forEach(x => im[x.id] = x);
    const all = ordenar(ps).map(p => ({ ...p, inv: im[p.id] || null })); CUR.list = all;
    const valor = all.reduce((a, p) => a + (p.inv ? Math.max(+p.inv.cantidad || 0, 0) * (+p.inv.costo || 0) : 0), 0);
    const bajo = all.filter(p => p.inv && +p.inv.cantidad > 0 && +p.inv.cantidad <= (+p.inv.minimo || 0)).length, ag = all.filter(p => p.inv ? +p.inv.cantidad <= 0 : p.stock === "agotado").length;
    $("#view").innerHTML = topBar("Pet Shop e inventario", "Precios, costos y stock. Al llegar a 0, el producto sale agotado en la web.",
      `${!all.length ? `<button class="btn btn-light" data-import="productos">Cargar ejemplos</button>` : ""}<a class="btn btn-light" href="${esc(webBase())}tienda" target="_blank" rel="noopener">${ico("eye")}<span class="hide-m">Ver tienda</span></a><button class="btn btn-pri" data-new-prod>${ico("plus")} Nuevo producto</button>`) + `
      <div class="stats">
        <div class="stat"><i>${ic2("box")}</i><div><b>${all.length}</b><span>Productos</span></div></div>
        <div class="stat"><i>${ic2("cash")}</i><div><b>${S(valor)}</b><span>Valor del inventario (costo)</span></div></div>
        <div class="stat"><i>${ico("bell")}</i><div><b>${bajo}</b><span>Stock bajo</span></div></div>
        <div class="stat"><i>${ico("alert")}</i><div><b>${ag}</b><span>Agotados</span></div></div>
      </div>
      ${!all.length ? SIN_DATOS("productos") : ""}
      <div class="card">
        <div class="card-h"><div class="chips" id="pCats"><button class="chip on" data-pc="">Todos</button>${CATP.map(c => `<button class="chip" data-pc="${esc(c.id)}">${esc(c.n)}</button>`).join("")}<button class="chip" data-pc="__bajo">Stock bajo</button></div>
          <label class="search">${ico("search")}<input id="pSearch" type="search" placeholder="Buscar producto"></label></div>
        <div class="table-wrap"><table class="ptable"><thead><tr><th></th><th>Producto</th><th>Precio</th><th class="hide-m">Costo · margen</th><th>Stock</th><th style="text-align:right">Acciones</th></tr></thead><tbody id="pBody"></tbody></table></div>
      </div>`;
    let fc = "", q = "";
    const draw = () => {
      const l = all.filter(p => (!fc || (fc === "__bajo" ? p.inv && +p.inv.cantidad <= (+p.inv.minimo || 0) : catId(CATP, p.cat) === fc)) && (p.n + " " + (p.d || "")).toLowerCase().includes(q));
      $("#pBody").innerHTML = l.length ? l.map(p => { const c = p.inv ? +p.inv.cantidad : null, mn = p.inv ? +p.inv.minimo || 0 : 0, cost = p.inv ? +p.inv.costo || 0 : 0;
        const st = c == null ? `<span class="st">Sin control</span>` : c <= 0 ? `<span class="st bad">Agotado</span>` : c <= mn ? `<span class="st warn">${c} und. · bajo</span>` : `<span class="st ok">${c} und.</span>`;
        return `<tr data-prod="${esc(p.id)}" class="${p.visible === false ? "dim" : ""}">
        <td><span class="thumb">${p.img ? `<img src="${esc(foto(p.img, 120))}" alt="" onerror="this.remove()">` : ico("paw")}</span></td>
        <td><b>${esc(p.n)}</b><small class="sub">${esc(catName(CATP, p.cat))}${p.visible === false ? " · Oculto" : ""}${p.destacado ? " · Destacado" : ""}${p.tag ? " · " + esc(p.tag) : ""}</small></td>
        <td style="white-space:nowrap"><b>${S(p.p)}</b>${+p.old > +p.p ? `<br><s class="sub">${S(p.old)}</s>` : ""}</td>
        <td class="hide-m" style="white-space:nowrap">${cost ? `${S(cost)}<small class="sub">Ganas ${S(p.p - cost)} (${Math.round((p.p - cost) / p.p * 100)}%)</small>` : `<small class="sub">—</small>`}</td>
        <td>${st}</td>
        <td><div class="acts">
          ${!fc && !q ? `<button class="icon-btn mv" data-mv="-1" title="Subir">▲</button><button class="icon-btn mv" data-mv="1" title="Bajar">▼</button>` : ""}
          <button class="btn btn-light btn-sm" data-ingreso>${ico("plus")} Ingreso</button>
          <button class="icon-btn edit" data-edit-prod title="Editar">${ico("edit")}</button>
          <button class="icon-btn" data-del-prod2 title="Eliminar">${ico("trash")}</button></div></td></tr>`; }).join("")
        : `<tr><td colspan="6" class="empty">${all.length ? "No hay productos con ese filtro." : "Aún no hay productos."}</td></tr>`;
    };
    $("#pCats").addEventListener("click", e => { const b = e.target.closest("[data-pc]"); if (!b) return; $$("#pCats .chip").forEach(x => x.classList.remove("on")); b.classList.add("on"); fc = b.dataset.pc; draw(); });
    $("#pSearch").addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); draw(); });
    draw();
  },

  /* ---------------- PERSONALIZAR WEB ---------------- */
  async personalizar() {
    const w = await DB.getWeb(), D = window.DATOS.web, m = { ...D.marca, ...(w.marca || {}) }, p = { ...D.portada, ...(w.portada || {}) }, n = { ...D.nosotros, ...(w.nosotros || {}) };
    const eq = w.equipo || D.equipo, te = w.testimonios || D.testimonios, rd = { ...D.redes, ...(w.redes || {}) }, cif = p.cifras || D.portada.cifras;
    const imgUp = (key, val, label, logo) => `<div class="img-up" data-key="${key}"><span class="prev ${logo ? "logo" : ""}">${val ? `<img src="${esc(foto(val, 300))}" alt="">` : ico("camera")}</span>
      <div><b>${label}</b><label class="btn btn-light btn-sm">${ico("camera")} Subir<input type="file" accept="image/*" hidden data-up="${key}" ${logo ? "data-logo" : ""}></label>${val ? `<button type="button" class="btn btn-sm ghost" data-clear="${key}">Quitar</button>` : ""}</div>
      <input type="hidden" name="${key}" value="${esc(val || "")}"></div>`;
    const eqRow = (x, i) => `<div class="rep" data-rep>${imgUp("eq_foto_" + i, x.foto, "Foto")}<div class="grid2">${fld("eq_n_" + i, "Nombre", x.n)}${fld("eq_c_" + i, "Cargo / especialidad", x.cargo)}${fld("eq_d_" + i, "Descripción", x.d, { full: true })}</div><button type="button" class="icon-btn" data-del-rep>${ico("trash")}</button></div>`;
    const teRow = (x, i) => `<div class="rep" data-rep><div class="grid2">${fld("te_q_" + i, "Opinión", x.q, { type: "textarea", full: true })}${fld("te_n_" + i, "Nombre", x.n)}${fld("te_r_" + i, "Detalle (ej. Dueña de Rocky)", x.r)}</div><button type="button" class="icon-btn" data-del-rep>${ico("trash")}</button></div>`;
    $("#view").innerHTML = topBar("Personalizar la web", "Logo, nombre, colores y textos principales. Los cambios se ven al instante en la página.",
      `<a class="btn btn-light" href="${esc(webBase())}" target="_blank" rel="noopener">${ico("eye")}<span class="hide-m">Ver web</span></a>`) + `
      <form id="webForm" novalidate>
        <div class="card"><div class="card-h"><h2>${ic2("palette")} Marca</h2></div>
          <div class="brand-prev" id="bPrev"></div>
          ${imgUp("logo", m.logo, "Logo (PNG con fondo transparente, cuadrado)", true)}
          <div class="grid3">${fld("nombre1", "Nombre (parte 1)", m.nombre1, { req: true })}${fld("nombre2", "Nombre (parte 2, en color) · empieza con espacio si son dos palabras", m.nombre2)}${fld("eslogan", "Texto debajo del nombre", m.eslogan)}</div>
          <div class="grid3">${fld("color1", "Color principal", m.color1, { type: "color" })}${fld("color2", "Color de acento (botones naranja)", m.color2, { type: "color" })}<div class="field"><label>&nbsp;</label><button type="button" class="btn btn-light" data-reset-colors>Colores originales</button></div></div>
        </div>
        <div class="card"><div class="card-h"><h2>${ico("home")} Portada (inicio)</h2></div>
          <div class="grid2">${fld("etiqueta", "Etiqueta superior", p.etiqueta, { full: true })}${fld("titulo", "Título grande", p.titulo)}${fld("tituloColor", "Continuación del título (en color)", p.tituloColor)}${fld("texto", "Texto de presentación", p.texto, { type: "textarea", full: true })}</div>
          ${imgUp("pfoto", p.foto, "Foto principal")}
          <div class="grid3">${cif.map((c, i) => fld("cif_n_" + i, `Cifra ${i + 1}`, c.n, { ph: "Ej. 12 años" }) ).join("")}${cif.map((c, i) => fld("cif_t_" + i, `Texto cifra ${i + 1}`, c.t)).join("")}</div>
        </div>
        <div class="card"><div class="card-h"><h2>${ico("users")} Nosotros</h2></div>
          <div class="grid2">${fld("ntitulo", "Título", n.titulo)}${fld("ntituloColor", "Continuación (en color)", n.tituloColor)}${fld("ntexto", "Historia", n.texto, { type: "textarea", full: true })}${fld("npuntos", "Puntos destacados (uno por línea)", (n.puntos || []).join("\n"), { type: "textarea", full: true })}</div>
          ${imgUp("nfoto", n.foto, "Foto de Nosotros")}
        </div>
        <div class="card"><div class="card-h"><h2>${ico("users")} Equipo</h2><button type="button" class="btn btn-light btn-sm" data-add-eq>${ico("plus")} Agregar</button></div><div id="eqList">${eq.map(eqRow).join("")}</div></div>
        <div class="card"><div class="card-h"><h2>${ico("check")} Testimonios</h2><button type="button" class="btn btn-light btn-sm" data-add-te>${ico("plus")} Agregar</button></div><div id="teList">${te.map(teRow).join("")}</div></div>
        <div class="card"><div class="card-h"><h2>${ico("phone")} Redes sociales y avisos</h2></div>
          <div class="grid3">${fld("facebook", "Facebook (enlace)", rd.facebook, { ph: "facebook.com/tuveterinaria" })}${fld("instagram", "Instagram (enlace)", rd.instagram, { ph: "instagram.com/tuveterinaria" })}${fld("tiktok", "TikTok (enlace)", rd.tiktok, { ph: "tiktok.com/@tuveterinaria" })}</div>
          ${fld("emergencias", "Mostrar el aviso de «Emergencias 24 horas»", w.emergencias !== false, { type: "checkbox" })}
        </div>
        <div class="save-bar"><span class="sub" id="wMsg">Revisa y guarda los cambios.</span><button class="btn btn-pri" type="submit">${ico("check")} Guardar y publicar</button></div>
      </form>`;
    const F = $("#webForm");
    let nEq = eq.length, nTe = te.length;
    const prev = () => { const g = k => $(`[name=${k}]`, F).value; const lg = g("logo");
      $("#bPrev").innerHTML = `<span class="paw" style="background:${esc(g("color1"))}">${lg ? `<img src="${esc(foto(lg, 120))}" alt="">` : ico("paw")}</span><span class="bp-t">${esc(g("nombre1"))}<b style="color:${esc(g("color2"))}">${esc(g("nombre2"))}</b><small>${esc(g("eslogan"))}</small></span><span class="bp-btn" style="background:${esc(g("color1"))}">Botón</span><span class="bp-btn" style="background:${esc(g("color2"))}">Reservar</span>`; };
    F.addEventListener("input", prev); prev();
    F.addEventListener("change", async e => {
      const up = e.target.closest("[data-up]"); if (!up || !up.files[0]) return;
      const data = up.hasAttribute("data-logo") ? await resizeImage(up.files[0], 256, .92, "image/png") : await resizeImage(up.files[0], 1000, .76);
      const box = up.closest(".img-up"); $("input[type=hidden]", box).value = data; $(".prev", box).innerHTML = `<img src="${data}" alt="">`; prev();
    });
    F.addEventListener("click", e => {
      const t = e.target.closest("button"); if (!t) return;
      if (t.matches("[data-clear]")) { const box = t.closest(".img-up"); $("input[type=hidden]", box).value = ""; $(".prev", box).innerHTML = ico("camera"); prev(); }
      if (t.matches("[data-del-rep]")) t.closest("[data-rep]").remove();
      if (t.matches("[data-add-eq]")) $("#eqList").insertAdjacentHTML("beforeend", eqRow({ n: "", cargo: "", d: "", foto: "" }, nEq++));
      if (t.matches("[data-add-te]")) $("#teList").insertAdjacentHTML("beforeend", teRow({ q: "", n: "", r: "" }, nTe++));
      if (t.matches("[data-reset-colors]")) { $("[name=color1]", F).value = D.marca.color1; $("[name=color2]", F).value = D.marca.color2; prev(); }
    });
    F.addEventListener("submit", async e => {
      e.preventDefault();
      const g = k => ($(`[name=${k}]`, F)?.value || "").trim();
      if (!g("nombre1")) { $("[name=nombre1]", F).focus(); return toast("Escribe el nombre de la veterinaria", true); }
      const pick = (pre, keys) => $$(`#${pre === "eq" ? "eqList" : "teList"} [data-rep]`).map(r => { const o = {}; keys.forEach(([k, f]) => o[k] = ($(`[name^=${pre}_${f}_]`, r)?.value || "").trim()); return o; });
      const data = {
        marca: { logo: g("logo"), nombre1: $("[name=nombre1]", F).value.trimStart(), nombre2: $("[name=nombre2]", F).value.trimEnd(), eslogan: g("eslogan"), color1: g("color1"), color2: g("color2") },
        portada: { etiqueta: g("etiqueta"), titulo: g("titulo"), tituloColor: g("tituloColor"), texto: g("texto"), foto: g("pfoto"), cifras: [0, 1, 2].map(i => ({ n: g("cif_n_" + i), t: g("cif_t_" + i) })) },
        nosotros: { titulo: g("ntitulo"), tituloColor: g("ntituloColor"), texto: g("ntexto"), foto: g("nfoto"), puntos: g("npuntos").split("\n").map(x => x.trim()).filter(Boolean) },
        equipo: pick("eq", [["n", "n"], ["cargo", "c"], ["d", "d"], ["foto", "foto"]]).filter(x => x.n),
        testimonios: pick("te", [["q", "q"], ["n", "n"], ["r", "r"]]).filter(x => x.q && x.n),
        redes: { facebook: g("facebook"), instagram: g("instagram"), tiktok: g("tiktok") },
        emergencias: $("[name=emergencias]", F).checked,
      };
      if (JSON.stringify(data).length > 900000) return toast("Las fotos son muy pesadas. Usa imágenes más pequeñas.", true);
      await safe(async () => { await DB.saveWeb(data); toast("Web actualizada"); $("#wMsg").textContent = "Guardado · " + nowHM() + " h"; cargarMarca(); });
    });
  },
});

/* ---------- Ficha de la mascota: citas reales de la agenda ---------- */
const _fichaOriginal = VIEWS.mascota;
VIEWS.mascota = async p => {
  await _fichaOriginal(p);
  const card = $("[data-cita]")?.closest(".card"); if (!card) return;
  const cs = (await DB.citasDeCliente(p.code)).filter(c => c.mascotaId === p.id && c.estado !== "atendida").sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  card.innerHTML = `<div class="card-h"><h2>${ico("cal")} Citas</h2><button class="btn btn-pri btn-sm" data-act="nueva" data-pre-code="${esc(p.code)}" data-pre-mid="${esc(p.id)}">${ico("plus")} Agendar cita</button></div>
    <div class="citas">${cs.map(c => citaCard(c, { fecha: true })).join("") || `<p class="empty">No tiene citas pendientes.</p>`}</div>`;
};

/* ---------- Formulario de producto con inventario ---------- */
function prodForm(p = {}) {
  const isNew = !p.id, inv = p.inv || {};
  modal(isNew ? "Nuevo producto" : "Editar producto", fotoField(p.img) + `<div class="grid2">
    ${fld("n", "Nombre del producto", p.n, { req: true, full: true, ph: "Ej. Alimento Perro Adulto 15 kg" })}
    ${fld("d", "Descripción corta", p.d, { full: true })}
    ${fld("cat", "Categoría", p.cat || "Alimento", { opts: CATS })}
    ${fld("esp", "Para", p.esp || "perro", { opts: [["perro", "Perro"], ["gato", "Gato"], ["ambos", "Perro y gato"]] })}
    ${fld("p", "Precio de venta (S/)", p.p ?? "", { req: true, type: "number", extra: 'min="0" step="0.01" inputmode="decimal"' })}
    ${fld("old", "Precio antes (oferta)", +p.old ? p.old : "", { type: "number", ph: "Opcional", extra: 'min="0" step="0.01"' })}
    ${fld("costo", "Costo de compra (S/)", inv.costo ?? "", { type: "number", ph: "Para calcular la ganancia", extra: 'min="0" step="0.01"' })}
    ${fld("cantidad", "Stock actual (unidades)", inv.cantidad ?? (isNew ? 0 : ""), { type: "number", ph: "Vacío = sin control de stock", extra: 'step="1"' })}
    ${fld("minimo", "Avisar cuando queden", inv.minimo ?? 3, { type: "number", extra: 'min="0" step="1"' })}
    ${fld("tag", "Etiqueta", p.tag || "", { opts: [["", "Ninguna"], ["Oferta", "Oferta"], ["Nuevo", "Nuevo"], ["Recomendado", "Recomendado por el vet"]] })}
    ${fld("visible", "Mostrar en la tienda", p.visible !== false, { type: "checkbox", ph: "Desmarca para ocultarlo sin borrarlo" })}
    ${fld("destacado", "Destacado en el inicio", !!p.destacado, { type: "checkbox", ph: "Aparece en «Lo más pedido»" })}
  </div>`, async d => {
    const pr = r2(parseFloat(d.p)), old = r2(parseFloat(d.old) || 0);
    if (!(pr >= 0)) { toast("Precio no válido", true); return false; }
    if (old && old <= pr) { toast("El «precio antes» debe ser mayor que el precio actual", true); return false; }
    const { costo, cantidad, minimo, ...rest } = d, data = { ...rest, p: pr, old };
    const ctl = String(cantidad).trim() !== "";
    if (ctl) data.stock = +cantidad > 0 ? "disponible" : "agotado";
    if (isNew) data.orden = Math.max(0, ...CUR.list.map(x => x.orden || 0)) + 1;
    const id = await DB.saveDocCol("productos", p.id || null, data);
    if (ctl || costo) await DB.setDocX("inventario", id, { ...(ctl ? { cantidad: Math.round(+cantidad) } : {}), costo: r2(costo), minimo: Math.max(0, Math.round(+minimo || 0)) });
    toast(isNew ? "Producto agregado" : "Producto actualizado"); refresh();
  }, isNew ? "Agregar producto" : "Guardar");
  bindFoto();
}
function ingresoForm(p) {
  const inv = p.inv || {};
  modal("Ingreso de mercadería", `<p class="sub" style="margin-bottom:12px"><b>${esc(p.n)}</b> · stock actual: ${inv.cantidad ?? "sin control"}</p><div class="grid2">
    ${fld("q", "Cantidad que llegó", "", { req: true, type: "number", extra: 'min="1" step="1"' })}
    ${fld("costo", "Costo unitario (S/)", inv.costo ?? "", { type: "number", extra: 'min="0" step="0.01"' })}
    ${fld("nota", "Proveedor / nota", "", { full: true, ph: "Opcional" })}</div>`, async d => {
    const q = Math.round(+d.q); if (!(q > 0)) { toast("Cantidad no válida", true); return false; }
    const n = await DB.stock(p.id, q, { ...(d.costo ? { costo: r2(d.costo) } : {}), ultimoIngreso: todayISO() });
    toast(`Stock actualizado: ${n} unidades`); refresh();
  }, "Sumar al stock");
}

/* ---------- Venta rápida (mostrador) ---------- */
async function ventaRapida() {
  const [ps, inv, svs] = await Promise.all([DB.listCol("productos"), DB.listCol("inventario"), DB.listCol("servicios")]);
  const im = {}; inv.forEach(x => im[x.id] = x);
  const prods = ordenar(ps), servs = ordenar(svs.length ? svs : window.DATOS.servicios), L = [];
  modal("Venta rápida", `
    <div class="vr-add"><select id="vrSel"><option value="">— Elegir producto o servicio —</option>
      <optgroup label="Productos">${prods.map(p => { const c = im[p.id] ? +im[p.id].cantidad : null; return `<option value="p:${esc(p.id)}" ${c != null && c <= 0 ? "disabled" : ""}>${esc(p.n)} · ${S(p.p)}${c != null ? ` · stock ${c}` : ""}</option>`; }).join("")}</optgroup>
      <optgroup label="Servicios">${servs.map(x => `<option value="s:${esc(x.id)}">${esc(x.n)}${+x.p ? " · " + S(x.p) : ""}</option>`).join("")}</optgroup></select>
      <input id="vrQ" type="number" min="1" value="1" aria-label="Cantidad"><button type="button" class="btn btn-light btn-sm" id="vrAdd">${ico("plus")} Agregar</button></div>
    <div id="vrList" class="vr-list"></div>
    <div class="vr-tot"><span>Total</span><b id="vrTot">S/ 0.00</b></div>
    <div class="grid2">${fld("metodo", "Forma de pago", "Efectivo", { opts: MET })}${fld("cliente", "Cliente (opcional)", "", { ph: "Nombre o código" })}</div>`, async d => {
    if (!L.length) { toast("Agrega al menos un producto o servicio", true); return false; }
    for (const l of L) if (l.tipo === "producto" && im[l.id] && +im[l.id].cantidad < l.q) { toast(`No hay stock suficiente de ${l.n}`, true); return false; }
    const total = r2(L.reduce((a, l) => a + l.p * l.q, 0));
    await DB.saveDocCol("movimientos", null, { fecha: todayISO(), hora: nowHM(), tipo: "venta", concepto: L.length === 1 ? `Venta · ${L[0].n}` : `Venta · ${L.length} ítems`, total, metodo: d.metodo,
      items: L.map(l => ({ tipo: l.tipo, id: l.id, n: l.n, q: l.q, p: l.p, costo: l.costo || 0 })), cliente: d.cliente, anulado: false });
    for (const l of L) if (l.tipo === "producto" && im[l.id]) await DB.stock(l.id, -l.q);
    toast(`Venta registrada: ${S(total)}`); CUR.cajaF = todayISO(); go("caja");
  }, "Registrar venta");
  const draw = () => {
    $("#vrList").innerHTML = L.map((l, i) => `<div class="vr-row"><span><b>${esc(l.n)}</b><small>${l.tipo === "producto" ? "Producto" : "Servicio"}</small></span>
      <input type="number" min="1" value="${l.q}" data-q="${i}" aria-label="Cantidad"><input type="number" min="0" step="0.1" value="${l.p}" data-p="${i}" aria-label="Precio"><b>${S(l.p * l.q)}</b><button type="button" class="icon-btn" data-rm="${i}">${ico("trash")}</button></div>`).join("") || `<p class="empty" style="padding:14px">Aún no agregas nada.</p>`;
    $("#vrTot").textContent = S(L.reduce((a, l) => a + l.p * l.q, 0));
  };
  $("#vrAdd").addEventListener("click", () => {
    const v = $("#vrSel").value, q = Math.max(1, Math.round(+$("#vrQ").value || 1)); if (!v) return;
    const [t, id] = v.split(":");
    if (t === "p") { const p = prods.find(x => x.id === id); const ex = L.find(l => l.id === id && l.tipo === "producto"); if (ex) ex.q += q; else L.push({ tipo: "producto", id, n: p.n, q, p: +p.p, costo: im[id] ? +im[id].costo || 0 : 0 }); }
    else { const s = servs.find(x => x.id === id); L.push({ tipo: "servicio", id, n: s.n, q, p: +s.p || 0 }); }
    $("#vrSel").value = ""; $("#vrQ").value = 1; draw();
  });
  $("#vrList").addEventListener("input", e => { const qi = e.target.dataset.q, pi = e.target.dataset.p;
    if (qi != null) L[qi].q = Math.max(1, Math.round(+e.target.value || 1)); if (pi != null) L[pi].p = r2(e.target.value);
    $("#vrTot").textContent = S(L.reduce((a, l) => a + l.p * l.q, 0)); });
  $("#vrList").addEventListener("change", draw);
  $("#vrList").addEventListener("click", e => { const b = e.target.closest("[data-rm]"); if (b) { L.splice(+b.dataset.rm, 1); draw(); } });
  draw();
}
async function anularMov(m) {
  confirmDel(`Se anulará <b>${esc(m.concepto)}</b> por ${S(m.total)}. ${(m.items || []).some(i => i.tipo === "producto") ? "Los productos volverán al stock." : ""}${m.citaId ? " También se descontará de lo pagado en la cita." : ""}`, async () => {
    await DB.saveDocCol("movimientos", m.id, { anulado: true, anuladoEl: new Date().toISOString() });
    for (const i of (m.items || [])) if (i.tipo === "producto" && i.id && await DB.getDocX("inventario", i.id)) await DB.stock(i.id, +i.q);
    if (m.citaId) { const c = await DB.getDocX("citas", m.citaId);
      if (c) { const pagado = r2(Math.max((+c.pagado || 0) - (+m.total || 0), 0)), t = totalDe(c), nc = { ...c, id: m.citaId, pagado, estadoPago: t > 0 && pagado >= t ? "pagado" : pagado > 0 ? "adelanto" : "pendiente" };
        await DB.guardarCita(m.citaId, { pagado, estadoPago: nc.estadoPago }); if (c.estado === "atendida") await syncHistorial(nc); } }
    toast("Movimiento anulado"); refresh();
  });
}

/* =========================================================
   CLICS
   ========================================================= */
document.addEventListener("click", async e => {
  const t = e.target.closest("button, a"); if (!t || !$("#view").contains(t)) return;
  if (t.matches("[data-act='nueva']")) return nuevaCita({ code: t.dataset.preCode || "", mid: t.dataset.preMid || "", fecha: AG.modo === "dia" && CUR.v === "agenda" ? AG.fecha : "" });
  if (t.matches("[data-cita-cliente]")) return nuevaCita({ code: t.dataset.citaCliente });
  if (t.matches("[data-act]") && t.closest("[data-cid]")) {
    const c = CITAS[t.closest("[data-cid]").dataset.cid]; if (!c) return;
    const act = t.dataset.act;
    if (act === "wa") return openWA(c.celular, msgCitaWA(c, await cargarAjustes()));
    if (act === "cobrar") return cobrar(c);
    if (act === "atender") return atender(c);
    if (act === "vincular") return vincular(c);
    if (act === "cancelar") return cancelarCita(c);
    if (act === "diag") return diagnostico(c);
    if (act === "ficha") return go("mascota", { code: c.code, id: c.mascotaId });
  }
  if (t.matches("[data-send-citas]")) {
    const code = t.dataset.sendCitas, [cl, aj] = await Promise.all([DB.getCliente(code), cargarAjustes()]);
    const cs = (await DB.citasDeCliente(code)).filter(c => c.estado !== "atendida" && c.fecha >= todayISO()).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
    const deudas = (await DB.citasDeCliente(code)).filter(c => c.estado === "atendida" && pagoInfo(c).saldo > 0);
    if (!cs.length && !deudas.length) return toast("Este cliente no tiene citas próximas", true);
    const L = [`Hola ${cl.dueno.split(" ")[0]}, te saluda *${NOMBRE_V}*.`, ""];
    if (cs.length) { L.push(`Tus próximas citas (${cs.length}):`, ""); cs.forEach((c, i) => L.push(`*${i + 1}. ${c.mascota} · ${c.servicio}*`, `   ${largo(c.fecha)} a las ${c.hora} h`, `   ${totalDe(c) ? "Precio: " + S(totalDe(c)) + " · " : ""}Pago: ${pagoInfo(c).wa}`, "")); }
    if (deudas.length) { L.push("Saldos pendientes:"); deudas.forEach(c => L.push(`• ${c.mascota} · ${c.servicio} (${fmt(c.fecha)}): ${S(pagoInfo(c).saldo)}`)); L.push(""); }
    if (aj.direccion) L.push(`Dirección: ${aj.direccion}`);
    L.push(`Revisa todo con tu código *${code}*: ${portalLink(code)}`);
    return openWA(cl.celular, L.join("\n"));
  }
  // Agenda
  if (t.matches("[data-modo]")) { AG.modo = t.dataset.modo; return refresh(); }
  if (t.matches("[data-hoy]")) { AG.fecha = todayISO(); return refresh(); }
  if (t.matches("[data-mov]")) { const k = +t.dataset.mov, f = AG.fecha;
    if (AG.modo === "dia") AG.fecha = addDays(f, k); else if (AG.modo === "semana") AG.fecha = addDays(f, 7 * k);
    else { const d = toD(f); const n = new Date(d.getFullYear(), d.getMonth() + k, 1); AG.fecha = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-01`; }
    return refresh(); }
  if (t.matches("[data-dia]")) { AG.fecha = t.dataset.dia; AG.modo = "dia"; return refresh(); }
  if (t.matches("[data-new-at]")) return nuevaCita({ fecha: AG.fecha, hora: t.dataset.newAt });
  if (t.matches("[data-block]")) { const h = t.dataset.block;
    return modal(`Bloquear ${h} h`, `<p class="sub" style="margin-bottom:12px">${largo(AG.fecha)} · nadie podrá reservar en ese horario.</p>${fld("motivo", "Motivo (opcional)", "", { ph: "Ej. Refrigerio, cirugía" })}`,
      async d => { await DB.bloquear(AG.fecha, h, CUR.cap, d.motivo); toast("Horario bloqueado"); refresh(); }, "Bloquear"); }
  if (t.matches("[data-block-day]")) return modal("Bloquear día completo", `<p class="sub" style="margin-bottom:12px">${largo(AG.fecha)} · se bloquean todos los horarios libres (las citas ya registradas se mantienen).</p>${fld("motivo", "Motivo", "", { ph: "Ej. Feriado, capacitación" })}`,
    async d => { for (const h of horasDia(AG.fecha, CUR.aj)) await DB.bloquear(AG.fecha, h, CUR.cap, d.motivo); toast("Día bloqueado"); refresh(); }, "Bloquear día");
  if (t.matches("[data-unblock]")) { await safe(() => DB.desbloquear(AG.fecha, t.dataset.unblock)); toast("Horario libre otra vez"); return refresh(); }
  // Caja y reportes
  if (t.matches("[data-venta]")) return ventaRapida();
  if (t.matches("[data-cmov]")) { CUR.cajaF = addDays(CUR.cajaF || todayISO(), +t.dataset.cmov); return refresh(); }
  if (t.matches("[data-choy]")) { CUR.cajaF = todayISO(); return refresh(); }
  if (t.matches("[data-anular]")) return anularMov(CUR.movs.find(m => m.id === t.dataset.anular));
  if (t.matches("[data-rep]")) { CUR.rep = t.dataset.rep; return refresh(); }
  // Inventario
  const row = t.closest("[data-prod]");
  if (row && CUR.v === "tienda") { const p = CUR.list.find(x => x.id === row.dataset.prod); if (!p) return;
    if (t.matches("[data-ingreso]")) return ingresoForm(p);
    if (t.matches("[data-del-prod2]")) return confirmDel(`Se eliminará <b>${esc(p.n)}</b> de la web y del inventario.`, async () => { await DB.delDocCol("productos", p.id); await DB.delDocCol("inventario", p.id).catch(() => {}); await DB.delProdInfo(p.id).catch(() => {}); toast("Eliminado"); refresh(); });
  }
});
