/* =========================================================
   EDITOR DE PÁGINAS — cada página de la web se edita por separado,
   con todo su contenido en el mismo orden en que se ve.
   ========================================================= */
const ED = { pag: null, web: null, pg: null, aj: null, dirty: false, ajDirty: false, open: new Set() };
const TXD = (window.DATOS && window.DATOS.textos) || [];
const IMD = (window.DATOS && window.DATOS.imagenesFijas) || [];
const EPAGS = [
  { id: "inicio", n: "Inicio", ic: "home", d: "Portada, secciones, pasos, testimonios y llamado final", url: "" },
  { id: "servicios", n: "Servicios", icw: "steth", d: "Encabezado, servicios con precios y categorías", url: "servicios" },
  { id: "tienda", n: "Pet Shop", icw: "bag", d: "Encabezado, productos, categorías y ventajas", url: "tienda" },
  { id: "citas", n: "Reservar cita", ic: "cal", d: "Encabezado y textos del formulario de reserva", url: "citas" },
  { id: "mi-mascota", n: "Mi Mascota", ic: "paw", d: "Textos e imagen del ingreso con código", url: "mi-mascota" },
  { id: "nosotros", n: "Nosotros", ic: "users", d: "Historia, fotos y equipo", url: "nosotros" },
  { id: "contacto", n: "Contacto", ic: "phone", d: "Dirección, teléfonos, horarios, redes y formulario", url: "contacto" },
  { id: "general", n: "Barra superior y pie", ic: "menu", d: "Botón del menú, barra superior, columnas del pie y redes", url: "", grupo: "todas" },
  { id: "marca", n: "Logo, nombre y colores", i2: "palette", d: "Se aplican en todas las páginas", url: "", grupo: "todas" },
  { id: "menu", n: "Menú de la web", ic: "menu", d: "Nombres, orden y páginas ocultas", url: "", grupo: "todas" },
  { id: "extras", n: "Páginas nuevas", icw: "sparkle", d: "Crea páginas como Promociones o Preguntas frecuentes", url: "", grupo: "todas" },
];
const epIco = p => p.ic ? ico(p.ic) : p.i2 ? ic2(p.i2) : icoW(p.icw);
const clone = o => JSON.parse(JSON.stringify(o));

/* ---------- Ruta de datos: "web/portada/titulo", "pg/textos/ini.b1"… ---------- */
const gp = path => path.split("/").reduce((o, k) => o == null ? undefined : o[k], ED);
function sp(path, v) {
  const ks = path.split("/"); let o = ED;
  ks.slice(0, -1).forEach((k, i) => { if (o[k] == null || typeof o[k] !== "object") o[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[k]; });
  o[ks[ks.length - 1]] = v;
}
const pad5 = t => t && /^\d:\d\d$/.test(t) ? "0" + t : t;

/* ---------- Campos ---------- */
function ef(path, label, o = {}) {
  let v = gp(path); if (v == null) v = o.def ?? "";
  if (o.type === "checkbox") return `<label class="chk ${o.full ? "full" : ""}"><input type="checkbox" data-p="${path}" ${v ? "checked" : ""} ${o.dis ? "disabled" : ""}><span><b>${label}</b>${o.ph ? `<small>${o.ph}</small>` : ""}</span></label>`;
  if (o.type === "time") v = pad5(v);
  const val = o.type === "lines" ? (v || []).join("\n") : v;
  const inp = o.type === "textarea" || o.type === "lines"
    ? `<textarea data-p="${path}" ${o.type === "lines" ? "data-lines" : ""} rows="${o.rows || 3}" placeholder="${esc(o.ph || "")}">${esc(val)}</textarea>`
    : `<input data-p="${path}" type="${o.type || "text"}" value="${esc(val)}" placeholder="${esc(o.ph || "")}" ${o.extra || ""}>`;
  return `<div class="field ${o.full ? "full" : ""}"><label>${label}</label>${inp}${o.hint ? `<small class="hint">${o.hint}</small>` : ""}</div>`;
}
function eimg(path, label, o = {}) {
  const v = gp(path) || "", src = foto(v || o.def || "", 400);
  return `<div class="img-up ed-img ${o.wide ? "wide" : ""}" data-ip="${path}" data-inline="${o.inline ? 1 : ""}" data-max="${o.max || 1400}" data-logo="${o.logo ? 1 : ""}">
    <span class="prev ${o.logo ? "logo" : ""}">${src ? `<img src="${esc(src)}" alt="">` : ic2("image")}</span>
    <div><b>${label}</b>${o.ph ? `<small>${o.ph}</small>` : ""}${!v && o.def ? `<small>Ahora se ve la imagen de la plantilla.</small>` : ""}
      <div class="row-btns"><label class="btn btn-light btn-sm">${ico("camera")} ${v ? "Cambiar" : "Subir"}<input type="file" accept="image/*" hidden data-ed-up></label>${v ? `<button type="button" class="btn btn-sm ghost" data-ed-clear>Quitar</button>` : ""}</div></div></div>`;
}
const grid = (h, cls = "grid2") => `<div class="${cls}">${h}</div>`;
const nota = t => `<p class="ed-note">${ico("alert")} ${t}</p>`;
// Textos sueltos registrados en la plantilla (data-t)
const gruposDe = pag => [...new Set(TXD.filter(t => t.pag === pag).map(t => t.g))];
function txt(pag, g) {
  const l = TXD.filter(t => t.pag === pag && t.g === g); if (!l.length) return "";
  return grid(l.map(t => ef(`pg/textos/${t.k}`, t.l, { def: t.v, full: t.v.length > 48, type: t.v.length > 90 ? "textarea" : "text" })).join(""));
}
const imgFija = k => { const d = IMD.find(x => x.k === k) || {}; return eimg(`pg/imagenes/${k}`, d.l || "Imagen", { def: d.src, wide: true }); };
function card(titulo, body, o = {}) {
  return `<div class="card ed-card" ${o.id ? `id="${o.id}"` : ""}><div class="card-h"><h2>${o.ico || ""} ${titulo}</h2>${o.right || ""}</div>${o.sub ? `<p class="sub ed-sub">${o.sub}</p>` : ""}${body}</div>`;
}
function acc(key, titulo, sub, body) {
  return `<details class="acc ed-acc" data-acc="${key}" ${ED.open.has(key) ? "open" : ""}><summary><b>${esc(titulo)}</b><small>${esc(sub || "")}</small></summary><div class="acc-b">${body}</div></details>`;
}
// fila desplegable con interruptor a la izquierda y botones a la derecha
const fila = (key, titulo, sub, body, izq, der, oculto) => `<div class="ed-sec ${oculto ? "dim" : ""}">${izq || ""}${acc(key, titulo, sub, body)}${der || ""}</div>`;
const swVis = (path, on) => `<label class="sw" title="Mostrar u ocultar"><input type="checkbox" data-p="${path}" ${on ? "checked" : ""}><span></span></label>`;
const filaBtns = (arr, i, n) => `<div class="acts"><button type="button" class="icon-btn mv" data-ed="mv" data-arr="${arr}" data-i="${i}" data-d="-1" ${i === 0 ? "disabled" : ""} title="Subir">▲</button><button type="button" class="icon-btn mv" data-ed="mv" data-arr="${arr}" data-i="${i}" data-d="1" ${i === n - 1 ? "disabled" : ""} title="Bajar">▼</button><button type="button" class="icon-btn" data-ed="del" data-arr="${arr}" data-i="${i}" title="Eliminar">${ico("trash")}</button></div>`;

/* ---------- Bloques que el cliente agrega a cualquier página ---------- */
const ENLACES = ["citas", "tienda", "servicios", "mi-mascota", "nosotros", "contacto"];
function bloquesCard(pag) {
  const arr = `pg/bloques/${pag}`, l = gp(arr) || [];
  const rows = l.map((b, i) => fila(`bl-${pag}-${i}`, b.titulo || `Bloque ${i + 1}`, b.visible === false ? "Oculto" : (b.texto || "").slice(0, 60),
    eimg(`${arr}/${i}/img`, "Imagen (opcional)", { ph: "Se muestra al lado del texto" }) +
    grid(ef(`${arr}/${i}/titulo`, "Título", { full: true }) + ef(`${arr}/${i}/texto`, "Texto · deja una línea en blanco para separar párrafos", { type: "textarea", full: true, rows: 4 }) +
      ef(`${arr}/${i}/boton`, "Texto del botón (opcional)", { ph: "Ej. Reservar ahora" }) + ef(`${arr}/${i}/enlace`, "A dónde lleva el botón", { ph: "citas, tienda o https://…", extra: 'list="edLinks"' })),
    swVis(`${arr}/${i}/visible`, b.visible !== false), filaBtns(arr, i, l.length), b.visible === false)).join("");
  return card("Bloques extra de esta página", `${rows || `<p class="empty">Aún no agregaste bloques. Úsalos para promociones, avisos, preguntas frecuentes o lo que quieras.</p>`}
    <button type="button" class="btn btn-light btn-sm" data-ed="add" data-arr="${arr}" data-tpl="bloque" style="margin-top:10px">${ico("plus")} Agregar bloque</button>
    <datalist id="edLinks">${ENLACES.map(x => `<option value="${x}">`).join("")}${(ED.pg.extras || []).map(x => `<option value="pagina?p=${esc(x.slug)}">`).join("")}</datalist>`,
    { ico: icoW("sparkle"), sub: "Aparecen al final de la página, antes del pie. Puedes ordenarlos, ocultarlos o borrarlos." });
}
const TPL = {
  bloque: () => ({ titulo: "Nuevo bloque", texto: "", img: "", boton: "", enlace: "", visible: true }),
  equipo: () => ({ n: "", cargo: "", d: "", foto: "" }),
  testimonio: () => ({ q: "", n: "", r: "" }),
};
function encCard(k) {
  const b = `pg/encabezados/${k}`;
  return card("Encabezado de la página", grid(ef(`${b}/pill`, "Etiqueta pequeña") + ef(`${b}/titulo`, "Título") + ef(`${b}/tituloColor`, "Continuación del título (en color)") + ef(`${b}/texto`, "Texto debajo del título", { type: "textarea", full: true }))
    + eimg(`${b}/img`, "Imagen de fondo (opcional)", { wide: true, ph: "Foto horizontal. El texto se pone blanco sobre la imagen." }), { ico: ic2("file") });
}

/* ---------- Listas que se guardan al instante (servicios, productos, categorías) ---------- */
function listaServicios(ss) {
  return card("Servicios y precios", `<div class="list">${ss.map((x, i) => `<div class="li ed-item ${x.visible === false ? "dim" : ""}" data-serv="${esc(x.id)}">
      <span class="thumb">${x.img ? `<img src="${esc(foto(x.img, 120))}" alt="" onerror="this.remove()">` : icoW(x.icon || "steth")}</span>
      <div><b>${esc(x.n)}</b><small>${esc(catName(CATSV, x.cat))} · ${x.tipo === "adicional" ? "Lista" : "Tarjeta con foto"}${x.domicilio ? " · A domicilio" : ""}${x.reservable === false ? " · No se reserva online" : ""}${x.visible === false ? " · Oculto" : ""}</small></div>
      <b class="money">${precioTxt(x.p)}</b>
      <div class="acts"><button class="icon-btn mv" data-mv="-1" ${i === 0 ? "disabled" : ""}>▲</button><button class="icon-btn mv" data-mv="1" ${i === ss.length - 1 ? "disabled" : ""}>▼</button>
        <button class="icon-btn edit" data-edit-serv title="Editar">${ico("edit")}</button><button class="icon-btn" data-del-serv title="Eliminar">${ico("trash")}</button></div></div>`).join("") || `<p class="empty">Aún no hay servicios en tu base de datos.</p>`}</div>`,
    { icw: "", ico: icoW("steth"), sub: "Foto, nombre, precio, descripción y si es a domicilio. <b>Se guarda al momento.</b>",
      right: `<div class="acts">${!ss.length ? `<button class="btn btn-light btn-sm" data-import="servicios">Cargar ejemplos</button>` : ""}<button class="btn btn-pri btn-sm" data-new-serv>${ico("plus")} Nuevo servicio</button></div>` });
}
function listaProductos(ps) {
  return card("Productos", `<div class="list ed-scroll">${ps.map((p, i) => { const c = p.inv ? +p.inv.cantidad : null;
      return `<div class="li ed-item ${p.visible === false ? "dim" : ""}" data-prod="${esc(p.id)}">
      <span class="thumb">${p.img ? `<img src="${esc(foto(p.img, 120))}" alt="" onerror="this.remove()">` : ico("paw")}</span>
      <div><b>${esc(p.n)}</b><small>${esc(catName(CATP, p.cat))}${p.destacado ? " · Destacado" : ""}${p.visible === false ? " · Oculto" : ""}</small></div>
      <div class="ed-price"><b class="money">${S(p.p)}</b>${c == null ? "" : c <= 0 ? `<span class="st bad">Agotado</span>` : `<span class="st ok">${c} und.</span>`}</div>
      <div class="acts"><button class="icon-btn mv" data-mv="-1" ${i === 0 ? "disabled" : ""}>▲</button><button class="icon-btn mv" data-mv="1" ${i === ps.length - 1 ? "disabled" : ""}>▼</button>
        <button class="icon-btn edit" data-edit-prod title="Editar">${ico("edit")}</button><button class="icon-btn" data-del-prod title="Eliminar">${ico("trash")}</button></div></div>`; }).join("") || `<p class="empty">Aún no hay productos en tu base de datos.</p>`}</div>`,
    { ico: icoW("bag"), sub: "Fotos, galería, precio, oferta, stock y descripción. El inventario completo está en <b>Pet Shop e inventario</b>. <b>Se guarda al momento.</b>",
      right: `<div class="acts">${!ps.length ? `<button class="btn btn-light btn-sm" data-import="productos">Cargar ejemplos</button>` : ""}<button class="btn btn-pri btn-sm" data-new-prod>${ico("plus")} Nuevo producto</button></div>` });
}
function listaCats(tipo) {
  const l = tipo === "productos" ? CATP : CATSV, items = tipo === "productos" ? CUR.prods : CUR.servs;
  return card(`Categorías ${tipo === "productos" ? "del Pet Shop" : "de servicios"}`, `<div class="list">${l.map((c, i) => `<div class="li ${c.visible === false ? "dim" : ""}" data-ecat="${tipo}" data-i="${i}">
      <span class="svc-ic">${icoW(c.icon)}</span><div><b>${esc(c.n)}</b><small>${items.filter(x => catId(l, x.cat) === c.id).length} ${tipo === "productos" ? "producto(s)" : "servicio(s)"}${c.visible === false ? " · Oculta" : ""}</small></div>
      <div class="acts"><button class="icon-btn mv" data-ecmv="-1" ${i === 0 ? "disabled" : ""}>▲</button><button class="icon-btn mv" data-ecmv="1" ${i === l.length - 1 ? "disabled" : ""}>▼</button>
        <button class="btn btn-light btn-sm" data-ecvis>${c.visible === false ? "Mostrar" : "Ocultar"}</button><button class="icon-btn edit" data-ecedit>${ico("edit")}</button><button class="icon-btn" data-ecdel>${ico("trash")}</button></div></div>`).join("")}</div>`,
    { ico: icoW("star"), sub: "Son los filtros de la página. <b>Se guarda al momento.</b>", right: `<button class="btn btn-pri btn-sm" data-ecnew="${tipo}">${ico("plus")} Nueva</button>` });
}

/* ---------- Contenido de cada página ---------- */
const PAGINA_ED = {
  async inicio() {
    const P = "web/portada", secs = ED.pg.inicio || [];
    const portada = card("Portada (lo primero que se ve)", grid(ef(`${P}/etiqueta`, "Etiqueta superior", { full: true }) + ef(`${P}/titulo`, "Título grande") + ef(`${P}/tituloColor`, "Continuación del título (en color)") + ef(`${P}/texto`, "Texto de presentación", { type: "textarea", full: true }))
      + eimg(`${P}/foto`, "Foto principal", { wide: true })
      + `<div class="ed-sub2">Cifras</div>` + grid([0, 1, 2].map(i => ef(`${P}/cifras/${i}/n`, `Cifra ${i + 1}`, { ph: "Ej. 12 años" }) + ef(`${P}/cifras/${i}/t`, `Texto cifra ${i + 1}`)).join(""), "grid3 ed-cif")
      + `<div class="ed-sub2">Botones</div>` + txt("inicio", "Portada") + `<div class="ed-sub2">Tarjetas sobre la foto</div>` + txt("inicio", "Tarjetas sobre la foto"), { ico: ico("home") });
    const extra = {
      accesos: () => txt("inicio", "Accesos rápidos"),
      servicios: () => txt("inicio", "Servicios") + nota("Los servicios que aparecen aquí se editan en la página <b>Servicios</b>."),
      portal: () => txt("inicio", "Portal Mi Mascota"),
      emergencias: () => txt("inicio", "Aviso de emergencias") + nota("Este aviso también aparece en Servicios. Para ocultarlo en toda la web ve a <b>Barra superior y pie</b>."),
      tienda: () => txt("inicio", "Productos destacados") + nota("Aquí salen los productos marcados como <b>Destacado</b> en Pet Shop."),
      pasos: () => txt("inicio", "Cómo reservar (pasos)"),
      testimonios: () => `<div class="ed-sub2">Opiniones de clientes</div>` + (ED.web.testimonios || []).map((x, i) => `<div class="rep ed-rep">${grid(ef(`web/testimonios/${i}/q`, "Opinión", { type: "textarea", full: true }) + ef(`web/testimonios/${i}/n`, "Nombre") + ef(`web/testimonios/${i}/r`, "Detalle (ej. Dueña de Rocky)"))}${filaBtns("web/testimonios", i, ED.web.testimonios.length)}</div>`).join("")
        + `<button type="button" class="btn btn-light btn-sm" data-ed="add" data-arr="web/testimonios" data-tpl="testimonio">${ico("plus")} Agregar opinión</button>` + nota("Las opiniones también se muestran en Nosotros."),
      cta: () => txt("inicio", "Llamado final") + imgFija("cta") + nota("El llamado final también aparece en Servicios, Nosotros y las páginas nuevas."),
    };
    const filas = secs.map((x, i) => {
      const campos = x.id === "accesos" ? "" : grid(("pill" in x ? ef(`pg/inicio/${i}/pill`, "Etiqueta") : "") + ef(`pg/inicio/${i}/titulo`, "Título") + ("tituloColor" in x ? ef(`pg/inicio/${i}/tituloColor`, "Continuación (en color)") : "") + ("texto" in x ? ef(`pg/inicio/${i}/texto`, "Texto", { type: "textarea", full: true }) : ""));
      const sw = swVis(`pg/inicio/${i}/visible`, x.visible !== false);
      const mv = `<span class="acts"><button type="button" class="icon-btn mv" data-ed="mv" data-arr="pg/inicio" data-i="${i}" data-d="-1" ${i === 0 ? "disabled" : ""}>▲</button><button type="button" class="icon-btn mv" data-ed="mv" data-arr="pg/inicio" data-i="${i}" data-d="1" ${i === secs.length - 1 ? "disabled" : ""}>▼</button></span>`;
      return fila(`sec-${x.id}`, x.n, x.visible === false ? "Oculta" : [x.titulo, x.tituloColor].filter(Boolean).join(" "), campos + (extra[x.id] ? extra[x.id]() : ""), sw, mv, x.visible === false);
    }).join("");
    return portada + card("Secciones de la página", `<div class="ed-secs">${filas}</div>`, { ico: ic2("file"), sub: "Ábrelas para editar su contenido. Usa el interruptor para mostrar u ocultar y las flechas para cambiar el orden." }) + bloquesCard("inicio");
  },
  async servicios() {
    const ss = CUR.servs = ordenar(await DB.listCol("servicios")); CUR.list = ss;
    return encCard("servicios") + listaServicios(ss) + card("Nota de precios", txt("servicios", "Nota de precios"), { ico: icoW("pill"), sub: "Aclara que los medicamentos y materiales se cobran aparte." }) + listaCats("servicios")
      + card("Sección «Y además»", txt("servicios", "Sección «Y además»") + nota("Aquí aparecen los servicios de tipo «Adicional (lista)»."), { ico: icoW("sparkle") })
      + nota("El aviso de emergencias y el llamado final de esta página se editan en <b>Inicio → Secciones</b> (son compartidos).") + bloquesCard("servicios");
  },
  async tienda() {
    const [ps, inv] = await Promise.all([DB.listCol("productos"), DB.listCol("inventario")]); const im = {}; inv.forEach(x => im[x.id] = x);
    const all = ordenar(ps).map(p => ({ ...p, inv: im[p.id] || null })); CUR.list = all; CUR.prods = all;
    return encCard("tienda") + listaProductos(all) + listaCats("productos")
      + card("Ventajas (debajo de los productos)", txt("tienda", "Ventajas (debajo de los productos)"), { ico: icoW("truck") }) + bloquesCard("tienda");
  },
  async citas() {
    return encCard("citas") + card("Formulario de reserva", txt("citas", "Formulario"), { ico: ico("cal"), sub: "Los servicios que se pueden elegir son los que tienen activado «Se puede reservar online» en Servicios. Los horarios salen de Ajustes y Doctores." })
      + card("Resumen (columna derecha)", txt("citas", "Resumen (columna derecha)"), { ico: ic2("file") }) + bloquesCard("citas");
  },
  async "mi-mascota"() {
    return card("Ingreso con código", txt("mi-mascota", "Ingreso con código") + imgFija("mm.img"), { ico: ico("paw") })
      + card("Panel del cliente", txt("mi-mascota", "Panel del cliente (títulos)"), { ico: ico("history"), sub: "Títulos de las secciones que ve el cliente después de entrar con su código." }) + bloquesCard("mi-mascota");
  },
  async nosotros() {
    const N = "web/nosotros", eq = ED.web.equipo || [];
    return encCard("nosotros")
      + card("Nuestra historia", grid(ef(`${N}/titulo`, "Título") + ef(`${N}/tituloColor`, "Continuación (en color)") + ef(`${N}/texto`, "Historia", { type: "textarea", full: true, rows: 4 }) + ef(`${N}/puntos`, "Puntos destacados · uno por línea", { type: "lines", full: true, rows: 4 }))
        + eimg(`${N}/foto`, "Foto", { wide: true }) + txt("nosotros", "Historia"), { ico: icoW("heart") })
      + card("Equipo", txt("nosotros", "Equipo") + eq.map((x, i) => `<div class="rep ed-rep">${eimg(`web/equipo/${i}/foto`, "Foto", { inline: true, max: 320 })}${grid(ef(`web/equipo/${i}/n`, "Nombre") + ef(`web/equipo/${i}/cargo`, "Cargo / especialidad") + ef(`web/equipo/${i}/d`, "Descripción", { full: true }))}${filaBtns("web/equipo", i, eq.length)}</div>`).join("")
        + `<button type="button" class="btn btn-light btn-sm" data-ed="add" data-arr="web/equipo" data-tpl="equipo">${ico("plus")} Agregar persona</button>`, { ico: ico("users"), sub: "Las personas del equipo que se muestran en la web. Los horarios de los doctores se manejan en <b>Doctores</b>." })
      + nota("Las opiniones y el llamado final se editan en <b>Inicio → Secciones</b>.") + bloquesCard("nosotros");
  },
  async contacto() {
    return encCard("contacto")
      + card("Datos de contacto", grid(ef("aj/whatsapp", "WhatsApp (con 51)", { ph: "51987654321", extra: 'inputmode="tel"' }) + ef("aj/telefono", "Teléfono como se muestra", { ph: "+51 987 654 321" }) + ef("aj/direccion", "Dirección (también mueve el mapa)", { full: true }) + ef("aj/correo", "Correo", { type: "email" }))
        + grid(ef("aj/abre", "Abre", { type: "time" }) + ef("aj/cierra", "Cierra (lun a sáb)", { type: "time" }) + ef("aj/domingoCierra", "Cierra domingo (vacío = cerrado)", { type: "time" }), "grid3")
        + `<div class="ed-sub2">Títulos de cada dato</div>` + txt("contacto", "Títulos de los datos"), { ico: ico("pin"), sub: "Se usan en toda la web (barra superior, pie, mapa y reservas)." })
      + card("Redes sociales", grid(ef("web/redes/facebook", "Facebook", { ph: "facebook.com/tuveterinaria" }) + ef("web/redes/instagram", "Instagram", { ph: "instagram.com/tuveterinaria" }) + ef("web/redes/tiktok", "TikTok", { ph: "tiktok.com/@tuveterinaria" }), "grid3"), { ico: ico("users"), sub: "Deja vacío lo que no uses: no aparecerá." })
      + card("Formulario «Escríbenos»", txt("contacto", "Formulario"), { ico: ico("mail") }) + bloquesCard("contacto");
  },
  async general() {
    return card("Barra superior y menú", txt("general", "Barra superior") + txt("general", "Menú") + ef("web/emergencias", "Mostrar el aviso de «Emergencias 24 horas» en toda la web", { type: "checkbox" }), { ico: ico("menu") })
      + card("Pie de página", grid(ef("pg/pie/texto", "Texto debajo del logo", { type: "textarea", full: true })) + `<div class="ed-sub2">Columnas</div>` + txt("general", "Columnas del pie"), { ico: ico("phone") })
      + card("Redes sociales", grid(ef("web/redes/facebook", "Facebook") + ef("web/redes/instagram", "Instagram") + ef("web/redes/tiktok", "TikTok"), "grid3"), { ico: ico("users") });
  },
  async marca() {
    const M = "web/marca";
    return card("Logo, nombre y colores", `<div class="brand-prev" id="bPrev"></div>` + eimg(`${M}/logo`, "Logo (PNG cuadrado, mejor con fondo transparente)", { inline: true, logo: true, max: 256 })
      + grid(ef(`${M}/nombre1`, "Nombre (parte 1)") + ef(`${M}/nombre2`, "Nombre (parte 2, en color)", { hint: "Empieza con espacio si son dos palabras" }) + ef(`${M}/eslogan`, "Texto debajo del nombre"), "grid3")
      + grid(ef(`${M}/color1`, "Color principal", { type: "color" }) + ef(`${M}/color2`, "Color de los botones de acción", { type: "color" }) + `<div class="field"><label>&nbsp;</label><button type="button" class="btn btn-light" data-ed="colores">Colores originales</button></div>`, "grid3"), { ico: ic2("palette") });
  },
  async menu() {
    const l = ED.pg.menu || [];
    return card("Menú de la web", `<div class="list">${l.map((m, i) => `<div class="li menu-row ${m.visible === false ? "dim" : ""}"><label class="sw"><input type="checkbox" data-p="pg/menu/${i}/visible" ${m.visible !== false ? "checked" : ""} ${m.id === "inicio" ? "disabled" : ""}><span></span></label>
        <div class="field" style="margin:0;flex:1"><input data-p="pg/menu/${i}/n" value="${esc(m.n)}" aria-label="Nombre en el menú"></div><small class="sub hide-m">/${m.id === "inicio" ? "" : esc(m.id)}</small>
        <div class="acts"><button type="button" class="icon-btn mv" data-ed="mv" data-arr="pg/menu" data-i="${i}" data-d="-1" ${i === 0 ? "disabled" : ""}>▲</button><button type="button" class="icon-btn mv" data-ed="mv" data-arr="pg/menu" data-i="${i}" data-d="1" ${i === l.length - 1 ? "disabled" : ""}>▼</button></div></div>`).join("")}</div>`,
      { ico: ico("menu"), sub: "Cambia el nombre de cada opción, el orden o apágala para ocultar esa página. Las páginas nuevas se agregan al menú desde «Páginas nuevas»." });
  },
  async extras() {
    const l = ED.pg.extras || [];
    return card("Páginas nuevas", `<div class="list">${l.map((x, i) => `<div class="li"><span class="svc-ic">${icoW("sparkle")}</span><div><b>${esc(x.n)}</b><small>/pagina?p=${esc(x.slug)} · ${(x.bloques || []).length} bloque(s) · ${x.enMenu ? "En el menú" : "No está en el menú"}</small></div>
        <div class="acts"><a class="btn btn-light btn-sm" href="${esc(webBase())}pagina?p=${encodeURIComponent(x.slug)}" target="_blank" rel="noopener">${ico("eye")}</a><button type="button" class="icon-btn edit" data-ed="xedit" data-i="${i}">${ico("edit")}</button><button type="button" class="icon-btn" data-ed="xdel" data-i="${i}">${ico("trash")}</button></div></div>`).join("") || `<p class="empty">Aún no creaste páginas.</p>`}</div>`,
      { ico: icoW("sparkle"), sub: "Cada página tiene su título y bloques de texto con imagen y botón.", right: `<button type="button" class="btn btn-pri btn-sm" data-ed="xnew">${ico("plus")} Crear página</button>` });
  },
};

/* ---------- Carga ---------- */
async function edCargar() {
  const D = clone(window.DATOS.web), w = await DB.getWeb();
  ED.web = { ...D, ...w, marca: { ...D.marca, ...(w.marca || {}) }, portada: { ...D.portada, ...(w.portada || {}) }, nosotros: { ...D.nosotros, ...(w.nosotros || {}) }, redes: { ...D.redes, ...(w.redes || {}) } };
  ED.web.portada.cifras = [0, 1, 2].map(i => ({ ...(D.portada.cifras[i] || {}), ...((ED.web.portada.cifras || [])[i] || {}) }));
  ED.pg = await cargarPaginas(); ED.pg.textos = ED.pg.textos || {}; ED.pg.imagenes = ED.pg.imagenes || {}; ED.pg.bloques = ED.pg.bloques || {};
  ED.aj = await cargarAjustes();
  const ids = [...new Set((JSON.stringify([ED.web, ED.pg]).match(/"m:[A-Za-z0-9_-]+"/g) || []).map(x => x.slice(3, -1)))].filter(id => !MEDIA[id]);
  if (ids.length) Object.assign(MEDIA, await DB.getMedios(ids));
  ED.dirty = false; ED.ajDirty = false;
}

/* ---------- Vista ---------- */
VIEWS.editor = async (p = {}) => {
  if (!ED.web || !ED.dirty) await edCargar();
  await cargarCats(); CUR.prods = CUR.prods || []; CUR.servs = CUR.servs || [];
  ED.pag = p.pag || null;
  const y = p._y;
  if (!ED.pag) return edLista();
  const def = EPAGS.find(x => x.id === ED.pag);
  if (ED.pag === "servicios" || ED.pag === "tienda") { const [ps, ss] = await Promise.all([DB.listCol("productos"), DB.listCol("servicios")]); CUR.prods = ps; CUR.servs = ss; }
  const body = await PAGINA_ED[ED.pag]();
  const nom = (ED.pg.menu || []).find(m => m.id === ED.pag)?.n || def.n;
  $("#view").innerHTML = topBar(esc(nom), def.d,
    `${!["marca", "menu", "extras"].includes(def.id) ? `<a class="btn btn-light" href="${esc(webBase() + def.url)}" target="_blank" rel="noopener">${ico("eye")}<span class="hide-m">Ver página</span></a>` : ""}`,
    `<div class="crumb"><button data-ed="lista">Editor de páginas</button> / ${esc(nom)}</div>`)
    + `<div class="ed-page" id="edPage">${body}</div>
    <div class="save-bar ed-save"><span class="sub" id="edMsg">${ED.dirty ? "Tienes cambios sin guardar." : "Los cambios se publican al guardar."}</span><button class="btn btn-light" type="button" data-ed="lista">${ic2("left")} Páginas</button><button class="btn btn-pri" type="button" data-ed="guardar">${ico("check")} Guardar y publicar</button></div>`;
  if (ED.pag === "marca") brandPrev();
  if (y != null) { window.scrollTo(0, y); setTimeout(() => window.scrollTo(0, y), 0); }
};
function edLista() {
  const tarjeta = p => { const nom = (ED.pg.menu || []).find(m => m.id === p.id)?.n || p.n, nb = ((ED.pg.bloques || {})[p.id] || []).length, oculto = (ED.pg.menu || []).find(m => m.id === p.id)?.visible === false;
    return `<button class="ep-card ${oculto ? "dim" : ""}" data-ed="abrir" data-pag="${p.id}"><span class="ep-ic">${epIco(p)}</span><span class="ep-t"><b>${esc(nom)}</b><small>${esc(p.d)}</small>
      <span class="ep-tags">${oculto ? `<span class="st">Oculta en el menú</span>` : ""}${nb ? `<span class="st info">${nb} bloque${nb > 1 ? "s" : ""} extra</span>` : ""}</span></span><span class="ep-go">${ico("edit")} Editar</span></button>`; };
  $("#view").innerHTML = topBar("Editor de páginas", "Elige una página y edita todo lo que tiene: textos, imágenes, servicios, productos y bloques. Se ve igual que en la web.",
    `<a class="btn btn-light" href="${esc(webBase())}" target="_blank" rel="noopener">${ico("eye")}<span class="hide-m">Ver web</span></a>`) + `
    <h3 class="ep-h">Páginas de la web</h3><div class="ep-grid">${EPAGS.filter(p => !p.grupo).map(tarjeta).join("")}</div>
    <h3 class="ep-h">Para todas las páginas</h3><div class="ep-grid">${EPAGS.filter(p => p.grupo).map(tarjeta).join("")}</div>`;
}
function brandPrev() {
  const m = ED.web.marca || {}, b = $("#bPrev"); if (!b) return;
  b.innerHTML = `<span class="paw" style="background:${esc(m.color1)}">${m.logo ? `<img src="${esc(foto(m.logo, 120))}" alt="">` : ico("paw")}</span><span class="bp-t">${esc(m.nombre1 || "")}<b style="color:${esc(m.color2)}">${esc(m.nombre2 || "")}</b><small>${esc(m.eslogan || "")}</small></span><span class="bp-btn" style="background:${esc(m.color1)}">Botón</span><span class="bp-btn" style="background:${esc(m.color2)}">Reservar</span>`;
}
const edRender = () => safe(() => VIEWS.editor({ pag: ED.pag, _y: window.scrollY }));
const marcar = () => { ED.dirty = true; const m = $("#edMsg"); if (m) { m.textContent = "Tienes cambios sin guardar."; m.classList.add("warn"); } };

async function edGuardar() {
  if (!(String(ED.web.marca?.nombre1 || "").trim())) return toast("Escribe el nombre de la veterinaria en «Logo, nombre y colores»", true);
  Object.keys(ED.pg.bloques || {}).forEach(k => ED.pg.bloques[k] = (ED.pg.bloques[k] || []).filter(b => b.titulo || b.texto || b.img || b.boton));
  ED.web.equipo = (ED.web.equipo || []).filter(x => x.n || x.cargo || x.foto);
  ED.web.testimonios = (ED.web.testimonios || []).filter(x => x.q || x.n);
  if (JSON.stringify(ED.web).length > 900000 || JSON.stringify(ED.pg).length > 900000) return toast("Hay imágenes muy pesadas. Usa fotos más pequeñas.", true);
  await safe(async () => {
    await DB.saveWeb(ED.web); await DB.saveConf("paginas", ED.pg);
    if (ED.ajDirty) {
      const a = ED.aj, hh = t => String(t || "").replace(/^0(\d)/, "$1"), wa = String(a.whatsapp || "").replace(/\D/g, "");
      if (wa && wa.length < 11) throw new Error("El WhatsApp debe incluir 51 + 9 dígitos");
      await DB.saveAjustes({ whatsapp: wa, telefono: a.telefono || "", direccion: a.direccion || "", correo: a.correo || "", abre: hh(a.abre), cierra: hh(a.cierra), domingoCierra: hh(a.domingoCierra) });
    }
    ED.dirty = false; ED.ajDirty = false;
    toast("Página publicada"); const m = $("#edMsg"); if (m) { m.textContent = "Guardado · " + nowHM() + " h"; m.classList.remove("warn"); }
    cargarMarca();
  });
}

/* ---------- Eventos ---------- */
document.addEventListener("input", e => {
  const el = e.target; if (CUR.v !== "editor" || !el.dataset || !el.dataset.p) return;
  const v = el.type === "checkbox" ? el.checked : el.hasAttribute("data-lines") ? el.value.split("\n").map(x => x.trim()).filter(Boolean) : el.value;
  sp(el.dataset.p, v); if (el.dataset.p.startsWith("aj/")) ED.ajDirty = true; marcar();
  if (ED.pag === "marca") brandPrev();
  if (el.type === "checkbox") { const row = el.closest(".ed-sec, .menu-row"); if (row) row.classList.toggle("dim", !el.checked); }
});
document.addEventListener("change", async e => {
  const el = e.target; if (CUR.v !== "editor") return;
  if (el.dataset && el.dataset.p && el.type === "checkbox") return;   // ya lo tomó "input"
  if (!el.matches("[data-ed-up]") || !el.files[0]) return;
  const box = el.closest("[data-ip]"), path = box.dataset.ip, max = +box.dataset.max || 1400;
  const prev = $(".prev", box); prev.innerHTML = `<span class="ph-load"></span>`;
  await safe(async () => {
    const data = box.dataset.logo ? await resizeImage(el.files[0], max, .92, "image/png") : await resizeImage(el.files[0], max, max > 600 ? .72 : .8);
    if (box.dataset.inline) sp(path, data);
    else { const id = await DB.saveMedio(data); MEDIA[id] = data; sp(path, "m:" + id); }
    marcar(); edRender();
  });
});
document.addEventListener("click", async e => {
  if (CUR.v !== "editor") return;
  const sum = e.target.closest("details[data-acc] > summary");
  if (sum) { const d = sum.parentElement; setTimeout(() => { d.open ? ED.open.add(d.dataset.acc) : ED.open.delete(d.dataset.acc); }, 0); }
  const t = e.target.closest("button, [data-ed]"); if (!t || !$("#view").contains(t)) return;
  const a = t.dataset.ed;
  if (t.matches("[data-ed-clear]")) { sp(t.closest("[data-ip]").dataset.ip, ""); marcar(); return edRender(); }
  if (a === "abrir") return go("editor", { pag: t.dataset.pag });
  if (a === "lista") return go("editor", {});
  if (a === "guardar") return edGuardar();
  if (a === "colores") { const D = window.DATOS.web.marca; ED.web.marca.color1 = D.color1; ED.web.marca.color2 = D.color2; marcar(); return edRender(); }
  if (a === "add") { const arr = t.dataset.arr, l = gp(arr) || []; l.push(TPL[t.dataset.tpl]()); sp(arr, l); if (t.dataset.tpl === "bloque") ED.open.add(`bl-${ED.pag}-${l.length - 1}`); marcar(); return edRender(); }
  if (a === "del") { e.preventDefault(); e.stopPropagation(); const arr = t.dataset.arr, l = gp(arr) || [], i = +t.dataset.i;
    if (!confirm("¿Quitar este elemento? (se borra al guardar)")) return; l.splice(i, 1); sp(arr, l); marcar(); return edRender(); }
  if (a === "mv") { e.preventDefault(); e.stopPropagation(); const arr = t.dataset.arr, l = gp(arr) || [], i = +t.dataset.i, j = i + +t.dataset.d; if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]]; sp(arr, l); marcar(); return edRender(); }
  // páginas nuevas (se guardan al momento: se publica también lo pendiente)
  if (a === "xnew" || a === "xedit") { if (ED.dirty) await edGuardar(); return extraForm(ED.pg, a === "xnew" ? null : +t.dataset.i); }
  if (a === "xdel") { const x = ED.pg.extras[+t.dataset.i]; return confirmDel(`Se eliminará la página <b>${esc(x.n)}</b>.`, async () => { ED.pg.extras.splice(+t.dataset.i, 1); await DB.saveConf("paginas", ED.pg); toast("Página eliminada"); edRender(); }); }
  // categorías
  if (t.dataset.ecnew) return catForm(t.dataset.ecnew, null);
  const row = t.closest("[data-ecat]");
  if (row) { const tipo = row.dataset.ecat, i = +row.dataset.i, l = tipo === "productos" ? CATP : CATSV;
    if (t.dataset.ecmv) { const j = i + +t.dataset.ecmv; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; await guardarCats(); return edRender(); }
    if (t.matches("[data-ecvis]")) { l[i].visible = l[i].visible === false; await guardarCats(); toast(l[i].visible ? "Categoría visible" : "Categoría oculta"); return edRender(); }
    if (t.matches("[data-ecedit]")) return catForm(tipo, i);
    if (t.matches("[data-ecdel]")) return catBorrar(tipo, i);
  }
});
// después de guardar una página nueva, volver al editor
const _paginasRender = VIEWS.paginasRender;
VIEWS.paginasRender = async (pg, msg) => { if (CUR.v === "editor") { ED.pg = pg; ED.dirty = false; return edRender(); } return _paginasRender(pg, msg); };
// avisar si sale con cambios sin guardar
const _goEd = go;
go = async function (v, p = {}) {   // eslint-disable-line no-global-assign
  if (CUR.v === "editor" && ED.dirty && (v !== "editor" || (p.pag || null) !== ED.pag)) {
    if (!confirm("Tienes cambios sin guardar en esta página. ¿Salir sin guardar?")) return;
    ED.dirty = false; ED.ajDirty = false; ED.web = null;
  }
  // al volver a la misma página del editor (por ejemplo, después de editar un servicio) se conserva la posición
  if (v === "editor") p = { ...p, _y: CUR.v === "editor" && (p.pag || null) === ED.pag ? window.scrollY : null };
  return _goEd(v, p);
};
window.addEventListener("beforeunload", e => { if (CUR.v === "editor" && ED.dirty) { e.preventDefault(); e.returnValue = ""; } });
// las vistas antiguas llevan al editor
VIEWS.paginas = () => go("editor", { pag: "menu" });
VIEWS.personalizar = () => go("editor", { pag: "marca" });
