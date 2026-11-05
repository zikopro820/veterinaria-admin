/* =========================================================
   MÓDULOS 2: Categorías · Páginas y menú · Producto completo
   ========================================================= */
let CATP = [], CATSV = [];
const catId = (l, v) => (l.find(c => c.id === v || String(c.n).toLowerCase() === String(v || "").toLowerCase()) || {}).id || v;
const catName = (l, v) => (l.find(c => c.id === v || String(c.n).toLowerCase() === String(v || "").toLowerCase()) || {}).n || v || "—";
const slug = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
async function cargarCats() {
  const c = await DB.getConf("categorias"), D = window.DATOS.categorias;
  CATP = ordenar((c && c.productos) || D.productos); CATSV = ordenar((c && c.servicios) || D.servicios);
  return { productos: CATP, servicios: CATSV };
}
const guardarCats = () => DB.saveConf("categorias", { productos: CATP.map((c, i) => ({ ...c, orden: i + 1 })), servicios: CATSV.map((c, i) => ({ ...c, orden: i + 1 })) });
async function cargarPaginas() {
  const g = await DB.getConf("paginas"), D = JSON.parse(JSON.stringify(window.DATOS.paginas));
  if (!g) return D;
  const pg = { ...D, ...g };
  // si se agregan secciones nuevas en la plantilla, aparecen aunque ya haya datos guardados
  pg.inicio = [...(g.inicio || []), ...D.inicio.filter(x => !(g.inicio || []).some(y => y.id === x.id))];
  pg.menu = [...(g.menu || []), ...D.menu.filter(x => !(g.menu || []).some(y => y.id === x.id))];
  pg.encabezados = { ...D.encabezados, ...(g.encabezados || {}) };
  return pg;
}
const ICON_PICK = (name, val) => `<div class="field full"><label>Ícono</label><div class="icon-pick">${Object.keys(ICONOS).map(k => `<label><input type="radio" name="${name}" value="${k}" ${k === val ? "checked" : ""}><span>${icoW(k)}</span></label>`).join("")}</div></div>`;

// Servicios cargados antes de existir las categorías: se les asigna la categoría y "a domicilio" de la plantilla
async function migrarServicios() {
  const ss = await DB.listCol("servicios"), D = window.DATOS.servicios; let n = 0;
  for (const x of ss) {
    const base = D.find(y => y.id === x.id), patch = {};
    if (!x.cat) patch.cat = base ? base.cat : (CATSV[0] || {}).id;
    if (x.domicilio === undefined) patch.domicilio = base ? !!base.domicilio : false;
    if (Object.keys(patch).length) { await DB.saveDocCol("servicios", x.id, patch); n++; }
  }
  return n;
}

Object.assign(VIEWS, {
  /* ---------------- CATEGORÍAS ---------------- */
  async categorias() {
    await cargarCats(); await migrarServicios();
    const [ps, ss] = await Promise.all([DB.listCol("productos"), DB.listCol("servicios")]);
    const prods = ps.length ? ps : window.DATOS.productos, servs = ss.length ? ss : window.DATOS.servicios;
    const cuenta = (tipo, id) => (tipo === "productos" ? prods : servs).filter(x => catId(tipo === "productos" ? CATP : CATSV, x.cat) === id).length;
    const lista = (tipo, l) => l.map((c, i) => `<div class="li cat-row ${c.visible === false ? "dim" : ""}" data-cat-row="${tipo}" data-i="${i}">
      <span class="svc-ic">${icoW(c.icon)}</span><div><b>${esc(c.n)}</b><small>${cuenta(tipo, c.id)} ${tipo === "productos" ? "producto(s)" : "servicio(s)"}${c.visible === false ? " · Oculta en la web" : ""}</small></div>
      <div class="acts"><button class="icon-btn mv" data-cmv="-1" title="Subir">▲</button><button class="icon-btn mv" data-cmv="1" title="Bajar">▼</button>
        <button class="btn btn-light btn-sm" data-cvis>${c.visible === false ? "Mostrar" : "Ocultar"}</button>
        <button class="icon-btn edit" data-cedit title="Editar">${ico("edit")}</button><button class="icon-btn" data-cdel title="Eliminar">${ico("trash")}</button></div></div>`).join("") || `<p class="empty">Sin categorías.</p>`;
    $("#view").innerHTML = topBar("Categorías", "Agrupan los productos del Pet Shop y los servicios. Se usan como filtros en la web.") + `
      <div class="two-col even">
        <div class="card"><div class="card-h"><h2>${icoW("bag")} Pet Shop</h2><button class="btn btn-pri btn-sm" data-cnew="productos">${ico("plus")} Nueva</button></div><div class="list">${lista("productos", CATP)}</div></div>
        <div class="card"><div class="card-h"><h2>${icoW("steth")} Servicios</h2><button class="btn btn-pri btn-sm" data-cnew="servicios">${ico("plus")} Nueva</button></div><div class="list">${lista("servicios", CATSV)}</div></div>
      </div>`;
    CUR.prods = prods; CUR.servs = servs;
  },

  /* ---------------- PÁGINAS Y MENÚ ---------------- */
  async paginas() {
    const pg = await cargarPaginas(); CUR.pg = pg;
    const NOMBRES = { servicios: "Servicios", tienda: "Pet Shop", citas: "Reservar cita", nosotros: "Nosotros", contacto: "Contacto" };
    const encs = Object.keys(NOMBRES).map(k => { const e = pg.encabezados[k] || {}; return `<details class="acc"><summary><b>${NOMBRES[k]}</b><small>${esc([e.titulo, e.tituloColor].join(" "))}</small></summary>
      <div class="grid2">${fld(`enc_${k}_pill`, "Etiqueta", e.pill)}${fld(`enc_${k}_titulo`, "Título", e.titulo)}${fld(`enc_${k}_tituloColor`, "Continuación (en color)", e.tituloColor)}${fld(`enc_${k}_texto`, "Texto", e.texto, { type: "textarea", full: true })}</div></details>`; }).join("");
    const secs = pg.inicio.map((x, i) => `<div class="sec-row ${x.visible === false ? "dim" : ""}" data-si="${i}">
      <div class="sr-h"><label class="sw"><input type="checkbox" data-svis ${x.visible !== false ? "checked" : ""}><span></span></label><b>${esc(x.n)}</b>
        <div class="acts"><button type="button" class="icon-btn mv" data-smv="-1">▲</button><button type="button" class="icon-btn mv" data-smv="1">▼</button></div></div>
      ${x.id === "accesos" ? "" : `<div class="grid2">${"pill" in x ? fld(`sec_${i}_pill`, "Etiqueta", x.pill) : ""}${fld(`sec_${i}_titulo`, "Título", x.titulo)}${"tituloColor" in x ? fld(`sec_${i}_tituloColor`, "Continuación (en color)", x.tituloColor) : ""}${fld(`sec_${i}_texto`, "Texto", x.texto, { type: "textarea", full: true })}</div>`}
    </div>`).join("");
    const menu = pg.menu.map((m, i) => `<div class="li menu-row ${m.visible === false ? "dim" : ""}" data-mi="${i}"><label class="sw"><input type="checkbox" data-mvis ${m.visible !== false ? "checked" : ""} ${m.id === "inicio" ? "disabled" : ""}><span></span></label>
      <div class="field" style="margin:0;flex:1"><input data-mname value="${esc(m.n)}" aria-label="Nombre en el menú"></div><small class="sub hide-m">/${m.id === "inicio" ? "" : esc(m.id)}</small>
      <div class="acts"><button type="button" class="icon-btn mv" data-mmv="-1">▲</button><button type="button" class="icon-btn mv" data-mmv="1">▼</button></div></div>`).join("");
    const extras = (pg.extras || []).map((x, i) => `<div class="li"><span class="svc-ic">${icoW("sparkle")}</span><div><b>${esc(x.n)}</b><small>/pagina?p=${esc(x.slug)} · ${(x.bloques || []).length} bloque(s) · ${x.enMenu ? "En el menú" : "No está en el menú"}</small></div>
      <div class="acts"><a class="btn btn-light btn-sm" href="${esc(webBase())}pagina?p=${encodeURIComponent(x.slug)}" target="_blank" rel="noopener">${ico("eye")}</a><button type="button" class="icon-btn edit" data-xedit="${i}">${ico("edit")}</button><button type="button" class="icon-btn" data-xdel="${i}">${ico("trash")}</button></div></div>`).join("") || `<p class="empty">Aún no creaste páginas.</p>`;
    $("#view").innerHTML = topBar("Páginas y menú", "Edita el menú, los textos de cada página, el orden de las secciones del inicio y crea páginas nuevas.",
      `<a class="btn btn-light" href="${esc(webBase())}" target="_blank" rel="noopener">${ico("eye")}<span class="hide-m">Ver web</span></a>`) + `
      <form id="pgForm" novalidate>
        <div class="card"><div class="card-h"><h2>${ico("menu")} Menú de la web</h2><small class="sub">Cambia nombres, orden y oculta páginas</small></div><div class="list" id="menuList">${menu}</div></div>
        <div class="card"><div class="card-h"><h2>${ico("home")} Secciones del inicio</h2><small class="sub">Muestra, oculta, reordena y edita sus textos</small></div><div id="secList">${secs}</div></div>
        <div class="card"><div class="card-h"><h2>${ic2("file")} Encabezado de cada página</h2></div>${encs}</div>
        <div class="card"><div class="card-h"><h2>${ico("phone")} Pie de página</h2></div>${fld("pie", "Texto del pie de página", (pg.pie || {}).texto, { type: "textarea" })}</div>
        <div class="card"><div class="card-h"><h2>${icoW("sparkle")} Páginas nuevas</h2><button type="button" class="btn btn-pri btn-sm" data-xnew>${ico("plus")} Crear página</button></div><div class="list">${extras}</div></div>
        <div class="save-bar"><span class="sub" id="pgMsg">Los cambios se publican al guardar.</span><button class="btn btn-pri" type="submit">${ico("check")} Guardar y publicar</button></div>
      </form>`;
    const F = $("#pgForm");
    const leer = () => {   // pasa lo escrito en el formulario al objeto
      $$("[data-mi]", F).forEach(r => { const m = pg.menu[+r.dataset.mi]; m.n = $("[data-mname]", r).value.trim() || m.n; m.visible = m.id === "inicio" || $("[data-mvis]", r).checked; });
      pg.inicio.forEach((x, i) => { ["pill", "titulo", "tituloColor", "texto"].forEach(k => { const el = $(`[name=sec_${i}_${k}]`, F); if (el) x[k] = el.value.trim(); }); const r = $(`[data-si="${i}"]`, F); if (r) x.visible = $("[data-svis]", r).checked; });
      Object.keys(NOMBRES).forEach(k => { pg.encabezados[k] = pg.encabezados[k] || {}; ["pill", "titulo", "tituloColor", "texto"].forEach(f => { const el = $(`[name=enc_${k}_${f}]`, F); if (el) pg.encabezados[k][f] = el.value.trim(); }); });
      pg.pie = { texto: $("[name=pie]", F).value.trim() };
    };
    const mover = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return false; [arr[i], arr[j]] = [arr[j], arr[i]]; return true; };
    F.addEventListener("click", e => {
      const t = e.target.closest("button"); if (!t) return;
      if (t.dataset.mmv) { leer(); if (mover(pg.menu, +t.closest("[data-mi]").dataset.mi, +t.dataset.mmv)) { CUR.pgTmp = pg; VIEWS.paginasRender(pg); } }
      if (t.dataset.smv) { leer(); if (mover(pg.inicio, +t.closest("[data-si]").dataset.si, +t.dataset.smv)) VIEWS.paginasRender(pg); }
      if (t.matches("[data-xnew]")) { leer(); extraForm(pg, null); }
      if (t.dataset.xedit) { leer(); extraForm(pg, +t.dataset.xedit); }
      if (t.dataset.xdel) { leer(); const x = pg.extras[+t.dataset.xdel]; confirmDel(`Se eliminará la página <b>${esc(x.n)}</b>.`, async () => { pg.extras.splice(+t.dataset.xdel, 1); await DB.saveConf("paginas", pg); toast("Página eliminada"); await VIEWS.paginasRender(pg, "Guardado · " + nowHM() + " h"); }); }
    });
    F.addEventListener("change", e => { if (e.target.matches("[data-svis], [data-mvis]")) e.target.closest(".sec-row, .menu-row").classList.toggle("dim", !e.target.checked); });
    F.addEventListener("submit", async e => { e.preventDefault(); leer(); await safe(async () => { await DB.saveConf("paginas", pg); toast("Páginas publicadas"); $("#pgMsg").textContent = "Guardado · " + nowHM() + " h"; }); });
  },
});
// re-dibuja la vista de páginas con cambios aún no guardados (al reordenar)
VIEWS.paginasRender = async (pg, msg = "Tienes cambios sin guardar.") => { const orig = DB.getConf; DB.getConf = async n => n === "paginas" ? JSON.parse(JSON.stringify(pg)) : orig.call(DB, n); try { await VIEWS.paginas(); } finally { DB.getConf = orig; } $("#pgMsg").textContent = msg; };

/* ---------- Formulario de página nueva ---------- */
function extraForm(pg, idx) {
  const x = idx == null ? { n: "", slug: "", enMenu: true, pill: "", titulo: "", tituloColor: "", texto: "", bloques: [{ titulo: "", texto: "", img: "", boton: "", enlace: "" }] } : JSON.parse(JSON.stringify(pg.extras[idx]));
  const bl = (b, i) => `<div class="rep" data-bl><div class="img-up"><span class="prev">${b.img ? `<img src="${esc(foto(b.img, 200))}" alt="">` : ico("camera")}</span><div><b>Imagen (opcional)</b><label class="btn btn-light btn-sm">${ico("camera")} Subir<input type="file" accept="image/*" hidden data-blup></label>${b.img ? `<button type="button" class="btn btn-sm ghost" data-blclear>Quitar</button>` : ""}</div><input type="hidden" data-k="img" value="${esc(b.img || "")}"></div>
    <div class="grid2"><div class="field full"><label>Título del bloque</label><input data-k="titulo" value="${esc(b.titulo)}"></div><div class="field full"><label>Texto</label><textarea data-k="texto">${esc(b.texto)}</textarea></div>
      <div class="field"><label>Texto del botón</label><input data-k="boton" value="${esc(b.boton)}" placeholder="Opcional"></div><div class="field"><label>Enlace del botón</label><input data-k="enlace" value="${esc(b.enlace)}" placeholder="citas, tienda, https://..."></div></div>
    <button type="button" class="icon-btn" data-bldel>${ico("trash")}</button></div>`;
  modal(idx == null ? "Crear página" : "Editar página", `<div class="grid2">
    ${fld("n", "Nombre en el menú", x.n, { req: true, ph: "Ej. Promociones" })}
    ${fld("enMenu", "Mostrar en el menú", x.enMenu !== false, { type: "checkbox" })}
    ${fld("pill", "Etiqueta", x.pill)}${fld("titulo", "Título", x.titulo)}${fld("tituloColor", "Continuación (en color)", x.tituloColor)}
    ${fld("texto", "Texto de introducción", x.texto, { type: "textarea", full: true })}</div>
    <div class="card-h" style="margin:8px 0 10px"><b>Bloques de contenido</b><button type="button" class="btn btn-light btn-sm" data-bladd>${ico("plus")} Agregar bloque</button></div>
    <div id="blList">${(x.bloques || []).map(bl).join("")}</div>`, async d => {
    const bloques = $$("#blList [data-bl]").map(r => { const o = {}; $$("[data-k]", r).forEach(el => o[el.dataset.k] = el.value.trim()); return o; }).filter(b => b.titulo || b.texto || b.img);
    const nuevo = { ...x, n: d.n, enMenu: !!d.enMenu, pill: d.pill, titulo: d.titulo || d.n, tituloColor: d.tituloColor, texto: d.texto, bloques };
    if (!nuevo.slug) { let s = slug(d.n) || "pagina", k = 2; while ((pg.extras || []).some(e => e.slug === s)) s = slug(d.n) + "-" + k++; nuevo.slug = s; }
    pg.extras = pg.extras || [];
    if (idx == null) pg.extras.push(nuevo); else pg.extras[idx] = nuevo;
    if (JSON.stringify(pg).length > 900000) { toast("Las imágenes son muy pesadas. Usa menos o más pequeñas.", true); return false; }
    await DB.saveConf("paginas", pg); toast(idx == null ? "Página creada" : "Página actualizada"); await VIEWS.paginasRender(pg, "Guardado · " + nowHM() + " h");
  }, idx == null ? "Crear página" : "Guardar");
  const M = $("#modalForm");
  M.addEventListener("click", function h(e) {
    if (!$("#blList")) return M.removeEventListener("click", h);
    const t = e.target.closest("button"); if (!t) return;
    if (t.matches("[data-bladd]")) $("#blList").insertAdjacentHTML("beforeend", bl({ titulo: "", texto: "", img: "", boton: "", enlace: "" }));
    if (t.matches("[data-bldel]")) t.closest("[data-bl]").remove();
    if (t.matches("[data-blclear]")) { const r = t.closest("[data-bl]"); $("[data-k=img]", r).value = ""; $(".prev", r).innerHTML = ico("camera"); }
  });
  M.addEventListener("change", async function h(e) {
    if (!$("#blList")) return M.removeEventListener("change", h);
    if (!e.target.matches("[data-blup]") || !e.target.files[0]) return;
    const r = e.target.closest("[data-bl]"), data = await resizeImage(e.target.files[0], 900, .74);
    $("[data-k=img]", r).value = data; $(".prev", r).innerHTML = `<img src="${data}" alt="">`;
  });
}

/* ---------- Categorías: crear, editar, ocultar, ordenar, eliminar ---------- */
function catForm(tipo, idx) {
  const l = tipo === "productos" ? CATP : CATSV, c = idx == null ? { n: "", icon: tipo === "productos" ? "bag" : "steth", visible: true } : l[idx];
  modal(idx == null ? "Nueva categoría" : "Editar categoría", `<div class="grid2">${fld("n", "Nombre", c.n, { req: true, full: true, ph: tipo === "productos" ? "Ej. Snacks" : "Ej. Rehabilitación" })}${ICON_PICK("icon", c.icon)}</div>`, async d => {
    if (l.some((x, i) => i !== idx && x.n.toLowerCase() === d.n.toLowerCase())) { toast("Ya existe una categoría con ese nombre", true); return false; }
    if (idx == null) { let id = slug(d.n) || "cat", k = 2; while (l.some(x => x.id === id)) id = slug(d.n) + "-" + k++; l.push({ id, n: d.n, icon: d.icon, visible: true }); }
    else { const viejo = c.n; c.n = d.n; c.icon = d.icon;
      // productos/servicios que guardaban el nombre antiguo pasan a usar el id
      for (const x of (tipo === "productos" ? CUR.prods : CUR.servs)) if (x.cat === viejo && x.id) await DB.saveDocCol(tipo, x.id, { cat: c.id }); }
    await guardarCats(); toast("Categoría guardada"); refresh();
  }, "Guardar");
}
async function catBorrar(tipo, idx) {
  const l = tipo === "productos" ? CATP : CATSV, c = l[idx], items = (tipo === "productos" ? CUR.prods : CUR.servs).filter(x => catId(l, x.cat) === c.id), otras = l.filter((_, i) => i !== idx);
  if (!otras.length) return toast("Debe quedar al menos una categoría", true);
  modal("Eliminar categoría", `<p>Se eliminará <b>${esc(c.n)}</b>.</p>${items.length ? `<p style="margin:10px 0">Tiene <b>${items.length}</b> ${tipo === "productos" ? "producto(s)" : "servicio(s)"}. ¿A qué categoría los pasamos?</p>${fld("destino", "Mover a", otras[0].id, { opts: otras.map(o => [o.id, o.n]) })}` : ""}`, async d => {
    for (const x of items) if (x.id) await DB.saveDocCol(tipo, x.id, { cat: d.destino });
    l.splice(idx, 1); await guardarCats(); toast("Categoría eliminada"); refresh();
  }, "Eliminar");
}

/* ---------- Producto: categorías dinámicas, galería, descripción y detalles ---------- */
const _prodFormBase = prodForm;
prodForm = async function (p = {}) {   // eslint-disable-line no-global-assign
  await cargarCats();
  const info = p.id ? (await DB.getProdInfo(p.id)) || {} : {};
  _prodFormBase(p);
  // categoría desde la lista editable
  const sel = $("#modalForm [name=cat]"); if (sel) { const cur = catId(CATP, p.cat) || CATP[0]?.id; sel.innerHTML = CATP.map(c => `<option value="${esc(c.id)}" ${c.id === cur ? "selected" : ""}>${esc(c.n)}</option>`).join(""); }
  const grid = $("#modalForm .grid2");
  grid.insertAdjacentHTML("beforeend", `
    <div class="field full"><label>Más fotos (galería, máximo 5)</label><div class="gal-up" id="galUp">${(info.imgs || []).map(im => `<span class="g"><img src="${esc(foto(im, 200))}" alt=""><button type="button" data-gdel aria-label="Quitar">×</button><input type="hidden" data-gimg value="${esc(im)}"></span>`).join("")}
      <label class="g add">${ico("plus")}<input type="file" accept="image/*" multiple hidden id="galFile"></label></div></div>
    <div class="field full"><label>Descripción completa (página del producto)</label><textarea data-info="larga" rows="5" placeholder="Beneficios, ingredientes, modo de uso...">${esc(info.larga || "")}</textarea></div>
    <div class="field full"><label>Detalles · uno por línea con el formato «Dato: valor»</label><textarea data-info="detalles" rows="4" placeholder="Marca: Pro Plan&#10;Peso: 15 kg&#10;Edad: Adulto">${esc(info.detalles || "")}</textarea></div>`);
  const gal = $("#galUp");
  const cuantas = () => $$("[data-gimg]", gal).length;
  $("#galFile").addEventListener("change", async e => {
    for (const f of [...e.target.files]) { if (cuantas() >= 5) { toast("Máximo 5 fotos extra", true); break; }
      const data = await resizeImage(f, 900, .74);
      gal.querySelector(".add").insertAdjacentHTML("beforebegin", `<span class="g"><img src="${data}" alt=""><button type="button" data-gdel aria-label="Quitar">×</button><input type="hidden" data-gimg value="${data}"></span>`); }
    e.target.value = "";
  });
  gal.addEventListener("click", e => { const b = e.target.closest("[data-gdel]"); if (b) b.closest(".g").remove(); });
  // guardar también la info extra (después del guardado normal)
  const submitBase = mSubmit;
  mSubmit = async d => {
    const extra = { imgs: $$("[data-gimg]", gal).map(x => x.value), larga: $("[data-info=larga]").value.trim(), detalles: $("[data-info=detalles]").value.trim() };
    const before = (await DB.listCol("productos")).map(x => x.id);
    const r = await submitBase(d); if (r === false) return false;
    let id = p.id; if (!id) { const after = await DB.listCol("productos"); id = (after.find(x => !before.includes(x.id)) || {}).id; }
    if (id) await DB.saveProdInfo(id, extra);
  };
};

/* ---------- Servicio: categoría y "a domicilio" ---------- */
const _servFormBase = servForm;
servForm = async function (x = {}) {   // eslint-disable-line no-global-assign
  await cargarCats();
  _servFormBase(x);
  const grid = $("#modalForm .grid2");
  grid.insertAdjacentHTML("afterbegin", fld("cat", "Categoría", catId(CATSV, x.cat) || CATSV[0]?.id, { full: true, opts: CATSV.map(c => [c.id, c.n]) }));
  grid.insertAdjacentHTML("beforeend", fld("domicilio", "Es a domicilio (pide la dirección del cliente al reservar)", !!x.domicilio, { type: "checkbox", full: true }));
};
// la lista de servicios muestra su categoría y si es a domicilio
const _serviciosVista = VIEWS.servicios;
VIEWS.servicios = async () => {
  await cargarCats(); await migrarServicios(); await _serviciosVista();
  for (const r of $$("[data-serv]")) { const s = CUR.list.find(x => x.id === r.dataset.serv); if (!s) continue;
    const b = $(".badges", r); if (b) b.insertAdjacentHTML("afterbegin", `<span class="st">${esc(catName(CATSV, s.cat))}</span>${s.domicilio ? `<span class="st warn">A domicilio</span>` : ""}`); }
};

/* ---------- Clics ---------- */
document.addEventListener("click", async e => {
  const t = e.target.closest("button"); if (!t || !$("#view").contains(t) || CUR.v !== "categorias") return;
  if (t.dataset.cnew) return catForm(t.dataset.cnew, null);
  const row = t.closest("[data-cat-row]"); if (!row) return;
  const tipo = row.dataset.catRow, i = +row.dataset.i, l = tipo === "productos" ? CATP : CATSV;
  if (t.dataset.cmv) { const j = i + +t.dataset.cmv; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; await guardarCats(); return refresh(); }
  if (t.matches("[data-cvis]")) { l[i].visible = l[i].visible === false; await guardarCats(); toast(l[i].visible ? "Categoría visible" : "Categoría oculta en la web"); return refresh(); }
  if (t.matches("[data-cedit]")) return catForm(tipo, i);
  if (t.matches("[data-cdel]")) return catBorrar(tipo, i);
});
