import { useState, useRef, useCallback, useEffect } from "react";

// ─── GROQ API CALL ───────────────────────────────────────────────────────────
async function geminiCall(history, systemPrompt) {
  const API_KEY = localStorage.getItem("tp_groq_key");

  if (!API_KEY) {
    throw new Error("No se encontró la API key. Recarga la página.");
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message || `Error HTTP ${res.status}`;
    throw new Error(msg);
  }

  const text = data?.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Sin respuesta. Intenta de nuevo.");
  return text;
}

// ─── SYSTEM PROMPT MAESTRO CONEXIÓN HUMANA ──────────────────────────────
const getSystemPrompt = (userGoal, userProfile = "") => `
Eres un Mentor experto con más de 20 años de experiencia, pero tu enfoque es el de un **compañero senior, empático y motivador**. Tu tono es profesional pero cercano, usando un lenguaje que inspire confianza sin ser rudo.

🎯 OBJETIVO DEL USUARIO: "${userGoal}"
${userProfile ? `👤 PERFIL DEL USUARIO: ${userProfile}` : ""}

---

🛡️ PASO 0: BUCLE DE VALIDACIÓN Y CONEXIÓN (PUERTA DE ENTRADA)
Analiza el "${userGoal}" y actúa estrictamente bajo este bucle lógico:

1. FILTRO DE REALIDAD Y OBJETIVOS INVÁLIDOS:
   - CRITERIO: Si el objetivo es solo un saludo ("hola"), es demasiado vago ("quiero aprender algo"), es un concepto no profesional ("ser feliz", "magia"), o no existe como disciplina técnica.
   - ACCIÓN: Responde con calidez: "¡Hola! Qué alegría saludarte. Soy tu Mentor de carrera y estoy aquí para ayudarte a llegar a la cima. Sin embargo, para poder trazarte un plan de éxito, necesito que aterricemos una meta profesional o técnica concreta (ej. 'Programación', 'Ciberseguridad', 'Diseño UI')."
   - RESTRICCIÓN: No presentes el mapa de carrera ni hagas el cuestionario. Cierra siempre con la Regla de Cierre.

2. SI EL USUARIO HACE PREGUNTAS GENERALES:
   - ACCIÓN: Eres un tutor, enseña con gusto de forma didáctica. Resuelve su duda de forma conversacional.
   - RESTRICCIÓN: Al terminar de explicar, cierra siempre con la Regla de Cierre.

3. REGLA DE CIERRE OBLIGATORIO (EL "GANCHO"):
   - Mientras el usuario NO haya definido un objetivo válido, CUALQUIER respuesta debe terminar EXACTAMENTE así:
   "¡Me encantaría empezar! Pero para serte útil de verdad, dime: ¿Cómo te llamas? y ¿Cuál es ese objetivo profesional o técnico que quieres conquistar?"

4. SI EL OBJETIVO ES VÁLIDO:
   - ACCIÓN: Tu respuesta DEBE empezar con esta línea exacta:
     META_VALIDADA: [Escribe aquí el nombre de la meta técnica, ej: Desarrollador Frontend]
   - Luego, adopta tu nombre de Mentor (ej. CloudMentor) y salta a la sección "🚀 PRIMER MENSAJE".

---

## 🎭 IDENTIDAD Y FILOSOFÍA
Una vez validado el objetivo, eres un chat conversacional activo. Guías en DOS GRANDES FASES (Fundamentos y Especialización). Si hay dudas, las resuelves antes de seguir. ¡No eres un robot! Debate, explica y luego retoma la ruta.

---

## 📌 LAS 18 REGLAS DE ORO (RIGOR CON EMPATÍA)

1. **PROGRESIÓN BLOQUEADA:** Celebra los logros, pero mantén el orden. No desbloquees la siguiente tanda hasta que el usuario confirme haber terminado la actual.
2. **FORMATO DE RECOMENDACIÓN:** Es OBLIGATORIO usar la estructura visual con emojis detallada en la sección "FORMATO EXACTO" más abajo.
3. **PRIORIDAD GRATUITA:** Cuida el bolsillo del usuario. Solo recomienda pagos si son una inversión transformadora.
4. **ORDEN LÓGICO:** Construye cimientos sólidos. No dejes que el usuario se abrume con temas avanzados sin saber lo básico.
5. **REGISTRO DE PROGRESO VISIBLE:** Al inicio de cada tanda, muestra un resumen visual:
   - Fase/Etapa | Paths ✅/🔄/🔒 | Certificaciones 🏆 | Nivel de Habilidad 💻.
6. **FOCO EN FASE A:** Asegúrate de que domine las bases antes de hablar de "especialidades".
7. **TRANSICIÓN DE HITOS:** Haz que el paso a la FASE B se sienta como una graduación. Explica el salto de nivel.
8. **ESTRATEGIA DE MERCADO:** Recomienda tecnologías que realmente se pidan hoy en las empresas.
9. **HONESTIDAD Y PRERREQUISITOS:** Si algo es difícil, dilo con cariño: "Antes de esto, necesitamos reforzar X para que no te frustres".
10. **PATHS ESTRUCTURADOS:** Prioriza rutas completas oficiales. Si recomiendas un curso suelto, trátalo con el mismo seguimiento formal.
11. **APRENDIZAJE DE ERRORES:** Si fallas, admítelo con humildad usando el bloque:
    ⚠️ ERROR REGISTRADO
    ─────────────────────────────
    ❌ Lo que hice mal | 🔍 Por qué pasó | ✅ Cómo lo corregiré ahora.
12. **CERTIFICACIONES PROACTIVAS:** Sugiere exámenes de la industria con el bloque 🏆 CERTIFICACIÓN RECOMENDADA cuando lo veas listo.
13. **EVIDENCIA PRÁCTICA (PORTAFOLIO):** Motívalo a crear usando el bloque 📁 EVIDENCIA A CONSTRUIR. "Si no se ve, no existe".
14. **IA Y AUTOMATIZACIÓN:** Enséñale a usar la IA como aliado con el bloque 🤖 HABILIDAD DE IA.
15. **SUBIDA DE NIVEL TÉCNICO:** Identifica la habilidad reina (ej. Scripting) y usa el bloque 💻 MOMENTO DE SUBIR NIVEL.
16. **MENTALIDAD ANALÍTICA:** A partir de la Etapa 2, plantea retos con el bloque 🧠 EJERCICIO DE MENTALIDAD ANALÍTICA.
17. **PANORAMA LABORAL:** Al final de cada etapa, dale un baño de realidad optimista con el bloque 💼 PANORAMA LABORAL.
18. **CAPACIDAD CONVERSACIONAL:** ¡No eres un robot! Si el usuario te pregunta "No entiendo qué es una API", detente, responde con detalle, debate con él y, cuando la duda esté resuelta, retoma la hoja de ruta.

---

## 💬 FORMATO EXACTO Y OBLIGATORIO PARA RUTAS
Para que la interfaz gráfica del usuario funcione, **CADA VEZ** que recomiendes una tanda de estudio, debes usar **ESTRICTAMENTE** esta estructura visual con estos emojis exactos:

🧭 FASE ACTUAL: [Nombre]
📍 ETAPA ACTUAL: [Nombre]
🎯 OBJETIVO DE ESTA TANDA: [Habilidades]

PATH 1 — [Nombre exacto y oficial del curso/ruta]
  🏠 Plataforma: [Nombre]
  💰 Costo: [Gratuito / Precio]
  ⏱️ Tiempo estimado: [Horas]
  📊 Nivel: [Principiante/Intermedio/Avanzado]
  🧠 Por qué ahora: [Justificación pedagógica clave]

*(Repite el formato de PATH para cada recomendación de la tanda)*

⚠️ Completa estos paths en orden. Confirma cuando termines para desbloquear tu siguiente meta.

---
*(Usa también los bloques 🏆 CERTIFICACIÓN RECOMENDADA, 📁 EVIDENCIA A CONSTRUIR, 🤖 HABILIDAD DE IA y 🧠 EJERCICIO DE MENTALIDAD cuando corresponda, respetando siempre los emojis iniciales).*
---

## 🚀 PRIMER MENSAJE (Solo tras validar objetivo)
1. Saluda cálidamente (usa su nombre si ya lo dio).
2. Presenta el MAPA COMPLETO. Define qué hitos técnicos separan la Fase A de la Fase B para este camino específico.
3. Haz el cuestionario de personalización, pero **SOLO pregunta lo que el usuario aún no haya mencionado**.
No generes la primera tanda sin conocer estas respuestas.
`;

// ─── ÁREAS DISPONIBLES ────────────────────────────────────────────────────────
const AREAS = [
  { key: "cyber",      icon: "🛡️", label: "Ciberseguridad",   color: "0,220,120",   goal: "Quiero ser analista de ciberseguridad SOC y especializarme en Blue Team" },
  { key: "frontend",   icon: "⚛️", label: "Front-end Dev",     color: "97,218,251",  goal: "Quiero ser desarrollador front-end, dominar React y el ecosistema moderno" },
  { key: "devops",     icon: "⚙️", label: "DevOps / SRE",            color: "255,160,50",  goal: "Quiero trabajar en DevOps, aprender CI/CD, Kubernetes y cultura SRE" },
  { key: "networking", icon: "🌐", label: "Redes",       color: "50,160,255",  goal: "Quiero certificarme en redes, empezar con CCNA y llegar a Network Engineer" },
  { key: "sysadmin",   icon: "🖥️", label: "Sysadmin / Linux",         color: "255,200,50",  goal: "Quiero ser administrador de sistemas Linux y gestionar servidores" },
  { key: "ai",         icon: "🤖", label: "IA / Machine Learning",    color: "180,100,255", goal: "Quiero aprender IA y machine learning, desde Python hasta modelos" },
  { key: "cloud",      icon: "☁️", label: "Cloud Engineer",           color: "100,190,255", goal: "Quiero ser Cloud Engineer, certificarme en AWS y gestionar nube" },
  { key: "backend",    icon: "🗄️", label: "Backend / APIs",           color: "255,100,150", goal: "Quiero ser desarrollador backend y construir APIs robustas" },
  { key: "mobile",     icon: "📱", label: "Mobile Dev",         color: "255,140,80",  goal: "Quiero desarrollar apps móviles, aprender React Native o Flutter" },
  { key: "pentest",    icon: "🔐", label: "Pentesting",    color: "255,80,80",   goal: "Quiero ser pentester, aprender hacking ético y CTFs" },
];

const DEFAULT_PHASES = [
  "Etapa 1 — Fundamentos",
  "Etapa 2 — Intermedio",
  "Etapa 3 — Avanzado",
  "Etapa 4 — Profesional",
  "Etapa 5 — Especialización",
];

// ─── MARKDOWN RENDERER ───────────────────────────────────────────────────────
function MD({ text, ac }) {
  if (!text) return null;
  return (
    <div>
      {text.split("\n").map((line, i) => {
        if (/^━{3,}$|^─{3,}$/.test(line.trim()))
          return <hr key={i} style={{ border: "none", borderTop: `1px solid rgba(${ac},.18)`, margin: "8px 0" }} />;
        if (line.startsWith("## "))
          return <div key={i} style={{ color: `rgb(${ac})`, fontSize: 11, fontFamily: "monospace", fontWeight: 700, margin: "14px 0 5px", letterSpacing: 1, textTransform: "uppercase" }}>{line.slice(3)}</div>;
        if (/^(PATH \d|🧭|📍|🎯|🏆|📁|🤖|💻|🧠|💼|⚠️|🗺️|📋|FASE)/.test(line.trim()) && line.trim())
          return <div key={i} style={{ margin: "8px 0 3px", fontWeight: 600, color: "rgba(240,255,248,.95)", fontSize: 13 }}>{fmt(line, ac)}</div>;
        if (line.startsWith("  ") && line.trim())
          return <div key={i} style={{ paddingLeft: 14, borderLeft: `2px solid rgba(${ac},.22)`, margin: "2px 0 2px 6px", color: "rgba(180,218,200,.72)", fontSize: 12.5 }}>{fmt(line.trim(), ac)}</div>;
        if (/^[-*→] /.test(line))
          return (
            <div key={i} style={{ display: "flex", gap: 7, margin: "2px 0", paddingLeft: 4 }}>
              <span style={{ color: `rgb(${ac})`, fontSize: 9, marginTop: 5, flexShrink: 0 }}>▸</span>
              <span style={{ fontSize: 13, color: "rgba(190,220,206,.8)", lineHeight: 1.6 }}>{fmt(line.slice(2), ac)}</span>
            </div>
          );
        if (!line.trim()) return <div key={i} style={{ height: 5 }} />;
        return <p key={i} style={{ margin: "2px 0", fontSize: 13, lineHeight: 1.7, color: "rgba(200,225,212,.83)" }}>{fmt(line, ac)}</p>;
      })}
    </div>
  );
}

function fmt(text, ac) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} style={{ color: "rgba(240,255,248,1)", fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} style={{ fontFamily: "monospace", fontSize: 11, background: `rgba(${ac},.1)`, color: `rgb(${ac})`, padding: "1px 5px", borderRadius: 3 }}>{p.slice(1, -1)}</code>;
    return p;
  });
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  // ── ESTADOS DE LA API KEY ──
  const [keyInput,   setKeyInput]   = useState("");
  const [keyError,   setKeyError]   = useState("");
  const [keyLoading, setKeyLoading] = useState(false);
  const keyRef = useRef(null);

  // ── ESTADOS DE GESTIÓN DE CHATS (SLOTS) ──
  const [savedChats, setSavedChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  // Determina la pantalla inicial
  const [screen, setScreen] = useState(() => {
    if (!localStorage.getItem("tp_groq_key")) return "apikey";
    return "mainmenu"; 
  });

  // ── ESTADOS DEL CHAT ACTUAL ──
  const [area,        setArea]        = useState(null);
  const [ac,          setAc]          = useState("0,220,120");
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [sideOpen,    setSideOpen]    = useState(false);
  const [mentorName,  setMentorName]  = useState("TechPathAI");
  const [goalText,    setGoalText]    = useState("");
  const [customGoal,  setCustomGoal]  = useState("");

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const scrollBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);

  // ── EFECTO: Cargar chats guardados al inicio ──
  useEffect(() => {
    const chats = localStorage.getItem("tp_saved_chats");
    if (chats) {
      setSavedChats(JSON.parse(chats));
    }
  }, []);

  // ── EFECTO: Guardar chats automáticamente cuando cambian ──
  useEffect(() => {
    if (screen !== "apikey") {
      localStorage.setItem("tp_saved_chats", JSON.stringify(savedChats));
    }
  }, [savedChats, screen]);

  // ── EFECTO: Foco en input de API Key ──
  useEffect(() => {
    if (screen === "apikey") keyRef.current?.focus();
  }, [screen]);

  // ── FUNCIÓN: Guardar y Validar API Key ──
  const saveKey = useCallback(async () => {
    const k = keyInput.trim();
    if (!k) return;
    setKeyLoading(true);
    setKeyError("");
    try {
      localStorage.setItem("tp_groq_key", k);
      await geminiCall(
        [{ role: "user", content: "Responde solo: OK" }],
        "Eres un asistente. Responde solo la palabra OK."
      );
      setScreen("mainmenu");
    } catch (e) {
      localStorage.removeItem("tp_groq_key");
      setKeyError("Key inválida. Verifica que empiece con gsk_ y vuelve a intentarlo.");
    } finally {
      setKeyLoading(false);
    }
  }, [keyInput]);

  // ── FUNCIÓN: Cargar un chat existente ──
  const loadChat = useCallback((chatId) => {
    const chat = savedChats.find(c => c.id === chatId);
    if (!chat) return;

    setCurrentChatId(chat.id);
    setArea(chat.area);
    setAc(chat.ac);
    setMessages(chat.messages);
    setMentorName(chat.mentorName);
    setGoalText(chat.goalText);
    setScreen("chat");
    setSideOpen(false);
    scrollBottom();
  }, [savedChats]);

  // ── FUNCIÓN: Crear un nuevo chat (Slot) ──
  const createNewChat = useCallback(() => {
    if (savedChats.length >= 3) {
      alert("⚠️ Has alcanzado el límite de 3 rutas guardadas. Elimina una para empezar otra.");
      return;
    }
    setCurrentChatId(null);
    setMessages([]);
    setArea(null);
    setAc("0,220,120");
    setCustomGoal("");
    setScreen("welcome");
  }, [savedChats.length]);

  // ── FUNCIÓN: Eliminar un chat ──
  const deleteChat = useCallback((chatId, e) => {
    e.stopPropagation(); 
    if (window.confirm("¿Estás seguro de que quieres eliminar esta ruta para siempre?")) {
      setSavedChats(prev => prev.filter(c => c.id !== chatId));
      if (currentChatId === chatId) {
        setScreen("mainmenu");
        setCurrentChatId(null);
      }
    }
  }, [currentChatId]);

  // ── FUNCIÓN: Iniciar nueva ruta ──
  const startArea = useCallback(async (selectedArea, customText = "") => {
    const goal = customText || selectedArea.goal;
    
    const newChatId = Date.now().toString();
    const newChatObject = {
      id: newChatId,
      area: selectedArea,
      ac: selectedArea.color,
      goalText: goal,
      mentorName: "TechPathAI",
      messages: [],
      createdAt: new Date().toISOString()
    };

    setError("");
    setLoading(true);
    setArea(selectedArea);
    setAc(selectedArea.color);
    setGoalText(goal);
    setMessages([]);
    setMentorName("TechPathAI");
    setCurrentChatId(newChatId);
    setScreen("chat");

    try {
      const res = await geminiCall([{ role: "user", content: goal }], getSystemPrompt(goal));
      
      // Lógica de detección:
      let finalMsg = res;
      let newGoal = goal;
      let newMentor = "TechPathAI";

      if (res.includes("META_VALIDADA:")) {
        const matchMeta = res.match(/META_VALIDADA:\s*(.*)/i);
        if (matchMeta) newGoal = matchMeta[1].split('\n')[0].trim();
        finalMsg = res.replace(/META_VALIDADA:.*\n?/, "").trim();
        
        const matchMentor = finalMsg.match(/soy\s+(\w*[Mm]entor\w*|\w*[Cc]oach\w*)/i);
        if (matchMentor) newMentor = matchMentor[1];
      }

      setMentorName(newMentor);
      setGoalText(newGoal);
      const initialMessages = [{ role: "assistant", content: finalMsg }];
      setMessages(initialMessages);

      setSavedChats(prev => [{ ...newChatObject, mentorName: newMentor, goalText: newGoal, messages: initialMessages }, ...prev]);
    }  catch (e) {
      setError(e.message);
      const errorMsg = [{ role: "assistant", content: `⚠️ Error: ${e.message}` }];
      setMessages(errorMsg);
      setSavedChats(prev => [{ ...newChatObject, messages: errorMsg }, ...prev]);
    } finally {
      setLoading(false);
      scrollBottom();
    }
  }, []);

  // ── FUNCIÓN: Enviar mensaje ──
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    scrollBottom();

    setSavedChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: next } : c));

    try {
      const res = await geminiCall(next, getSystemPrompt(goalText));
      
      let finalMsg = res;
      let newMentor = mentorName;
      let newGoal = goalText;

      if (res.includes("META_VALIDADA:")) {
        const matchMeta = res.match(/META_VALIDADA:\s*(.*)/i);
        if (matchMeta) newGoal = matchMeta[1].split('\n')[0].trim();
        finalMsg = res.replace(/META_VALIDADA:.*\n?/, "").trim();
        
        const matchMentor = finalMsg.match(/soy\s+(\w*[Mm]entor\w*|\w*[Cc]oach\w*)/i);
        if (matchMentor) newMentor = matchMentor[1];
      }

      const updatedMessages = [...next, { role: "assistant", content: finalMsg }];
      setMessages(updatedMessages);
      setMentorName(newMentor);
      setGoalText(newGoal);

      setSavedChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: updatedMessages, mentorName: newMentor, goalText: newGoal } : c));
    } catch (e) {
      setError(e.message);
      const finalMessages = [...next, { role: "assistant", content: `⚠️ ${e.message}` }];
      setMessages(finalMessages);
      setSavedChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: finalMessages } : c));
    } finally {
      setLoading(false);
      scrollBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages, goalText, currentChatId, mentorName]);

  // ── PANTALLA: API KEY ──
  if (screen === "apikey") return (
    <div style={{ minHeight: "100vh", background: "#04090b", fontFamily: "'Outfit',sans-serif", color: "#c8dfd4", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{CSS}</style>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 36 }} className="tp-float">⬡</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: "#00dc78", margin: 0, letterSpacing: 1 }}>TechPath</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.3)", margin: 0 }}>AI Career Mentor</p>
        </div>
        <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 6px", fontFamily: "monospace" }}>Ingresa tu API Key de Groq</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.32)", margin: 0, lineHeight: 1.6 }}>TechPath usa tu propia key. Es gratuita y se guarda solo en tu navegador.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,.25)", letterSpacing: 1 }}>API KEY DE GROQ</label>
            <input ref={keyRef} type="password" style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${keyError ? "rgba(255,80,80,.4)" : "rgba(255,255,255,.1)"}`, borderRadius: 10, padding: "12px 14px", color: "#e8f4ec", fontSize: 14, fontFamily: "monospace", outline: "none", letterSpacing: 1, transition: "border .2s" }} value={keyInput} onChange={(e) => { setKeyInput(e.target.value); setKeyError(""); }} onKeyDown={(e) => e.key === "Enter" && saveKey()} placeholder="gsk_..." disabled={keyLoading} />
            {keyError && <p style={{ fontSize: 12, color: "#ff8080", margin: 0, lineHeight: 1.5 }}>{keyError}</p>}
          </div>
          <button onClick={saveKey} disabled={!keyInput.trim() || keyLoading} style={{ padding: "13px", borderRadius: 11, border: "none", background: !keyInput.trim() || keyLoading ? "rgba(255,255,255,.05)" : "linear-gradient(135deg,#00dc78,#00aa55)", color: !keyInput.trim() || keyLoading ? "rgba(255,255,255,.2)" : "#030a06", cursor: !keyInput.trim() || keyLoading ? "default" : "pointer", fontSize: 14, fontWeight: 700, fontFamily: "monospace", transition: "all .2s" }}>
            {keyLoading ? "Verificando..." : "Acceder →"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── PANTALLA: MENÚ PRINCIPAL ──
  if (screen === "mainmenu") return (
    <div style={{ minHeight: "100vh", background: "#04090b", fontFamily: "'Outfit',sans-serif", color: "#c8dfd4", display: "flex", flexDirection: "column" }}>
      <style>{CSS}</style>
      <header style={{ width: "100%", padding: "15px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20, color: "#00dc78" }}>⬡</span>
        <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "monospace", color: "#00dc78", letterSpacing: 1 }}>TechPath</span>
      </header>
      <div style={{ width: "100%", maxWidth: 800, margin: "0 auto", padding: "40px 20px 60px", display: "flex", flexDirection: "column", gap: 35 }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
          <h1 style={{ fontSize: "clamp(24px,6vw,36px)", fontWeight: 800, fontFamily: "monospace", color: "#fff", margin: 0 }}>¿Qué quieres hacer hoy?</h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", margin: 0 }}>Continúa una ruta existente o empieza una nueva aventura técnica.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,.3)", letterSpacing: 2, fontWeight: 700, margin: 0 }}>TUS HOJAS DE RUTA</h2>
            <span style={{ fontSize: 11, color: savedChats.length >= 3 ? "#ff8080" : "rgba(255,255,255,.2)", fontWeight: 600, fontFamily: "monospace" }}>{savedChats.length} / 3 slots usados</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 15 }}>
            {savedChats.map((chat) => (
              <div key={chat.id} onClick={() => loadChat(chat.id)} style={{ background: "rgba(255,255,255,.02)", border: `1px solid rgba(${chat.ac},.12)`, borderRadius: 16, padding: "20px", display: "flex", flexDirecton: "column", gap: 12, cursor: "pointer", transition: "all .2s", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{chat.area.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{chat.mentorName}</div>
                    <div style={{ fontSize: 11, color: `rgb(${chat.ac})`, fontFamily: "monospace" }}>{chat.area.label}</div>
                  </div>
                  <button onClick={(e) => deleteChat(chat.id, e)} style={{ background: "none", border: "none", color: "rgba(255,80,80,.4)", cursor: "pointer", fontSize: 14, padding: 5 }}>✕</button>
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.4)", lineHeight: 1.5, margin: "5px 0 0", fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>"{chat.goalText}"</p>
              </div>
            ))}
            {savedChats.length < 3 && (
              <button onClick={createNewChat} style={{ background: "transparent", border: "2px dashed rgba(255,255,255,.07)", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "rgba(255,255,255,.2)", cursor: "pointer", minHeight: 140 }}>
                <span style={{ fontSize: 26 }}>⊕</span>
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace" }}>Nueva Ruta</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ── PANTALLA: BIENVENIDA / CREAR ──
  if (screen === "welcome") return (
    <div style={{ minHeight: "100vh", background: "#04090b", fontFamily: "'Outfit',sans-serif", color: "#c8dfd4", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{CSS}</style>
      <header style={{ width: "100%", padding: "15px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setScreen("mainmenu")} style={{ background: "none", border: "none", color: "rgba(255,255,255,.3)", cursor: "pointer", fontSize: 16 }}>←</button>
        <span style={{ fontSize: 20, color: "#00dc78" }}>⬡</span>
        <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "monospace", color: "#00dc78", letterSpacing: 1 }}>TechPath</span>
      </header>
      <div style={{ width: "100%", maxWidth: 660, padding: "34px 18px 60px", display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 38 }} className="tp-float">🎯</div>
          <h1 style={{ fontSize: "clamp(20px,5vw,30px)", fontWeight: 800, fontFamily: "monospace", color: "#fff", margin: 0 }}>Crear nueva ruta</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", margin: "0 auto", lineHeight: 1.65, maxWidth: 440 }}>Describe tu objetivo técnico. Te asignaré un mentor con hoja de ruta completa.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <textarea rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "13px 15px", color: "#e8f4ec", fontSize: 14, outline: "none", resize: "none" }} value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} placeholder="Ej: Quiero ser pentester y aprender hacking ético..." />
          <button onClick={() => startArea({ key: "custom", icon: "🎯", label: "Personalizado", color: "0,220,120" }, customGoal.trim())} disabled={!customGoal.trim()} style={{ padding: "13px", borderRadius: 12, border: "none", background: customGoal.trim() ? "linear-gradient(135deg,#00dc78,#00aa55)" : "rgba(255,255,255,0.05)", color: customGoal.trim() ? "#030a06" : "rgba(255,255,255,.2)", cursor: "pointer", fontWeight: 700, fontFamily: "monospace" }}>Crear mi ruta →</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} /><span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", fontFamily: "monospace" }}>O ELIGE UN ÁREA</span><div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 9 }}>
          {AREAS.map((a) => (
            <button key={a.key} onClick={() => startArea(a)} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 12px", borderRadius: 13, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", cursor: "pointer", color: "inherit" }}>
              <span style={{ fontSize: 24 }}>{a.icon}</span>
              <div><div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{a.label}</div><div style={{ fontSize: 10, color: `rgba(${a.color},.7)`, marginTop: 3, fontFamily: "monospace" }}>Crear →</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── PANTALLA: CHAT ──
  return (
    <div style={{ height: "100vh", background: "#030a06", fontFamily: "'Outfit',sans-serif", color: "#c8dfd4", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <style>{CSS}</style>

      {sideOpen && <div onClick={() => setSideOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.62)", zIndex: 40, backdropFilter: "blur(3px)" }} />}

      <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 230, background: "#040e07", borderRight: `1px solid rgba(${ac},.13)`, display: "flex", flexDirection: "column", zIndex: 50, transition: "transform .27s cubic-bezier(.4,0,.2,1)", transform: sideOpen ? "translateX(0)" : "translateX(-100%)", overflowY: "auto" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 14px 13px", borderBottom: `1px solid rgba(${ac},.08)` }}>
          <span style={{ fontSize: 18, color: `rgb(${ac})` }}>{area?.icon || "⬡"}</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: `rgb(${ac})`, letterSpacing: 1 }}>{mentorName}</span>
          <button onClick={() => setSideOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,.22)", fontSize: 15 }}>✕</button>
        </div>

        <div style={{ padding: "12px 14px", borderBottom: `1px solid rgba(${ac},.07)` }}>
          <button onClick={() => setScreen("mainmenu")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,.05)", background: "rgba(255,255,255,.03)", color: "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            <span>🧭</span> Menú Principal
          </button>
        </div>

        <div style={{ padding: "13px 14px", borderBottom: `1px solid rgba(${ac},.07)` }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,.15)", letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>HOJA DE RUTA</div>
          {DEFAULT_PHASES.map((ph, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 7, marginBottom: 3, border: `1px solid ${i === 0 ? `rgba(${ac},.2)` : "transparent"}`, background: i === 0 ? `rgba(${ac},.05)` : "transparent" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? `rgb(${ac})` : `rgba(${ac},.12)`, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: i === 0 ? "rgba(255,255,255,.82)" : "rgba(255,255,255,.14)", flex: 1, fontWeight: i === 0 ? 600 : 400 }}>{ph}</span>
              {i > 0 && <span>🔒</span>}
            </div>
          ))}
        </div>

        <div style={{ padding: "13px 14px", borderBottom: `1px solid rgba(${ac},.07)` }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,.15)", letterSpacing: 2, fontWeight: 700, marginBottom: 9 }}>PROGRESO</div>
          {[["Paths completados", "0", `rgb(${ac})`], ["En curso", "0", "#ffa502"], ["Certificaciones", "0 🏆", "#7ee8fa"]].map(([l, v, c]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.2)" }}>{l}</span>
              <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: c }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "13px 14px" }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,.15)", letterSpacing: 2, fontWeight: 700, marginBottom: 7 }}>TU OBJETIVO PRINCIPAL</div>
          <p style={{ 
            fontSize: 11, 
            color: mentorName === "TechPathAI" ? "rgba(255,80,80,.4)" : "rgba(255,255,255,.28)", 
            lineHeight: 1.55, 
            margin: 0, 
            fontStyle: "italic",
            textTransform: mentorName === "TechPathAI" ? "uppercase" : "none"
          }}>
            {mentorName === "TechPathAI" ? "⚠ Indefinido" : goalText}
          </p>
        </div>
      </aside>

      <header style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", borderBottom: `1px solid rgba(${ac},.1)`, background: "rgba(3,10,6,.97)", flexShrink: 0, zIndex: 10 }}>
        <button onClick={() => setSideOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: "5px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ display: "block", width: 17, height: 2, background: `rgb(${ac})` }} />
          <span style={{ display: "block", width: 17, height: 2, background: `rgb(${ac})` }} />
          <span style={{ display: "block", width: 17, height: 2, background: `rgb(${ac})` }} />
        </button>
        <span style={{ fontSize: 16, color: `rgb(${ac})` }}>{area?.icon || "⬡"}</span>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: `rgb(${ac})`, letterSpacing: 1, flex: 1 }}>{mentorName}</span>
        <span style={{ fontSize: 9, fontFamily: "monospace", fontWeight: 700, color: `rgb(${ac})`, background: `rgba(${ac},.08)`, border: `1px solid rgba(${ac},.22)`, padding: "3px 9px", borderRadius: 20 }}>ETAPA 1</span>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: loading ? "#ffa502" : `rgb(${ac})` }} />
      </header>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 13 }}>
        {loading && messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, opacity: .7, marginTop: "20%" }}>
            <div style={{ fontSize: 32, color: `rgb(${ac})`, animation: "tp-pulse 1.5s infinite" }}>⬡</div>
            <div style={{ fontSize: 13, fontFamily: "monospace", color: `rgb(${ac})` }}>Preparando tu mentor...</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className="tp-msg" style={{ display: "flex", gap: 8, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && <div style={{ width: 27, height: 27, borderRadius: 7, background: `rgba(${ac},.08)`, border: `1px solid rgba(${ac},.22)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: `rgb(${ac})`, flexShrink: 0 }}>{area?.icon || "⬡"}</div>}
            <div style={m.role === "user" ? { maxWidth: "76%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", borderRadius: "12px 3px 12px 12px", padding: "10px 13px", fontSize: 13, color: "rgba(255,255,255,.78)" } : { maxWidth: "88%", background: "rgba(4,18,9,.97)", border: `1px solid rgba(${ac},.1)`, borderRadius: "3px 12px 12px 12px", padding: "12px 14px" }}>
              {m.role === "user" ? m.content : <MD text={m.content} ac={ac} />}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <div style={{ padding: "9px 15px", background: "rgba(255,80,80,.08)", borderTop: "1px solid rgba(255,80,80,.2)", fontSize: 12, color: "#ff8080" }}>⚠️ {error}</div>}

      <div style={{ padding: "11px 14px 13px", borderTop: `1px solid rgba(${ac},.08)`, background: "rgba(3,10,6,.98)" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <textarea ref={inputRef} rows={1} style={{ flex: 1, background: "rgba(4,16,8,.95)", border: `1px solid rgba(${ac},.14)`, borderRadius: 10, padding: "11px 13px", color: "#c8dfd4", outline: "none", resize: "none" }} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={loading ? "Esperando..." : "Escribe..."} disabled={loading} />
          <button onClick={send} disabled={loading || !input.trim()} style={{ padding: "11px 15px", borderRadius: 10, border: `1px solid rgba(${ac},.25)`, background: `rgba(${ac},.09)`, color: `rgb(${ac})`, cursor: "pointer", fontWeight: 700 }}>▶</button>
        </div>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #04090b; }
  @keyframes tp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes tp-pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
  .tp-float { animation: tp-float 3s ease-in-out infinite; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.07); border-radius: 2px; }
`;