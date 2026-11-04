/* =========================================================
   PANEL ADMINISTRATIVO — lógica
   ========================================================= */
const A = window.APP;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SVG = {
  home: '<path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M1 21a8 8 0 0 1 16 0M17 4a4 4 0 0 1 0 8M23 21a8 8 0 0 0-5-7.4"/>',
  paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M8 14c0-2 1.8-4 4-4s4 2 4 4c0 1.5 2 2.5 2 4.5S16.5 22 15 22c-1.2 0-2-.8-3-.8s-1.8.8-3 .8c-1.5 0-3-1.5-3-3.5S8 15.5 8 14z"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  shield: '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  pin: '<path d="M12 22s8-7.6 8-13a8 8 0 0 0-16 0c0 5.4 8 13 8 13z"/><circle cx="12" cy="9" r="3"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  check: '<path d="M5 12l5 5L20 7"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  wa: '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3z"/>',
};
const ico = k => `<svg class="ico" viewBox="0 0 24 24">${SVG[k]}</svg>`;
const REC_ICONS = { pill: "Medicamento / desparasitación", bath: "Baño / grooming", food: "Alimento / compra", steth: "Control / chequeo", alert: "Indicación importante" };

/* ---------- Fechas ---------- */
const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const toD = s => { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const addDays = (s, n) => { const d = toD(s); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const fmt = s => { const d = toD(s); return d ? `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}` : "—"; };
const fmtD = s => { const d = toD(s); return d ? `${DIA[d.getDay()]} ${d.getDate()} ${MES[d.getMonth()]}` : "—"; };
const diff = s => Math.round((toD(s) - toD(todayISO())) / 864e5);
const enDias = n => n === 0 ? "hoy" : n === 1 ? "mañana" : n === -1 ? "ayer" : n < 0 ? `hace ${-n} días` : `en ${n} días`;
const edad = s => { if (!s) return "—"; const m = Math.floor((Date.now() - toD(s)) / (30.44 * 864e5)); return m >= 12 ? `${Math.floor(m / 12)} año${m >= 24 ? "s" : ""}${m % 12 ? " y " + (m % 12) + " m" : ""}` : `${Math.max(m, 0)} meses`; };
const vacSt = v => { const n = diff(v.prox); return n < 0 ? `<span class="st bad">Vencida</span>` : n <= 30 ? `<span class="st warn">Vence ${enDias(n)}</span>` : `<span class="st ok">Al día</span>`; };

/* ---------- Utilidades ---------- */
const foto = (f, w = 500) => !f ? "" : (f.startsWith("data:") || f.startsWith("http")) ? f : `https://images.unsplash.com/photo-${f}?auto=format&fit=crop&w=${w}&q=80`;
const avatar = (m, cls = "av") => `<span class="${cls}">${m.foto ? `<img src="${esc(foto(m.foto, 200))}" alt="" onerror="this.remove()">` : ico("paw")}</span>`;
const waNum = c => { const d = String(c || "").replace(/\D/g, ""); return d.length === 9 ? "51" + d : d; };
const openWA = (cel, txt) => window.open(`https://wa.me/${waNum(cel)}?text=${encodeURIComponent(txt)}`, "_blank");
const portalLink = code => `${A.portal}?codigo=${code}`;
const uid = () => Math.random().toString(36).slice(2, 10);
function toast(t, bad) { const el = $("#toast"); el.className = "toast show" + (bad ? " bad" : ""); el.innerHTML = (bad ? ico("alert") : ico("check")) + esc(t); clearTimeout(el._t); el._t = setTimeout(() => el.className = "toast", 2400); }
async function safe(fn) { try { return await fn(); } catch (e) { console.error(e); toast(e.message || "Ocurrió un error", true); } }

/* ---------- Ventana (modal) ---------- */
let mSubmit = null;
function modal(title, body, onSubmit, okText = "Guardar") {
  $("#mTitle").textContent = title; $("#mBody").innerHTML = body; $("#mOk").textContent = okText; $("#mOk").className = "btn " + (okText === "Eliminar" ? "btn-danger" : "btn-pri");
  mSubmit = onSubmit; $("#modal").classList.add("open");
  setTimeout(() => $("#mBody input:not([type=hidden]):not([type=file]), #mBody select, #mBody textarea")?.focus(), 50);
}
const closeModal = () => $("#modal").classList.remove("open");
$$("[data-mclose]").forEach(b => b.addEventListener("click", closeModal));
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
$("#modalForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = $("#modalForm"); $$(".error", f).forEach(x => x.style.borderColor = "");
  const bad = $$("[required]", f).filter(x => !x.value.trim());
  if (bad.length) { bad.forEach(x => x.style.borderColor = "var(--red)"); bad[0].focus(); return; }
  const data = {}; $$("[name]", f).forEach(x => data[x.name] = x.type === "checkbox" ? x.checked : x.value.trim());
  const btn = $("#mOk"); btn.disabled = true;
  const ok = await safe(() => mSubmit(data));
  btn.disabled = false;
  if (ok !== false) closeModal();
});
const fld = (name, label, val = "", o = {}) => `<div class="field ${o.full ? "full" : ""}"><label>${label}${o.req ? " *" : ""}</label>${
  o.type === "textarea" ? `<textarea name="${name}" ${o.req ? "required" : ""} placeholder="${o.ph || ""}">${esc(val)}</textarea>`
  : o.opts ? `<select name="${name}" ${o.req ? "required" : ""}>${o.blank ? `<option value="">— Elegir —</option>` : ""}${o.opts.map(x => { const [v, t] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}" ${v === val ? "selected" : ""}>${esc(t)}</option>`; }).join("")}</select>`
  : `<input name="${name}" type="${o.type || "text"}" value="${esc(val)}" ${o.req ? "required" : ""} placeholder="${o.ph || ""}" ${o.list ? `list="${o.list}"` : ""} ${o.extra || ""}>`}</div>`;
const datalist = (id, arr) => `<datalist id="${id}">${arr.map(x => `<option value="${esc(x)}">`).join("")}</datalist>`;

/* Reducir foto antes de guardar (para que entre en la base de datos gratis) */
function resizeImage(file, max = 640, q = .72) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => {
      const s = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas");
      c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", q)); }; im.onerror = rej; im.src = r.result; };
    r.onerror = rej; r.readAsDataURL(file);
  });
}

/* =========================================================
   SESIÓN
   ========================================================= */
let USER = null;
if (DB.mode === "demo") $("#demoHint").classList.remove("hidden");
DB.onUser(u => {
  USER = u;
  $("#loginView").classList.toggle("hidden", !!u); $("#appView").classList.toggle("hidden", !u);
  if (u) { $("#who").textContent = u.email; const t = $("#modeTag"); t.className = "mode " + (DB.mode === "demo" ? "demo" : "live"); t.textContent = DB.mode === "demo" ? "MODO DEMO" : "FIREBASE CONECTADO"; go("inicio"); }
});
$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault(); const b = $("#lBtn"); b.disabled = true; $("#lErr").textContent = "";
  try { await DB.login($("#lEmail").value.trim(), $("#lPass").value); } catch (err) { $("#lErr").textContent = err.message; }
  b.disabled = false;
});
$("#logoutBtn").addEventListener("click", () => DB.logout());
$("#nav").addEventListener("click", e => { const b = e.target.closest("[data-view]"); if (b) { go(b.dataset.view); $("#side").classList.remove("open"); } });
document.addEventListener("click", e => { if (e.target.closest("[data-burger]")) $("#side").classList.toggle("open"); else if ($("#side").classList.contains("open") && !e.target.closest("#side")) $("#side").classList.remove("open"); });

/* =========================================================
   NAVEGACIÓN
   ========================================================= */
let CUR = { v: "inicio" };
async function go(v, p = {}) {
  CUR = { v, ...p };
  $$("#nav button").forEach(b => b.classList.toggle("on", b.dataset.view === (v === "cliente" || v === "mascota" ? "clientes" : v)));
  $("#view").innerHTML = `<p class="loading">Cargando…</p>`;
  await safe(() => VIEWS[v](p));
  window.scrollTo(0, 0);
}
const refresh = () => go(CUR.v, CUR);
const topBar = (title, sub, actions = "", crumb = "") => `<div class="top"><div>${crumb}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="top-actions">${actions}<button class="btn btn-light burger" data-burger aria-label="Menú">${ico("menu")}</button></div></div>`;

const VIEWS = {
  /* ---------------- INICIO ---------------- */
  async inicio() {
    const [cl, ms] = await Promise.all([DB.listClientes(), DB.allMascotas()]);
    const citas = ms.filter(m => m.prox && m.prox.fecha && diff(m.prox.fecha) >= 0).sort((a, b) => (a.prox.fecha + a.prox.hora).localeCompare(b.prox.fecha + b.prox.hora));
    const semana = citas.filter(m => diff(m.prox.fecha) <= 7);
    const vac = ms.flatMap(m => (m.vacunas || []).map(v => ({ ...v, m }))).filter(v => diff(v.prox) <= 30).sort((a, b) => a.prox.localeCompare(b.prox));
    const h = new Date().getHours();
    $("#view").innerHTML = topBar(`${h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"}`, `Resumen de ${esc(A.nombre)} · ${fmtD(todayISO())}`,
      `<button class="btn btn-pri" data-new-client>${ico("plus")} Nuevo cliente</button>`) + `
      <div class="stats">
        <div class="stat"><i>${ico("users")}</i><div><b>${cl.length}</b><span>Clientes</span></div></div>
        <div class="stat"><i>${ico("paw")}</i><div><b>${ms.length}</b><span>Mascotas</span></div></div>
        <div class="stat"><i>${ico("cal")}</i><div><b>${semana.length}</b><span>Citas en 7 días</span></div></div>
        <div class="stat"><i>${ico("alert")}</i><div><b>${vac.filter(v => diff(v.prox) < 0).length}</b><span>Vacunas vencidas</span></div></div>
      </div>
      <div class="two-col">
        <div class="card"><div class="card-h"><h2>${ico("cal")} Próximas citas</h2><button class="btn btn-light btn-sm" data-goto="citas">Ver todas</button></div>${citasTable(citas.slice(0, 8))}</div>
        <div class="card"><div class="card-h"><h2>${ico("shield")} Vacunas por vencer</h2><button class="btn btn-light btn-sm" data-goto="vacunas">Ver todas</button></div>${vacList(vac.slice(0, 6))}</div>
      </div>`;
  },

  /* ---------------- CLIENTES ---------------- */
  async clientes() {
    const cl = (await DB.listClientes()).sort((a, b) => (b.creado || "").localeCompare(a.creado || ""));
    $("#view").innerHTML = topBar("Clientes", `${cl.length} cliente${cl.length === 1 ? "" : "s"} registrados`, `<button class="btn btn-pri" data-new-client>${ico("plus")} Nuevo cliente</button>`) + `
      <div class="card">
        <div class="card-h"><label class="search">${ico("search")}<input id="cSearch" type="search" placeholder="Buscar por código, nombre o celular"></label></div>
        <div class="table-wrap"><table><thead><tr><th>Código</th><th>Dueño(a)</th><th class="hide-m">Celular</th><th>Mascotas</th><th></th></tr></thead><tbody id="cBody"></tbody></table></div>
      </div>`;
    const draw = q => {
      const l = cl.filter(c => (c.codigo + " " + c.dueno + " " + c.celular).toLowerCase().includes(q));
      $("#cBody").innerHTML = l.length ? l.map(c => `<tr class="click" data-client="${esc(c.codigo)}"><td><span class="code">${esc(c.codigo)}</span></td><td><b>${esc(c.dueno)}</b></td><td class="hide-m">${esc(c.celular)}</td><td>${c.nMascotas}</td><td style="text-align:right">${ico("eye")}</td></tr>`).join("")
        : `<tr><td colspan="5" class="empty">${cl.length ? "No hay resultados." : "Aún no hay clientes. Crea el primero con «Nuevo cliente»."}</td></tr>`;
    };
    $("#cSearch").addEventListener("input", e => draw(e.target.value.trim().toLowerCase())); draw("");
  },

  /* ---------------- DETALLE CLIENTE ---------------- */
  async cliente({ code }) {
    const [c, ms] = await Promise.all([DB.getCliente(code), DB.listMascotas(code)]);
    if (!c) { go("clientes"); return toast("Cliente no encontrado", true); }
    $("#view").innerHTML = topBar(esc(c.dueno), "", `<button class="btn btn-light" data-edit-client>${ico("edit")} Editar</button><button class="btn btn-danger" data-del-client>${ico("trash")}<span class="hide-m">Eliminar</span></button>`,
      `<div class="crumb"><button data-goto="clientes">Clientes</button> / ${esc(code)}</div>`) + `
      <div class="card client-head">
        <div>
          <div class="info-row">
            <span>${ico("phone")} ${esc(c.celular)}</span>${c.email ? `<span>${ico("mail")} ${esc(c.email)}</span>` : ""}${c.direccion ? `<span>${ico("pin")} ${esc(c.direccion)}</span>` : ""}
          </div>
          ${c.notas ? `<p style="margin-top:10px;color:var(--muted)"><b>Notas:</b> ${esc(c.notas)}</p>` : ""}
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
            <button class="btn btn-wa btn-sm" data-send-code>${ico("wa")} Enviar código por WhatsApp</button>
            <a class="btn btn-light btn-sm" href="${esc(portalLink(code))}" target="_blank" rel="noopener">${ico("eye")} Ver como cliente</a>
          </div>
        </div>
        <div class="code-big"><small>CÓDIGO DE CLIENTE</small><b>${esc(code)}</b><div class="row"><button class="btn btn-sm" data-copy="${esc(code)}">${ico("copy")} Copiar</button></div></div>
      </div>
      <div class="card"><div class="card-h"><h2>${ico("paw")} Mascotas</h2></div>
        <div class="pets">
          ${ms.map(m => `<button class="pet" data-pet="${esc(m.id)}"><div class="pet-img">${m.foto ? `<img src="${esc(foto(m.foto, 500))}" alt="" onerror="this.remove()">` : ico("paw")}</div>
            <div class="pet-b"><b>${esc(m.nombre)}</b><small>${esc(m.especie)} · ${esc(m.raza || "Sin raza")} · ${edad(m.nac)}</small><br>
            ${m.prox?.fecha && diff(m.prox.fecha) >= 0 ? `<span class="st info">Cita ${fmtD(m.prox.fecha)} · ${esc(m.prox.hora)}</span>` : `<span class="st warn">Sin cita programada</span>`}</div></button>`).join("")}
          <button class="pet add" data-new-pet><div>${ico("plus")}Agregar mascota</div></button>
        </div>
      </div>`;
    CUR.cliente = c; CUR.mascotas = ms;
  },

  /* ---------------- FICHA MASCOTA ---------------- */
  async mascota({ code, id }) {
    const [c, m] = await Promise.all([DB.getCliente(code), DB.getMascota(code, id)]);
    if (!m) { go("cliente", { code }); return; }
    CUR.cliente = c; CUR.m = m;
    const pr = m.prox && m.prox.fecha ? m.prox : null;
    const vac = (m.vacunas || []).slice().sort((a, b) => a.prox.localeCompare(b.prox));
    const his = (m.historial || []).slice().sort((a, b) => b.f.localeCompare(a.f));
    const rec = (m.rec || []).slice().sort((a, b) => a.f.localeCompare(b.f));
    $("#view").innerHTML = topBar(esc(m.nombre), `${esc(m.especie)} · ${esc(m.raza || "")} · Dueño(a): ${esc(c.dueno)}`,
      `<button class="btn btn-light" data-edit-pet>${ico("edit")} Editar ficha</button><button class="btn btn-danger" data-del-pet>${ico("trash")}</button>`,
      `<div class="crumb"><button data-goto="clientes">Clientes</button> / <button data-client="${esc(code)}">${esc(code)}</button> / ${esc(m.nombre)}</div>`) + `
      <div class="ficha">
        <div class="card">
          <div class="ficha-photo">${m.foto ? `<img src="${esc(foto(m.foto, 700))}" alt="Foto de ${esc(m.nombre)}" onerror="this.remove()">` : ico("paw")}</div>
          <div class="facts">
            <div><small>Edad</small><b>${edad(m.nac)}</b></div><div><small>Sexo</small><b>${esc(m.sexo || "—")}</b></div>
            <div><small>Peso</small><b>${esc(m.peso || "—")}</b></div><div><small>Nacimiento</small><b>${fmt(m.nac)}</b></div>
            <div><small>Microchip</small><b>${esc(m.chip || "—")}</b></div><div><small>Alergias</small><b>${esc(m.alergias || "—")}</b></div>
          </div>
          <a class="btn btn-light btn-sm" style="width:100%" href="${esc(portalLink(code))}" target="_blank" rel="noopener">${ico("eye")} Ver como lo ve el cliente</a>
        </div>
        <div>
          <div class="card">
            <div class="card-h"><h2>${ico("cal")} Próxima cita</h2><button class="btn btn-pri btn-sm" data-cita>${pr ? ico("edit") + " Cambiar" : ico("plus") + " Programar cita"}</button></div>
            ${pr ? `<div class="next-box"><small>${enDias(diff(pr.fecha)).toUpperCase()}</small><h3>${esc(pr.servicio)}${pr.detalle ? " · " + esc(pr.detalle) : ""}</h3>
              <p>${fmtD(pr.fecha)} ${toD(pr.fecha).getFullYear()} · <b>${esc(pr.hora)} h</b> · ${esc(pr.vet || "")}<br>${esc(pr.sede || "")}</p>
              <div class="row"><button class="btn btn-sm" data-remind>${ico("wa")} Recordar al cliente</button><button class="btn btn-sm" data-attend>${ico("check")} Marcar como atendida</button><button class="btn btn-sm" data-cancel-cita>Cancelar cita</button></div></div>`
              : `<p class="empty">No tiene cita programada.</p>`}
          </div>
          <div class="card"><div class="card-h"><h2>${ico("shield")} Carnet de vacunas</h2><button class="btn btn-light btn-sm" data-add-vac>${ico("plus")} Vacuna</button></div>
            <div class="list">${vac.length ? vac.map(v => `<div class="li"><div><b>${esc(v.n)}</b><small>Aplicada: ${fmt(v.ult)} · Próxima: ${fmt(v.prox)}</small></div>${vacSt(v)}<button class="icon-btn" data-del-item="vacunas" data-id="${esc(v.id)}" aria-label="Eliminar">${ico("trash")}</button></div>`).join("") : `<p class="empty">Sin vacunas registradas.</p>`}</div></div>
          <div class="card"><div class="card-h"><h2>${ico("history")} Historial clínico</h2><button class="btn btn-light btn-sm" data-add-his>${ico("plus")} Registrar atención</button></div>
            ${his.length ? `<ul class="tl">${his.map(x => `<li><div><span class="d">${fmt(x.f)}${x.peso ? " · " + esc(x.peso) : ""}</span><b>${esc(x.t)}</b>${x.d ? `<p>${esc(x.d)}</p>` : ""}<span class="v">${esc(x.vet || "")}</span></div><button class="icon-btn" data-del-item="historial" data-id="${esc(x.id)}" aria-label="Eliminar">${ico("trash")}</button></li>`).join("")}</ul>` : `<p class="empty">Sin atenciones registradas.</p>`}</div>
          <div class="card"><div class="card-h"><h2>${ico("bell")} Recordatorios para el cliente</h2><button class="btn btn-light btn-sm" data-add-rec>${ico("plus")} Recordatorio</button></div>
            <div class="list">${rec.length ? rec.map(r => `<div class="li"><div><b>${esc(r.t)}</b><small>${fmt(r.f)} · ${enDias(diff(r.f))}</small></div><button class="icon-btn" data-del-item="rec" data-id="${esc(r.id)}" aria-label="Eliminar">${ico("trash")}</button></div>`).join("") : `<p class="empty">Sin recordatorios.</p>`}</div></div>
        </div>
      </div>`;
  },

  /* ---------------- CITAS ---------------- */
  async citas() {
    const ms = await DB.allMascotas();
    const all = ms.filter(m => m.prox && m.prox.fecha).sort((a, b) => (a.prox.fecha + a.prox.hora).localeCompare(b.prox.fecha + b.prox.hora));
    $("#view").innerHTML = topBar("Citas", "Citas programadas de todas las mascotas") + `
      <div class="card"><div class="card-h"><div style="display:flex;gap:8px;flex-wrap:wrap" id="cf">
        <button class="btn btn-pri btn-sm" data-f="hoy">Hoy</button><button class="btn btn-light btn-sm" data-f="7">Próximos 7 días</button><button class="btn btn-light btn-sm" data-f="todas">Todas las próximas</button><button class="btn btn-light btn-sm" data-f="pasadas">Pendientes de cerrar</button></div></div>
        <div id="cList"></div></div>`;
    const draw = f => {
      const l = all.filter(m => { const n = diff(m.prox.fecha); return f === "hoy" ? n === 0 : f === "7" ? n >= 0 && n <= 7 : f === "pasadas" ? n < 0 : n >= 0; });
      $("#cList").innerHTML = f === "pasadas" && !l.length ? `<p class="empty">Todo al día. Las citas pasadas que no marcaste como atendidas aparecerán aquí.</p>` : citasTable(l);
    };
    $("#cf").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (!b) return; $$("#cf button").forEach(x => x.className = "btn btn-light btn-sm"); b.className = "btn btn-pri btn-sm"; draw(b.dataset.f); });
    draw("hoy");
  },

  /* ---------------- VACUNAS ---------------- */
  async vacunas() {
    const ms = await DB.allMascotas();
    const vac = ms.flatMap(m => (m.vacunas || []).map(v => ({ ...v, m }))).filter(v => diff(v.prox) <= 60).sort((a, b) => a.prox.localeCompare(b.prox));
    $("#view").innerHTML = topBar("Vacunas", "Vencidas y por vencer en los próximos 60 días. Envía el recordatorio con un clic.") + `<div class="card">${vacList(vac)}</div>`;
  },
};

/* ---------- Bloques reutilizables ---------- */
function citasTable(l) {
  if (!l.length) return `<p class="empty">No hay citas en este periodo.</p>`;
  return `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Mascota</th><th class="hide-m">Servicio</th><th class="hide-m">Veterinario</th><th></th></tr></thead><tbody>${l.map(m => `
    <tr class="click" data-pet="${esc(m.id)}" data-code="${esc(m.code)}"><td><b>${fmtD(m.prox.fecha)}</b><br><small style="color:var(--muted)">${esc(m.prox.hora)} h · ${enDias(diff(m.prox.fecha))}</small></td>
    <td><div class="who">${avatar(m)}<div><b>${esc(m.nombre)}</b><small>${esc(m.dueno)}</small></div></div></td>
    <td class="hide-m">${esc(m.prox.servicio)}</td><td class="hide-m">${esc(m.prox.vet || "")}</td>
    <td style="text-align:right"><button class="btn btn-wa btn-sm" data-remind-row>${ico("wa")}<span class="hide-m">Recordar</span></button></td></tr>`).join("")}</tbody></table></div>`;
}
function vacList(l) {
  if (!l.length) return `<p class="empty">No hay vacunas por vencer.</p>`;
  return `<div class="list">${l.map(v => `<div class="li" data-pet="${esc(v.m.id)}" data-code="${esc(v.m.code)}" style="cursor:pointer">${avatar(v.m)}<div><b>${esc(v.m.nombre)} · ${esc(v.n)}</b><small>${esc(v.m.dueno)} · ${fmt(v.prox)}</small></div>${vacSt(v)}
    <button class="btn btn-wa btn-sm" data-vac-remind="${esc(v.id)}" aria-label="Recordar por WhatsApp">${ico("wa")}</button></div>`).join("")}</div>`;
}

/* =========================================================
   FORMULARIOS
   ========================================================= */
function clientForm(c = {}, isNew) {
  modal(isNew ? "Nuevo cliente" : "Editar cliente", `
    ${isNew ? `<p style="color:var(--muted);margin-bottom:16px;font-size:.9rem">Al guardar se generará un <b>código único</b> para que el cliente vea el historial de sus mascotas.</p>` : ""}
    <div class="grid2">
      ${fld("dueno", "Nombre del dueño(a)", c.dueno, { req: true, full: true, ph: "Ej. María López" })}
      ${fld("celular", "Celular (WhatsApp)", c.celular, { req: true, type: "tel", ph: "987654321" })}
      ${fld("email", "Correo", c.email, { type: "email", ph: "opcional" })}
      ${fld("direccion", "Dirección", c.direccion, { full: true, ph: "opcional" })}
      ${fld("notas", "Notas internas", c.notas, { type: "textarea", full: true, ph: "Solo las ve el personal (no aparece en la web)" })}
    </div>`, async d => {
      if (d.celular.replace(/\D/g, "").length < 9) { toast("El celular debe tener al menos 9 dígitos", true); return false; }
      if (isNew) {
        const code = await DB.nuevoCodigo(); await DB.saveCliente(code, d);
        toast("Cliente creado · Código " + code); go("cliente", { code });
      } else { await DB.saveCliente(CUR.code, d); toast("Cliente actualizado"); refresh(); }
    }, isNew ? "Crear y generar código" : "Guardar");
}
function petForm(m = {}) {
  const isNew = !m.id;
  modal(isNew ? "Agregar mascota" : "Editar ficha", `
    <div class="photo-up"><span class="prev" id="pPrev">${m.foto ? `<img src="${esc(foto(m.foto, 200))}" alt="">` : ico("camera")}</span>
      <div><label class="btn btn-light btn-sm" for="pFile">${ico("camera")} ${m.foto ? "Cambiar foto" : "Subir foto"}</label><input type="file" id="pFile" accept="image/*"><small>Se reduce automáticamente para que cargue rápido.</small></div>
      <input type="hidden" name="foto" value="${esc(m.foto || "")}"></div>
    <div class="grid2">
      ${fld("nombre", "Nombre", m.nombre, { req: true, ph: "Ej. Rocky" })}
      ${fld("especie", "Especie", m.especie || "Perro", { opts: ["Perro", "Gato", "Conejo", "Ave", "Hámster / cuy", "Otro"] })}
      ${fld("raza", "Raza", m.raza, { ph: "Ej. Labrador" })}
      ${fld("sexo", "Sexo", m.sexo || "Macho", { opts: ["Macho", "Hembra", "Macho (castrado)", "Hembra (esterilizada)"] })}
      ${fld("nac", "Fecha de nacimiento (aprox.)", m.nac, { type: "date" })}
      ${fld("peso", "Peso", m.peso, { ph: "Ej. 12.5 kg" })}
      ${fld("chip", "Microchip", m.chip, { ph: "opcional" })}
      ${fld("alergias", "Alergias / condiciones", m.alergias, { ph: "Ej. Ninguna" })}
    </div>`, async d => {
      const code = CUR.code;
      const base = isNew ? { vacunas: [], historial: [], rec: [], prox: null } : {};
      const id = await DB.saveMascota(code, m.id || null, { ...base, ...d });
      toast(isNew ? "Mascota agregada" : "Ficha actualizada"); go("mascota", { code, id });
    }, isNew ? "Agregar mascota" : "Guardar");
  $("#pFile").addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return;
    const data = await resizeImage(f); $("[name=foto]").value = data; $("#pPrev").innerHTML = `<img src="${data}" alt="">`;
  });
}
const petUpdate = async (patch, msg) => { await DB.saveMascota(CUR.code, CUR.id, patch); toast(msg); refresh(); };
function citaForm(p = {}) {
  modal(p.fecha ? "Cambiar cita" : "Programar cita", `<div class="grid2">
    ${fld("servicio", "Servicio", p.servicio, { req: true, opts: A.servicios, blank: true })}
    ${fld("detalle", "Detalle (lo verá el cliente)", p.detalle, { ph: "Ej. Antirrábica anual" })}
    ${fld("fecha", "Fecha", p.fecha, { req: true, type: "date", extra: `min="${todayISO()}"` })}
    ${fld("hora", "Hora", p.hora, { req: true, type: "time", extra: 'step="900"' })}
    ${fld("vet", "Veterinario", p.vet, { opts: A.veterinarios })}
    ${fld("sede", "Sede / consultorio", p.sede, { opts: A.sedes })}
  </div>`, d => petUpdate({ prox: d }, "Cita guardada"));
}
function vacForm() {
  modal("Registrar vacuna", `${datalist("vacL", A.vacunas)}<div class="grid2">
    ${fld("n", "Vacuna", "", { req: true, full: true, list: "vacL", ph: "Escribe o elige" })}
    ${fld("ult", "Fecha de aplicación", todayISO(), { req: true, type: "date" })}
    ${fld("prox", "Próxima dosis", addDays(todayISO(), 365), { req: true, type: "date" })}
  </div><p style="color:var(--muted);font-size:.84rem">La próxima dosis se calcula a 1 año; cámbiala si es otra.</p>`,
    d => petUpdate({ vacunas: [...(CUR.m.vacunas || []), { id: uid(), ...d }] }, "Vacuna registrada"));
  $("[name=ult]").addEventListener("change", e => { if (e.target.value) $("[name=prox]").value = addDays(e.target.value, 365); });
}
function hisForm(pre = {}, fromCita) {
  modal(fromCita ? "Cerrar cita y registrar atención" : "Registrar atención", `${datalist("svcL", A.servicios)}<div class="grid2">
    ${fld("f", "Fecha", pre.f || todayISO(), { req: true, type: "date" })}
    ${fld("vet", "Atendido por", pre.vet, { opts: A.veterinarios })}
    ${fld("t", "Atención / procedimiento", pre.t, { req: true, full: true, list: "svcL", ph: "Ej. Consulta general" })}
    ${fld("d", "Diagnóstico, tratamiento e indicaciones (lo verá el cliente)", "", { type: "textarea", full: true })}
    ${fld("peso", "Peso del día", "", { ph: "Ej. 12.4 kg" })}
  </div>`, async d => {
    const patch = { historial: [...(CUR.m.historial || []), { id: uid(), ...d }] };
    if (d.peso) patch.peso = d.peso;
    if (fromCita) patch.prox = null;
    await petUpdate(patch, fromCita ? "Cita cerrada y registrada en el historial" : "Atención registrada");
  }, fromCita ? "Guardar y cerrar cita" : "Guardar");
}
function recForm() {
  modal("Nuevo recordatorio", `<div class="grid2">
    ${fld("t", "Recordatorio", "", { req: true, full: true, ph: "Ej. Desparasitación, Próximo baño" })}
    ${fld("f", "Fecha", addDays(todayISO(), 30), { req: true, type: "date" })}
    ${fld("i", "Tipo", "pill", { opts: Object.entries(REC_ICONS) })}
  </div>`, d => petUpdate({ rec: [...(CUR.m.rec || []), { id: uid(), ...d }] }, "Recordatorio agregado"));
}
function confirmDel(text, fn) { modal("¿Eliminar?", `<p>${text}</p><p style="color:var(--muted);margin-top:8px;font-size:.9rem">Esta acción no se puede deshacer.</p>`, fn, "Eliminar"); }

/* ---------- Mensajes de WhatsApp ---------- */
function msgCita(c, m) {
  const p = m.prox; return `Hola ${c.dueno.split(" ")[0]}, te saluda ${A.nombre}. Te recordamos la cita de *${m.nombre}*:\n\n• ${p.servicio}${p.detalle ? " (" + p.detalle + ")" : ""}\n• ${fmtD(p.fecha)} a las ${p.hora} h\n• ${p.vet || ""}\n• ${p.sede || ""}\n\nPuedes ver los detalles con tu código *${c.codigo}* aquí: ${portalLink(c.codigo)}`;
}

/* =========================================================
   CLICS
   ========================================================= */
document.addEventListener("click", async e => {
  const t = e.target.closest("button, a, tr, .li"); if (!t || !$("#view").contains(t) && !t.closest(".top")) return;
  if (t.matches("[data-goto]")) return go(t.dataset.goto);
  if (t.matches("[data-new-client]")) return clientForm({}, true);
  if (t.matches("[data-copy]")) { try { await navigator.clipboard.writeText(t.dataset.copy); toast("Código copiado"); } catch (er) { toast("Código: " + t.dataset.copy); } return; }
  if (t.matches("[data-remind-row], [data-vac-remind]")) {
    e.stopPropagation();
    const row = t.closest("[data-pet]"); const code = row.dataset.code, id = row.dataset.pet;
    const [c, m] = await Promise.all([DB.getCliente(code), DB.getMascota(code, id)]);
    if (t.matches("[data-remind-row]")) return openWA(c.celular, msgCita(c, m));
    const v = m.vacunas.find(x => x.id === t.dataset.vacRemind); const n = diff(v.prox);
    return openWA(c.celular, `Hola ${c.dueno.split(" ")[0]}, te saluda ${A.nombre}. La vacuna *${v.n}* de *${m.nombre}* ${n < 0 ? "venció el " + fmt(v.prox) : "vence el " + fmt(v.prox)}. ¿Te reservamos una cita para su refuerzo?\n\nCarnet de vacunas: ${portalLink(c.codigo)}`);
  }
  if (t.matches("[data-client]")) return go("cliente", { code: t.dataset.client });
  if (t.matches("[data-pet]")) return go("mascota", { code: t.dataset.code || CUR.code, id: t.dataset.pet });
  if (t.matches("[data-new-pet]")) return petForm();
  if (t.matches("[data-edit-client]")) return clientForm(CUR.cliente);
  if (t.matches("[data-del-client]")) return confirmDel(`Se eliminará a <b>${esc(CUR.cliente.dueno)}</b> (${esc(CUR.code)}) y todas sus mascotas e historiales.`, async () => { await DB.deleteCliente(CUR.code); toast("Cliente eliminado"); go("clientes"); });
  if (t.matches("[data-send-code]")) {
    const c = CUR.cliente, names = CUR.mascotas.map(m => m.nombre).join(", ") || "tu mascota";
    return openWA(c.celular, `Hola ${c.dueno.split(" ")[0]}, bienvenido(a) a ${A.nombre}.\n\nTu código de cliente es: *${c.codigo}*\n\nCon él puedes ver la próxima cita, el carnet de vacunas y el historial de ${names} aquí:\n${portalLink(c.codigo)}\n\nGuárdalo, lo necesitarás para cada consulta.`);
  }
  if (t.matches("[data-edit-pet]")) return petForm(CUR.m);
  if (t.matches("[data-del-pet]")) return confirmDel(`Se eliminará la ficha de <b>${esc(CUR.m.nombre)}</b> con todo su historial.`, async () => { await DB.deleteMascota(CUR.code, CUR.id); toast("Mascota eliminada"); go("cliente", { code: CUR.code }); });
  if (t.matches("[data-cita]")) return citaForm(CUR.m.prox || {});
  if (t.matches("[data-remind]")) return openWA(CUR.cliente.celular, msgCita(CUR.cliente, CUR.m));
  if (t.matches("[data-attend]")) { const p = CUR.m.prox; return hisForm({ f: p.fecha <= todayISO() ? p.fecha : todayISO(), t: p.detalle ? `${p.servicio} · ${p.detalle}` : p.servicio, vet: p.vet }, true); }
  if (t.matches("[data-cancel-cita]")) return confirmDel(`Se cancelará la cita de <b>${esc(CUR.m.nombre)}</b> del ${fmt(CUR.m.prox.fecha)}.`, () => petUpdate({ prox: null }, "Cita cancelada"));
  if (t.matches("[data-add-vac]")) return vacForm();
  if (t.matches("[data-add-his]")) return hisForm();
  if (t.matches("[data-add-rec]")) return recForm();
  if (t.matches("[data-del-item]")) {
    const k = t.dataset.delItem, id = t.dataset.id, names = { vacunas: "esta vacuna", historial: "esta atención del historial", rec: "este recordatorio" };
    return confirmDel(`Se eliminará ${names[k]}.`, () => petUpdate({ [k]: (CUR.m[k] || []).filter(x => x.id !== id) }, "Eliminado"));
  }
});
