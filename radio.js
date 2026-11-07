/* =========================================================
   RADIO DEL EQUIPO — mantén presionado para hablar, botones
   rápidos, mensajes escritos y avisos automáticos que suenan
   en todos los equipos con el panel abierto.
   ========================================================= */
(function () {
  const ROLES = ["Doctor", "Recepción", "Caja", "Grooming"];
  const DESTINOS = [["todos", "Todo el equipo"], ["Doctor", "Doctores"], ["Recepción", "Recepción"], ["Caja", "Caja"], ["Grooming", "Grooming"]];
  const RAPIDOS = [
    { t: "Terminé", d: "todos", i: "check" }, { t: "Pasar a caja", d: "Caja", i: "cash" }, { t: "Siguiente paciente", d: "Recepción", i: "next" },
    { t: "Llegó el cliente", d: "Doctor", i: "bell" }, { t: "Necesito ayuda", d: "todos", i: "alert" }, { t: "Voy en camino", d: "todos", i: "run" },
  ];
  const MAX_SEG = 30;
  const IC = {
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>',
    radio: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M7 8l10-5M8 14h.01M8 17h.01M14 15.5a1.5 1.5 0 1 0 0-.01"/><circle cx="15" cy="14.5" r="2.5"/>',
    vol: '<path d="M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>', off: '<path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/>',
    play: '<path d="M7 4v16l13-8z"/>', send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>',
    check: '<path d="M5 12l5 5L20 7"/>', cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>', next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>', alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
    run: '<circle cx="13" cy="4" r="2"/><path d="M7 21l3-6 3 3v-6l3 2 2-3M10 9l3-2 3 2"/>', auto: '<path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z"/>',
  };
  const ic = k => `<svg class="ico" viewBox="0 0 24 24">${IC[k] || ""}</svg>`;
  const LS = { get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  // identificador de esta ventana (cada pestaña o equipo es un "radio" distinto)
  const DEV = (() => { try { let d = sessionStorage.getItem("hv_radio_dev"); if (!d) { d = Math.random().toString(36).slice(2, 10); sessionStorage.setItem("hv_radio_dev", d); } return d; } catch (e) { return Math.random().toString(36).slice(2, 10); } })();
  const CFG = Object.assign({ nombre: "", rol: "Recepción", activo: false, avisos: { atencion: true, citas: true, pagos: true } }, LS.get("hv_radio_cfg", {}));
  const guardarCfg = () => LS.set("hv_radio_cfg", CFG);
  let MSGS = [], abierto = false, sinLeer = 0, iniciado = false, desbloqueado = false;
  const hm = ts => { const d = new Date(ts); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
  const soles = n => { const v = Math.round((+n || 0) * 100) / 100; return Number.isInteger(v) ? `${v} soles` : `${v.toFixed(2).replace(".", " con ")} soles`; };

  /* ---------- Interfaz ---------- */
  const fab = document.createElement("button"); fab.className = "rd-fab hidden"; fab.title = "Radio del equipo"; fab.innerHTML = `${ic("radio")}<span class="rd-badge"></span>`;
  const panel = document.createElement("aside"); panel.className = "rd-panel"; panel.setAttribute("aria-label", "Radio del equipo");
  const pop = document.createElement("div"); pop.className = "rd-pop";
  document.body.append(fab, panel, pop);

  function pintar() {
    const lista = MSGS.slice(-40).reverse().map(m => {
      const mio = m.dev === DEV, paraMi = m.para === "todos" || m.para === CFG.rol || mio;
      return `<div class="rd-msg ${mio ? "mio" : ""} ${m.tipo} ${paraMi ? "" : "otro"}"><div class="rd-mh"><b>${esc(m.tipo === "auto" ? "Aviso automático" : m.nombre || "Equipo")}</b>${m.tipo !== "auto" ? `<small>${esc(m.rol || "")}</small>` : ""}${m.para !== "todos" ? `<span class="rd-to">→ ${esc((DESTINOS.find(d => d[0] === m.para) || [, m.para])[1])}</span>` : ""}<time>${hm(m.ts)}</time></div>
        ${m.tipo === "voz" ? `<button type="button" class="rd-play" data-rplay="${esc(m.id)}">${ic("play")} Mensaje de voz · ${Math.round(m.dur || 0)} s</button>` : `<p>${m.tipo === "auto" ? ic("auto") + " " : ""}${esc(m.texto)}</p>`}</div>`;
    }).join("") || `<p class="rd-empty">Aún no hay mensajes hoy. Mantén presionado el micrófono para hablar.</p>`;
    panel.innerHTML = `
      <div class="rd-h"><div>${ic("radio")}<b>Radio del equipo</b></div><button type="button" class="rd-x" data-rclose aria-label="Cerrar">${ic("x")}</button></div>
      ${!CFG.nombre ? `<div class="rd-setup"><b>¿Quién eres?</b><p>Así el equipo sabe quién habla.</p>
        <input id="rdNom" placeholder="Tu nombre (ej. Dra. Carla)" value="${esc((USER && USER.email || "").split("@")[0])}">
        <div class="rd-roles">${ROLES.map(r => `<label><input type="radio" name="rdRol" value="${r}" ${r === CFG.rol ? "checked" : ""}><span>${r}</span></label>`).join("")}</div>
        <button type="button" class="btn btn-pri" data-rsave style="width:100%">Entrar a la radio</button></div>` : `
      <div class="rd-me"><span>${esc(CFG.nombre)} · <b>${esc(CFG.rol)}</b></span><button type="button" class="rd-link" data-redit>Cambiar</button></div>
      <button type="button" class="rd-sound ${CFG.activo && desbloqueado ? "on" : ""}" data-rsound>${CFG.activo && desbloqueado ? ic("vol") + " Radio activada · escuchas los mensajes" : ic("off") + " Toca aquí para activar el sonido"}</button>
      <div class="rd-ptt-wrap">
        <label class="rd-dest">Para: <select id="rdPara">${DESTINOS.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select></label>
        <button type="button" class="rd-ptt" id="rdPtt">${ic("mic")}<span>Mantén presionado para hablar</span></button>
        <small class="rd-hint" id="rdHint">Máximo ${MAX_SEG} segundos</small>
      </div>
      <div class="rd-quick">${RAPIDOS.map((q, i) => `<button type="button" data-rq="${i}">${ic(q.i)} ${q.t}</button>`).join("")}</div>
      <form class="rd-txt" id="rdTxt"><input id="rdTxtIn" placeholder="Escribir mensaje (se lee en voz alta)" maxlength="160"><button class="btn btn-pri btn-sm" aria-label="Enviar">${ic("send")}</button></form>
      <div class="rd-list">${lista}</div>
      <details class="rd-cfg"><summary>Avisos automáticos</summary>
        ${[["atencion", "Cuando termina una atención (y cuánto cobrar)"], ["citas", "Cuando llega una reserva por la web"], ["pagos", "Cuando se registra un pago"]].map(([k, t]) => `<label class="chk"><input type="checkbox" data-raviso="${k}" ${CFG.avisos[k] ? "checked" : ""}><span><b>${t}</b></span></label>`).join("")}
      </details>`}`;
    bindPtt();
  }
  function badge() { const b = $(".rd-badge", fab); b.textContent = sinLeer > 9 ? "9+" : sinLeer || ""; fab.classList.toggle("has", sinLeer > 0); }
  function abrir(v) { abierto = v; panel.classList.toggle("open", v); if (v) { sinLeer = 0; badge(); pintar(); desbloquear(); } }
  function aviso(m) { pop.innerHTML = `<b>${esc(m.tipo === "auto" ? "Aviso" : m.nombre)}</b> ${m.tipo === "voz" ? "🎙 mensaje de voz" : esc(m.texto)}`; pop.classList.add("show"); clearTimeout(aviso.t); aviso.t = setTimeout(() => pop.classList.remove("show"), 5000); }

  /* ---------- Sonido ---------- */
  let ctxA = null; const cola = []; let sonando = false;
  function desbloquear() {   // los navegadores solo dejan sonar audio después de un toque
    if (!CFG.activo) return;
    try { ctxA = ctxA || new (window.AudioContext || window.webkitAudioContext)(); ctxA.resume(); } catch (e) {}
    try { const u = new SpeechSynthesisUtterance(""); speechSynthesis.speak(u); } catch (e) {}
    desbloqueado = true;
  }
  function beep() { try { if (!ctxA) return; const o = ctxA.createOscillator(), g = ctxA.createGain(); o.frequency.value = 880; g.gain.value = .06; o.connect(g); g.connect(ctxA.destination); o.start(); o.frequency.setValueAtTime(1180, ctxA.currentTime + .09); o.stop(ctxA.currentTime + .18); } catch (e) {} }
  function vozES() { const vs = speechSynthesis.getVoices(); return vs.find(v => /^es[-_](PE|419|MX|US)/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang)) || null; }
  function sonar(m) { cola.push(m); if (!sonando) siguiente(); }
  function siguiente() {
    const m = cola.shift(); if (!m) { sonando = false; return; }
    sonando = true; beep();
    const fin = () => setTimeout(siguiente, 350);
    setTimeout(() => {
      if (m.tipo === "voz" && m.audio) { const a = new Audio(m.audio); a.onended = fin; a.onerror = fin; a.play().catch(fin); return; }
      try { const u = new SpeechSynthesisUtterance(m.tipo === "auto" ? m.texto : `${m.nombre} dice: ${m.texto}`); u.lang = "es-PE"; const v = vozES(); if (v) u.voice = v; u.rate = 1.02; u.onend = fin; u.onerror = fin; speechSynthesis.speak(u); setTimeout(() => { if (sonando && !speechSynthesis.speaking) fin(); }, 9000); }
      catch (e) { fin(); }
    }, 220);
  }
  function llega(m) {
    if (MSGS.some(x => x.id === m.id)) return;
    MSGS.push(m); MSGS.sort((a, b) => a.ts - b.ts);
    const nuevo = m.ts > INICIO - 2000, mio = m.dev === DEV, paraMi = m.para === "todos" || m.para === CFG.rol;
    if (nuevo && !mio && paraMi) {
      if (m.tipo === "auto" && m.aviso && CFG.avisos[m.aviso] === false) { if (abierto) pintar(); return; }
      aviso(m); if (CFG.activo && desbloqueado) sonar(m);
      if (!abierto) { sinLeer++; badge(); }
    }
    if (abierto) pintar();
  }
  const INICIO = Date.now();
  const enviar = (m) => safe(() => DB.radioEnviar({ dev: DEV, nombre: CFG.nombre || "Equipo", rol: CFG.rol, para: "todos", ...m }));
  // aviso local (solo en este equipo): reservas web que detecta cada panel
  const avisoLocal = (texto, aviso) => llega({ id: "l" + Date.now() + Math.random(), tipo: "auto", aviso, texto, para: "todos", ts: Date.now(), dev: "local" });

  /* ---------- Grabar (mantener presionado) ---------- */
  let rec = null, partes = [], t0 = 0, timer = null, stream = null;
  async function empezar() {
    if (rec) return;
    if (!navigator.mediaDevices || !window.MediaRecorder) return toast("Este navegador no permite grabar audio. Usa Chrome.", true);
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { return toast("Permite el uso del micrófono para hablar por la radio", true); }
    const tipo = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
    partes = []; rec = new MediaRecorder(stream, { ...(tipo ? { mimeType: tipo } : {}), audioBitsPerSecond: 24000 });
    rec.ondataavailable = e => e.data.size && partes.push(e.data);
    rec.onstop = enviarAudio;
    rec.start(); t0 = Date.now();
    $("#rdPtt")?.classList.add("rec");
    timer = setInterval(() => { const s = (Date.now() - t0) / 1000; const h = $("#rdHint"); if (h) h.textContent = `Grabando… ${Math.floor(s)} s · suelta para enviar`; if (s >= MAX_SEG) terminar(); }, 200);
  }
  function terminar() { if (!rec) return; clearInterval(timer); try { rec.stop(); } catch (e) {} stream && stream.getTracks().forEach(t => t.stop()); $("#rdPtt")?.classList.remove("rec"); }
  function enviarAudio() {
    const dur = (Date.now() - t0) / 1000, r = rec; rec = null; const h = $("#rdHint"); if (h) h.textContent = `Máximo ${MAX_SEG} segundos`;
    if (dur < .7) return toast("Mantén presionado mientras hablas");
    const blob = new Blob(partes, { type: r.mimeType || "audio/webm" });
    if (blob.size > 700000) return toast("El audio es muy largo", true);
    const fr = new FileReader(); fr.onload = () => { enviar({ tipo: "voz", audio: fr.result, dur, para: $("#rdPara")?.value || "todos" }); toast("Mensaje de voz enviado"); }; fr.readAsDataURL(blob);
  }
  function bindPtt() {
    const b = $("#rdPtt"); if (!b) return;
    b.addEventListener("pointerdown", e => { e.preventDefault(); b.setPointerCapture && b.setPointerCapture(e.pointerId); desbloquear(); empezar(); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => b.addEventListener(ev, () => terminar()));
    b.addEventListener("contextmenu", e => e.preventDefault());
  }

  /* ---------- Eventos de la interfaz ---------- */
  fab.addEventListener("click", () => abrir(!abierto));
  panel.addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.matches("[data-rclose]")) return abrir(false);
    if (t.matches("[data-rsave]")) { const n = $("#rdNom").value.trim(); if (!n) return toast("Escribe tu nombre", true); CFG.nombre = n; CFG.rol = ($("input[name=rdRol]:checked", panel) || {}).value || CFG.rol; CFG.activo = true; guardarCfg(); desbloquear(); return pintar(); }
    if (t.matches("[data-redit]")) { CFG.nombre = ""; guardarCfg(); return pintar(); }
    if (t.matches("[data-rsound]")) { CFG.activo = !(CFG.activo && desbloqueado); guardarCfg(); if (CFG.activo) { desbloquear(); beep(); } return pintar(); }
    if (t.dataset.rq != null) { const q = RAPIDOS[+t.dataset.rq]; const para = $("#rdPara").value !== "todos" ? $("#rdPara").value : q.d; enviar({ tipo: "rapido", texto: q.t, para }); return toast(`Enviado: ${q.t}`); }
    if (t.dataset.rplay) { const m = MSGS.find(x => x.id === t.dataset.rplay); if (m && m.audio) new Audio(m.audio).play().catch(() => toast("No se pudo reproducir", true)); }
  });
  panel.addEventListener("submit", e => { e.preventDefault(); const i = $("#rdTxtIn"); const v = i.value.trim(); if (!v) return; enviar({ tipo: "texto", texto: v, para: $("#rdPara").value }); i.value = ""; toast("Mensaje enviado"); });
  panel.addEventListener("change", e => { const k = e.target.dataset && e.target.dataset.raviso; if (k) { CFG.avisos[k] = e.target.checked; guardarCfg(); } });
  document.addEventListener("pointerdown", () => { if (CFG.activo && !desbloqueado) desbloquear(); }, { once: false, passive: true });

  /* ---------- Avisos automáticos ---------- */
  const pendientes = {};
  const _guardarCita = DB.guardarCita.bind(DB);
  DB.guardarCita = async function (id, data) {
    const r = await _guardarCita(id, data);
    if (data && data.estado === "atendida" && !pendientes[id]) {
      pendientes[id] = setTimeout(async () => {   // espera a que se registre el pago de la misma atención
        delete pendientes[id];
        try { const c = await DB.getDocX("citas", id); if (!c) return; const t = totalDe(c), saldo = Math.max(t - (+c.pagado || 0), 0);
          enviar({ tipo: "auto", aviso: "atencion", para: "todos", texto: `${c.mascota} terminó su atención${c.vet ? " con " + c.vet : ""}. ${saldo > 0 ? `Cobrar ${soles(saldo)} en caja.` : t > 0 ? "Ya está pagado." : "Revisar el precio en caja."}` });
        } catch (e) { console.warn(e); }
      }, 2500);
    }
    return r;
  };
  const _registrarPago = registrarPago;
  registrarPago = async function (c, monto, metodo, etiqueta) {   // eslint-disable-line no-global-assign
    const nc = await _registrarPago(c, monto, metodo, etiqueta);
    if (!pendientes[c.id]) enviar({ tipo: "auto", aviso: "pagos", para: "todos", texto: `Pago registrado: ${soles(monto)} de ${c.mascota} por ${metodo}.${pagoInfo(nc).saldo > 0 ? ` Queda saldo de ${soles(pagoInfo(nc).saldo)}.` : ""}` });
    return nc;
  };

  /* ---------- Arranque (cuando hay sesión) ---------- */
  function iniciar() {
    if (iniciado) return; iniciado = true;
    fab.classList.remove("hidden");
    DB.radioEscuchar(Date.now() - 12 * 3600e3, llega);
    DB.radioLimpiar && DB.radioLimpiar().catch(() => {});
    DB.citasNuevas && DB.citasNuevas(new Date().toISOString(), c => avisoLocal(`Nueva cita por la web: ${c.mascota}, ${c.servicio}, ${typeof largo === "function" ? largo(c.fecha) : c.fecha} a las ${c.hora}.`, "citas"));
    if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => {};
  }
  setInterval(() => { const on = typeof USER !== "undefined" && !!USER; if (on) iniciar(); fab.classList.toggle("hidden", !on); if (!on && abierto) abrir(false); }, 500);
  window.RADIO = { abrir, enviar, cfg: CFG };
})();
