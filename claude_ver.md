```javascript
async function geminiCall(history, systemPrompt, onChunk) {
  const rawKey = localStorage.getItem("tp_groq_key");
  if (!rawKey) throw new Error("No se encontró la API key. Reiniciar Conexión.");
  let API_KEY;
  try { API_KEY = decryptKey(rawKey); if (!API_KEY) throw new Error(); }
  catch { throw new Error("Protocolo de llave corrupto. Reconfigura tu acceso."); }

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
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages,
      max_tokens: 4096,
      temperature: 0.6,
      top_p: 0.9,
      stream: true
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    let msg = data?.error?.message || `Error HTTP ${res.status}`;
    if (msg.includes("Rate limit reached") && msg.includes("tokens per day")) {
      const timeMatch = msg.match(/try again in ([\w\d.]+)/i);
      const waitTime = timeMatch ? timeMatch[1] : "un momento";
      const humanTime = waitTime.replace('h', ' horas').replace('m', ' min').replace('s', ' seg');
      msg = `Límite diario excedido. El servidor requiere enfriamiento de subsistemas. Auto-reinicio en ${humanTime}.`;
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // Keep partial line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const dataStr = trimmed.slice(6);
      if (dataStr === "[DONE]") break;
      try {
        const json = JSON.parse(dataStr);
        const content = json.choices[0]?.delta?.content || "";
        if (content) {
          fullText += content;
          if (onChunk) onChunk(fullText);
        }
      } catch (e) {
        console.error("SSE Parse Error:", e);
      }
    }
  }

  if (!fullText) throw new Error("Fallo en flujo de datos. Sin respuesta.");
  return fullText;
}
```
