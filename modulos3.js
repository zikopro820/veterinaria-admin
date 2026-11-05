/* =========================================================
   MÓDULOS 3: Doctores · Asignación · Ficha de atención
   ========================================================= */
let DOCS = [];
const DIAS_C = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
async function cargarDocs() {
  const g = await DB.getConf("doctores");
  DOCS = (g && g.lista) || JSON.parse(JSON.stringify(window.DATOS.doctores || []));
  // la web solo puede reservar hasta "capacidad" lugares por horario: debe alcanzar para todos los doctores
  const act = DOCS.filter(d => d.activo !== false).length;
  if (act) { const aj = await DB.getAjustes(); if ((+aj.capacidad || 1) < act) await DB.saveAjustes({ capacidad: act }); }
  return DOCS;
}
const guardarDocs = async () => {
  await DB.saveConf("doctores", { lista: DOCS });
  const act = DOCS.filter(d => d.activo !== false).length;
  if (act) await DB.saveAjustes({ capacidad: act });
};
const ausente = (d, f) => (d.ausencias || []).some(a => a.desde <= f && f <= (a.hasta || a.desde));
const ausenciaDe = (d, f) => (d.ausencias || []).find(a => a.desde <= f && f <= (a.hasta || a.desde));
function trabaja(d, f, h, aj) {   // ¿el doctor atiende ese día y a esa hora?
  if (d.activo === false || ausente(d, f)) return false;
  const dia = toD(f).getDay(); if (!(d.dias || [1, 2, 3, 4, 5, 6]).includes(dia)) return false;
  const paso = +(aj && aj.turno) || 30;
  return aMin(h) >= aMin(d.desde || "0:00") && aMin(h) + paso <= aMin(d.hasta || "23:59");
}
const docsActivos = () => DOCS.filter(d => d.activo !== false);
function capSlot(f, h, aj) { return DOCS.length ? docsActivos().filter(d => trabaja(d, f, h, aj)).length : Math.max(1, +aj.capacidad || 1); }
const capMax = aj => DOCS.length ? Math.max(1, docsActivos().length) : Math.max(1, +aj.capacidad || 1);
function estadoDocs(f, h, aj, citas, exceptoId) {   // disponible / ocupado / ausente en un horario
  return docsActivos().map(d => {
    const cita = citas.find(c => c.id !== exceptoId && c.fecha === f && c.hora === h && c.vetId === d.id && c.estado !== "cancelada");
    const est = ausente(d, f) ? "ausente" : !trabaja(d, f, h, aj) ? "fuera" : cita ? "ocupado" : "libre";
    return { d, est, cita };
  });
}
const EST_TXT = { libre: ["ok", "Disponible"], ocupado: ["bad", "Ocupado"], ausente: ["dark", "No vino"], fuera: ["", "No trabaja a esa hora"] };
const avatarDoc = d => `<span class="dav" style="background:${esc(d.color || "var(--pri)")}">${d.foto ? `<img src="${esc(foto(d.foto, 120))}" alt="">` : esc(String(d.n || "").replace(/^(Dra?\.)\s*/i, "").split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase())}</span>`;

/* ---------------- Vista DOCTORES ---------------- */
Object.assign(VIEWS, {
  async doctores() {
    await cargarDocs();
    const aj = await cargarAjustes(), hoy = todayISO();
    const cs = await DB.rango("citas", hoy, addDays(hoy, 6));
    const ag = new Date(), ahora = String(ag.getHours()).padStart(2, "0") + ":" + String(ag.getMinutes() < 30 ? "00" : "30");
    $("#view").innerHTML = topBar("Doctores", "Horarios de atención, ausencias y citas asignadas. La web ofrece tantas citas por horario como doctores disponibles.",
      `<button class="btn btn-pri" data-dnew>${ico("plus")} Nuevo doctor</button>`) + `
      <div class="docs">${DOCS.map((d, i) => {
        const aus = ausenciaDe(d, hoy), hoyC = cs.filter(c => c.vetId === d.id && c.fecha === hoy), sem = cs.filter(c => c.vetId === d.id);
        const ahoraC = hoyC.find(c => c.hora === ahora), trabajaHoy = (d.dias || []).includes(toD(hoy).getDay());
        const est = d.activo === false ? ["", "Inactivo"] : aus ? ["dark", "No vino hoy"] : !trabajaHoy ? ["", "Hoy no trabaja"] : ahoraC ? ["bad", "En cita ahora"] : ["ok", "Disponible hoy"];
        return `<div class="card doc-card ${d.activo === false ? "dim" : ""}" data-di="${i}">
          <div class="doc-h">${avatarDoc(d)}<div><b>${esc(d.n)}</b><small>${esc(d.esp || "")}</small></div><span class="st ${est[0]}">${est[1]}</span></div>
          <div class="doc-info"><span>${ico("cal")} ${(d.dias || []).slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(x => DIAS_C[x]).join(", ") || "Sin días"}</span><span>${ico("bell")} ${esc(d.desde || "")} – ${esc(d.hasta || "")}</span></div>
          ${aus ? `<p class="doc-aus">${ico("alert")} Ausente${aus.hasta && aus.hasta !== aus.desde ? ` hasta el ${fmt(aus.hasta)}` : " hoy"}${aus.motivo ? " · " + esc(aus.motivo) : ""}</p>` : ""}
          <div class="doc-stats"><div><b>${hoyC.length}</b><small>citas hoy</small></div><div><b>${sem.length}</b><small>próximos 7 días</small></div></div>
          ${(d.ausencias || []).filter(a => (a.hasta || a.desde) >= hoy).length ? `<div class="aus-list">${(d.ausencias || []).filter(a => (a.hasta || a.desde) >= hoy).map((a, j) => `<span>${fmt(a.desde)}${a.hasta && a.hasta !== a.desde ? " → " + fmt(a.hasta) : ""}${a.motivo ? " · " + esc(a.motivo) : ""}<button data-ausdel="${(d.ausencias || []).indexOf(a)}" title="Quitar">×</button></span>`).join("")}</div>` : ""}
          <div class="acts doc-acts">
            <button class="btn btn-sm ${aus && aus.desde === hoy && (aus.hasta || hoy) === hoy ? "btn-light" : "btn-danger"}" data-dhoy>${aus && aus.desde === hoy && (aus.hasta || hoy) === hoy ? "Sí vino hoy" : "No vino hoy"}</button>
            <button class="btn btn-light btn-sm" data-daus>${ico("cal")} Ausencia</button>
            <button class="icon-btn edit" data-dedit title="Editar">${ico("edit")}</button><button class="icon-btn" data-ddel title="Eliminar">${ico("trash")}</button>
          </div></div>`; }).join("") || `<p class="empty">Aún no registraste doctores.</p>`}</div>
      <p class="sub" style="margin-top:6px">Las citas con un doctor ausente aparecen en la Agenda con el aviso <b>«Reasignar»</b>.</p>`;
    CUR.aj = aj;
  },
});
function docForm(i) {
  const d = i == null ? { n: "", esp: "", foto: "", color: "#5b3df5", dias: [1, 2, 3, 4, 5, 6], desde: "09:00", hasta: "19:00", activo: true, ausencias: [] } : DOCS[i];
  const pad = t => t && t.length === 4 ? "0" + t : t;
  modal(i == null ? "Nuevo doctor" : "Editar doctor", `
    <div class="photo-up"><span class="prev" id="pPrev">${d.foto ? `<img src="${esc(foto(d.foto, 200))}" alt="">` : ico("camera")}</span><div><label class="btn btn-light btn-sm" for="pFile">${ico("camera")} Foto</label><input type="file" id="pFile" accept="image/*"><small>Opcional</small></div><input type="hidden" name="img" value="${esc(d.foto || "")}"></div>
    <div class="grid2">
      ${fld("n", "Nombre", d.n, { req: true, ph: "Ej. Dra. Carla Méndez" })}${fld("esp", "Especialidad", d.esp, { ph: "Ej. Medicina general" })}
      ${fld("desde", "Entra", pad(d.desde), { type: "time", req: true })}${fld("hasta", "Sale", pad(d.hasta), { type: "time", req: true })}
      <div class="field full"><label>Días que atiende</label><div class="days">${[1, 2, 3, 4, 5, 6, 0].map(x => `<label><input type="checkbox" data-dia="${x}" ${(d.dias || []).includes(x) ? "checked" : ""}><span>${DIAS_C[x]}</span></label>`).join("")}</div></div>
      ${fld("color", "Color en la agenda", d.color || "#5b3df5", { type: "color" })}
      ${fld("activo", "Activo (aparece en la agenda)", d.activo !== false, { type: "checkbox" })}
    </div>`, async v => {
    const dias = $$("#modalForm [data-dia]").filter(x => x.checked).map(x => +x.dataset.dia);
    if (!dias.length) { toast("Elige al menos un día", true); return false; }
    if (aMin(v.hasta) <= aMin(v.desde)) { toast("La hora de salida debe ser después de la entrada", true); return false; }
    const hh = t => t.replace(/^0(\d)/, "$1");
    const nuevo = { ...d, n: v.n, esp: v.esp, foto: v.img, color: v.color, dias, desde: hh(v.desde), hasta: hh(v.hasta), activo: !!v.activo };
    if (i == null) { let id = slug(v.n) || "doc", k = 2; while (DOCS.some(x => x.id === id)) id = slug(v.n) + "-" + k++; nuevo.id = id; DOCS.push(nuevo); } else DOCS[i] = nuevo;
    await guardarDocs(); toast("Doctor guardado"); refresh();
  }, "Guardar");
  $("#pFile").addEventListener("change", async e => { const f = e.target.files[0]; if (!f) return; const data = await resizeImage(f, 300, .8); $("[name=img]").value = data; $("#pPrev").innerHTML = `<img src="${data}" alt="">`; });
}
function ausForm(i) {
  const d = DOCS[i];
  modal(`Ausencia de ${d.n}`, `<div class="grid2">${fld("desde", "Desde", todayISO(), { type: "date", req: true })}${fld("hasta", "Hasta", todayISO(), { type: "date", req: true })}${fld("motivo", "Motivo", "", { full: true, ph: "Ej. Vacaciones, permiso, capacitación" })}</div>
    <p class="sub">En esos días no se le asignarán citas y la web ofrecerá menos horarios.</p>`, async v => {
    if (v.hasta < v.desde) { toast("La fecha final debe ser después de la inicial", true); return false; }
    d.ausencias = [...(d.ausencias || []), { desde: v.desde, hasta: v.hasta, motivo: v.motivo }];
    await guardarDocs(); toast("Ausencia registrada"); refresh();
  }, "Guardar ausencia");
}

/* ---------------- Asignar doctor a una cita ---------------- */
async function asignarDoctor(c) {
  await cargarDocs();
  const aj = await cargarAjustes(), cs = await DB.rango("citas", c.fecha, c.fecha);
  const lista = estadoDocs(c.fecha, c.hora, aj, cs, c.id);
  const orden = { libre: 0, ocupado: 1, fuera: 2, ausente: 3 };
  modal("Asignar doctor", `<p class="sub" style="margin-bottom:12px">${esc(c.mascota)} · ${esc(c.servicio)} · ${largo(c.fecha)} · <b>${esc(c.hora)} h</b></p>
    <div class="doc-pick">${lista.sort((a, b) => orden[a.est] - orden[b.est]).map(x => `<label class="dp ${x.est}"><input type="radio" name="vetId" value="${esc(x.d.id)}" ${x.est !== "libre" ? "disabled" : ""} ${x.d.id === c.vetId ? "checked" : ""}>
      ${avatarDoc(x.d)}<span><b>${esc(x.d.n)}</b><small>${esc(x.d.esp || "")}${x.cita ? ` · con ${esc(x.cita.mascota)} (${esc(x.cita.servicio)})` : ""}</small></span><i class="st ${EST_TXT[x.est][0]}">${EST_TXT[x.est][1]}</i></label>`).join("") || `<p class="empty">Registra doctores en la sección Doctores.</p>`}</div>
    ${fld("enviar", "Avisar al cliente por WhatsApp qué doctor lo atenderá", true, { type: "checkbox" })}`, async v => {
    if (!v.vetId) { toast("Elige un doctor disponible", true); return false; }
    const d = DOCS.find(x => x.id === v.vetId);
    await DB.guardarCita(c.id, { vetId: d.id, vet: d.n });
    toast(`Asignada a ${d.n}`);
    if (v.enviar && c.celular) openWA(c.celular, msgCitaWA({ ...c, vetId: d.id, vet: d.n }, aj));
    refresh();
  }, "Asignar");
}

/* ---------------- Ficha de atención (historial clínico) ---------------- */
async function fichaAtencion(c, modo = "atender") {
  await cargarDocs();
  const aj = await cargarAjustes(), p = pagoInfo(c), editar = modo === "editar";
  let h = {};
  if (c.code && c.mascotaId) { const m = await DB.getMascota(c.code, c.mascotaId); h = ((m && m.historial) || []).find(x => x.citaId === c.id) || {}; }
  const cs = await DB.rango("citas", c.fecha, c.fecha), estados = estadoDocs(c.fecha, c.hora, aj, cs, c.id);
  const vetSel = h.vetId || c.vetId || (estados.find(x => x.est === "libre") || {}).d?.id || "";
  const meds = h.meds && h.meds.length ? h.meds : [{ n: "", dosis: "", cada: "", dias: "" }];
  const medRow = m => `<div class="med" data-med><input data-m="n" value="${esc(m.n)}" placeholder="Medicamento *"><input data-m="dosis" value="${esc(m.dosis)}" placeholder="Dosis (ej. 1 tableta)"><input data-m="cada" value="${esc(m.cada)}" placeholder="Cada (ej. 12 h)"><input data-m="dias" value="${esc(m.dias)}" placeholder="Días (ej. 7)"><button type="button" class="icon-btn" data-mdel title="Quitar">${ico("trash")}</button></div>`;
  modal(editar ? "Ficha de la atención" : "Atención y historial clínico", `
    <p class="sub" style="margin-bottom:12px">${esc(c.mascota)} · ${esc(c.servicio)} · ${fmtD(c.fecha)} ${esc(c.hora)} h${c.code ? "" : " · <b>Sin código:</b> el historial se guardará al vincular la cita"}</p>
    <div class="grid2">
      <div class="field full"><label>Doctor que atendió *</label><select name="vetId" required><option value="">— Elegir doctor —</option>${estados.map(x => `<option value="${esc(x.d.id)}" ${x.d.id === vetSel ? "selected" : ""}>${esc(x.d.n)}${x.est !== "libre" && x.d.id !== vetSel ? ` (${EST_TXT[x.est][1].toLowerCase()})` : ""}</option>`).join("")}</select></div>
      ${fld("d", "Diagnóstico *", h.d || "", { type: "textarea", full: true, req: true, ph: "Ej. Otitis externa leve en oído derecho" })}
      <div class="field full"><label>Medicamentos usados o recetados</label><div id="medList">${meds.map(medRow).join("")}</div><button type="button" class="btn btn-light btn-sm" data-madd style="margin-top:8px">${ico("plus")} Agregar medicamento</button></div>
      ${fld("ind", "Tratamiento e indicaciones para casa", h.ind || "", { type: "textarea", full: true, ph: "Ej. Limpiar el oído cada 12 h. Evitar baños por 7 días." })}
      ${fld("peso", "Peso", h.peso || "", { ph: "Ej. 12.4 kg" })}${fld("temp", "Temperatura", h.temp || "", { ph: "Ej. 38.5 °C" })}
      ${fld("control", "Próximo control (opcional)", h.control || "", { type: "date" })}${fld("controlMotivo", "Motivo del control", h.controlMotivo || "", { ph: "Ej. Revisar oído" })}
      ${editar ? "" : `${fld("total", "Precio final (S/)", totalDe(c), { type: "number", extra: 'min="0" step="0.5"' })}
      ${fld("monto", `Cobrar ahora (S/) · ya pagó ${S(c.pagado)}`, p.saldo || "", { type: "number", ph: "0 = queda pendiente", extra: 'min="0" step="0.1"' })}
      ${fld("metodo", "Forma de pago", "Efectivo", { opts: MET })}`}
      ${fld("enviar", editar ? "Enviar la receta al cliente por WhatsApp" : "Enviar resumen, receta y estado de pago por WhatsApp", !editar, { type: "checkbox", full: true })}
    </div>`, async v => {
    const doc = DOCS.find(x => x.id === v.vetId); if (!doc) { toast("Elige el doctor que atendió", true); return false; }
    const medsV = $$("#medList [data-med]").map(r => { const o = {}; $$("[data-m]", r).forEach(i => o[i.dataset.m] = i.value.trim()); return o; }).filter(m => m.n);
    const extra = { d: v.d, ind: v.ind, meds: medsV, peso: v.peso, temp: v.temp, vet: doc.n, vetId: doc.id, control: v.control, controlMotivo: v.controlMotivo };
    let nc = { ...c, vet: doc.n, vetId: doc.id };
    if (!editar) {
      const t = r2(v.total);
      await DB.guardarCita(c.id, { total: t, estado: "atendida", vet: doc.n, vetId: doc.id, atendida: new Date().toISOString() });
      nc = { ...nc, total: t, estado: "atendida" };
    } else if (c.vetId !== doc.id) await DB.guardarCita(c.id, { vet: doc.n, vetId: doc.id });
    await syncHistorial(nc, extra);
    // próximo control → recordatorio para el cliente
    if (v.control && c.code && c.mascotaId) {
      const m = await DB.getMascota(c.code, c.mascotaId);
      const rec = (m.rec || []).filter(r => r.citaId !== c.id);
      rec.push({ id: uid(), i: "steth", t: "Control: " + (v.controlMotivo || c.servicio), f: v.control, citaId: c.id });
      await DB.saveMascota(c.code, c.mascotaId, { rec });
    }
    if (!editar) {
      if (+v.monto > 0) nc = await registrarPago(nc, r2(v.monto), v.metodo, "Pago");
      else { const t = totalDe(nc); nc.estadoPago = t > 0 && (+c.pagado || 0) >= t ? "pagado" : (+c.pagado || 0) > 0 ? "adelanto" : "pendiente"; await DB.guardarCita(c.id, { estadoPago: nc.estadoPago }); }
    }
    toast(editar ? "Ficha actualizada" : pagoInfo(nc).saldo > 0 ? "Atendida · queda saldo pendiente" : "Atención guardada en el historial");
    if (v.enviar && c.celular) {
      const L = [msgCitaWA(nc, aj).split("\n\n").slice(0, 2).join("\n\n"), ""];
      L.push(`*Diagnóstico:* ${v.d}`);
      if (medsV.length) { L.push("", "*Receta:*"); medsV.forEach(m => L.push(`• ${m.n}${m.dosis ? " – " + m.dosis : ""}${m.cada ? ", cada " + m.cada : ""}${m.dias ? ", por " + m.dias + " días" : ""}`)); }
      if (v.ind) L.push("", `*Indicaciones:* ${v.ind}`);
      if (v.control) L.push("", `*Próximo control:* ${largo(v.control)}${v.controlMotivo ? " – " + v.controlMotivo : ""}`);
      if (c.code) L.push("", `Todo queda en Mi Mascota: ${portalLink(c.code)}`);
      openWA(c.celular, L.join("\n"));
    }
    refresh();
  }, editar ? "Guardar ficha" : "Guardar atención");
  const F = $("#modalForm");
  const onClick = e => {
    if (!$("#medList")) return F.removeEventListener("click", onClick);
    const t = e.target.closest("button"); if (!t) return;
    if (t.matches("[data-madd]")) $("#medList").insertAdjacentHTML("beforeend", medRow({ n: "", dosis: "", cada: "", dias: "" }));
    if (t.matches("[data-mdel]")) { const r = t.closest("[data-med]"); if ($$("#medList [data-med]").length > 1) r.remove(); else $$("input", r).forEach(i => i.value = ""); }
  };
  F.addEventListener("click", onClick);
}
atender = c => fichaAtencion(c, "atender");          // eslint-disable-line no-global-assign
diagnostico = c => fichaAtencion(c, "editar");       // eslint-disable-line no-global-assign

/* ---------------- Clics ---------------- */
document.addEventListener("click", async e => {
  const t = e.target.closest("button"); if (!t || !$("#view").contains(t)) return;
  if (t.matches("[data-act='asignar']") && t.closest("[data-cid]")) { const c = CITAS[t.closest("[data-cid]").dataset.cid]; if (c) return asignarDoctor(c); }
  if (CUR.v !== "doctores") return;
  if (t.matches("[data-dnew]")) return docForm(null);
  const card = t.closest("[data-di]"); if (!card) return;
  const i = +card.dataset.di, d = DOCS[i], hoy = todayISO();
  if (t.matches("[data-dedit]")) return docForm(i);
  if (t.matches("[data-daus]")) return ausForm(i);
  if (t.matches("[data-dhoy]")) {
    const k = (d.ausencias || []).findIndex(a => a.desde === hoy && (a.hasta || hoy) === hoy);
    if (k >= 0) d.ausencias.splice(k, 1); else d.ausencias = [...(d.ausencias || []), { desde: hoy, hasta: hoy, motivo: "No vino" }];
    await guardarDocs(); toast(k >= 0 ? `${d.n} sí vino hoy` : `${d.n} marcado como ausente hoy`); return refresh();
  }
  if (t.dataset.ausdel != null) { d.ausencias.splice(+t.dataset.ausdel, 1); await guardarDocs(); toast("Ausencia quitada"); return refresh(); }
  if (t.matches("[data-ddel]")) return confirmDel(`Se eliminará a <b>${esc(d.n)}</b>. Sus citas pasadas conservan su nombre.`, async () => { DOCS.splice(i, 1); await guardarDocs(); toast("Doctor eliminado"); refresh(); });
});
