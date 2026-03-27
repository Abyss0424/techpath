// ── 1. useEffect: monitors savedChats & screen (saves to localStorage) ──
  useEffect(() => {
    if (screen !== "apikey") {
      localStorage.setItem("tp_saved_chats", encryptState(savedChats));
    }
  }, [savedChats, screen]);

// ── 2. useEffect: monitors activeStageId or stageChanged ──
// [NOT FOUND AS A STANDALONE EFFECT]
// Integration Note: State sync occurs imperatively inside send() and selectStage(). 
// activeStageId is updated visually, and savedChats (which contains activeStageId) 
// is updated via the setSavedChats calls within those functions, which then 
// triggers the localStorage sync effect above.

// ── 3. useEffect inside DashboardScreen (reacts to stages or chat changes) ──
// [NOT FOUND]
// DashboardScreen is currently a purely functional component. 
// It receives all state (stages, messages, activeStageId) via props.
// Chat scrolling is handled manually via the scrollBottom() helper function 
// called at the end of state-changing operations (send, selectStage, startArea).
