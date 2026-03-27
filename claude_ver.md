### State Variables (keyInput, keyLoading, keyError)
```javascript
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");
  const [keyLoading, setKeyLoading] = useState(false);
```

### saveKey function
```javascript
  const saveKey = async () => {
    const k = keyInput.trim();
    if (!k) return;
    setKeyLoading(true); setKeyError("");
    try {
      localStorage.setItem("tp_groq_key", CryptoJS.AES.encrypt(k, SECRET_KEY).toString());
      await geminiCall([{ role: "user", content: "OK" }], "Responde solo OK");
      setScreen("landing");
    } catch {
      localStorage.removeItem("tp_groq_key");
      setKeyError("Autorización denegada. Llave inválida.");
    } finally {
      setKeyLoading(false);
    }
  };
```

### screen === "apikey" render block
```javascript
    if (screen === "apikey") return (
      <div style={{ ...sContainer, justifyContent: "center", alignItems: "center" }}>
        <div style={{ ...sGlass, padding: isMobile ? '24px 16px' : '40px', maxWidth: '450px', width: isMobile ? '90%' : '100%', position: 'relative' }}>
          <button
            onClick={() => { setScreen("splash"); setKeyInput(""); setKeyError(""); }}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'var(--mono)',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              zIndex: 10
            }}
            onMouseOver={(e) => { e.target.style.color = '#ff4444'; e.target.style.textShadow = '0 0 10px #ff4444'; }}
            onMouseOut={(e) => { e.target.style.color = 'rgba(255,255,255,0.4)'; e.target.style.textShadow = 'none'; }}
            aria-label="Cerrar configuración"
          >
            X
          </button>
          <h2 style={{ fontFamily: "var(--heading)", color: "var(--accent)", margin: "0 0 20px", textTransform: "uppercase" }}>[Auth_Required]</h2>
          <ol style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'rgba(255,255,255,0.6)', paddingLeft: '20px', lineHeight: '1.8', margin: '0 0 24px 0' }}>
            <li>
              Entra a la Consola de Groq Keys.
              <div style={{ marginTop: '5px', opacity: 0.8 }}>
                Obtén tu key aquí: <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)', textDecoration: 'none', textShadow: '0 0 8px var(--cyan)', fontWeight: 600 }}>groq.com/keys</a>
              </div>
            </li>
            <li>Genera o copia tu clave API.</li>
            <li>Pégala en el campo de abajo.</li>
          </ol>
          <input ref={keyRef} type="password" style={{ ...sInput, marginBottom: "8px", fontSize: '16px' }} value={keyInput} onChange={(e) => { setKeyInput(e.target.value); setKeyError(""); }} placeholder="gsk_..." onKeyDown={(e) => e.key === "Enter" && saveKey()} disabled={keyLoading} aria-label="Entrada de API Key" />
          <p style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: '#ff4444', marginBottom: '20px', opacity: 0.8 }}>
            ⚠ Tu clave se almacena localmente en tu navegador. No uses esta app en computadoras compartidas.
          </p>
          {keyError && <p style={{ color: "red", fontFamily: "var(--mono)", fontSize: "12px", marginBottom: "20px" }}>{keyError}</p>}
          <button onClick={saveKey} disabled={!keyInput.trim() || keyLoading} style={{ ...sBtnGhost, width: "100%", borderColor: keyInput && !keyLoading ? "var(--text-h)" : "var(--border)", color: keyInput && !keyLoading ? "var(--text-h)" : "var(--border)" }} aria-label="Guardar y Ejecutar">
            {keyLoading ? "Validating..." : "Execute"}
          </button>
        </div>
      </div>
    );
```
