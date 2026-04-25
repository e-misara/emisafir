import { useState, useEffect, useRef } from "https://esm.sh/react@18";

const SYSTEM_PROMPT = `Sen bir otel resepsiyon asistanısın. Adın "Asistan". Türkçe konuş, kısa ve nazik cevap ver. Talep aldığında "✓ İletildi, en kısa sürede ilgileniyoruz." de. Kısa tut, emoji kullan ama abartma.`;

const QUICK = [
  { icon: "✨", label: "Temizlik", text: "Odamı temizler misiniz?" },
  { icon: "🛁", label: "Havlu", text: "Temiz havlu getirir misiniz?" },
  { icon: "🍽", label: "Oda Servisi", text: "Oda servisi menüsü nedir?" },
  { icon: "🚕", label: "Taksi", text: "Taksi çağırabilir misiniz?" },
  { icon: "🔑", label: "Çıkış Saati", text: "Check-out saati ne zaman?" },
  { icon: "📶", label: "WiFi", text: "WiFi şifresi nedir?" },
];

async function askClaude(messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "Bir sorun oluştu.";
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const room = new URLSearchParams(window.location.search).get("room") || "101";
  const [msgs, setMsgs] = useState([
    { id: "init", from: "bot", text: `Merhaba! 👋 Oda ${room}'e hoş geldiniz.\nSize nasıl yardımcı olabilirim?`, ts: Date.now() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const apiHistory = useRef([]);
  const bottomRef = useRef();
  const taRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setShowQuick(false);
    if (taRef.current) taRef.current.style.height = "42px";
    const userMsg = { id: Date.now() + "u", from: "user", text: msg, ts: Date.now() };
    setMsgs(prev => [...prev, userMsg]);
    apiHistory.current = [...apiHistory.current, { role: "user", content: msg }];
    setLoading(true);
    try {
      const reply = await askClaude(apiHistory.current);
      apiHistory.current = [...apiHistory.current, { role: "assistant", content: reply }];
      setMsgs(prev => [...prev, { id: Date.now() + "b", from: "bot", text: reply, ts: Date.now() }]);
    } catch {
      setMsgs(prev => [...prev, { id: Date.now() + "e", from: "bot", text: "Bağlantı sorunu, tekrar deneyin.", ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{height:100%;font-family:'Nunito',sans-serif;background:#faf7f2;}
        @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4;}40%{transform:translateY(-5px);opacity:1;}}
        textarea{font-family:'Nunito',sans-serif;}
      `}</style>
      <div style={{display:"flex",flexDirection:"column",height:"100dvh",maxWidth:480,margin:"0 auto"}}>
        <div style={{background:"#1a1a2e",padding:"16px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
          <div style={{width:44,height:44,background:"rgba(201,168,76,.15)",border:"1.5px solid #c9a84c",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem"}}>🛎</div>
          <div style={{flex:1}}>
            <div style={{color:"#fff",fontSize:"1rem"}}>Resepsiyon</div>
            <div style={{color:"#c9a84c",fontSize:"0.7rem",marginTop:2}}>e-Misafir · Oda {room}</div>
          </div>
          <div style={{background:"rgba(201,168,76,.15)",border:"1px solid rgba(201,168,76,.4)",borderRadius:20,padding:"5px 14px",fontSize:"0.75rem",color:"#c9a84c"}}>{room}</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"20px 16px 8px",display:"flex",flexDirection:"column",gap:12}}>
          {msgs.map(m => {
            const isUser = m.from === "user";
            return (
              <div key={m.id} style={{display:"flex",flexDirection:isUser?"row-reverse":"row",gap:8,alignItems:"flex-end"}}>
                {!isUser && <div style={{width:30,height:30,borderRadius:"50%",background:"#1a1a2e",border:"1.5px solid #c9a84c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.72rem",color:"#c9a84c",flexShrink:0}}>e</div>}
                <div style={{maxWidth:"78%",display:"flex",flexDirection:"column",gap:3,alignItems:isUser?"flex-end":"flex-start"}}>
                  <div style={{padding:"10px 15px",borderRadius:isUser?"18px 18px 4px 18px":"18px 18px 18px 4px",background:isUser?"#1a1a2e":"#fff",color:isUser?"#fff":"#1a1a2e",fontSize:"0.87rem",lineHeight:1.55,border:`1px solid ${isUser?"transparent":"rgba(26,26,46,.1)"}`,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
                    {m.text.split("\n").map((ln,i,a) => <span key={i}>{ln}{i<a.length-1&&<br/>}</span>)}
                  </div>
                  <div style={{fontSize:"0.64rem",color:"#9a8f80",paddingLeft:4}}>{fmtTime(m.ts)}</div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"#1a1a2e",border:"1.5px solid #c9a84c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.72rem",color:"#c9a84c"}}>e</div>
              <div style={{background:"#fff",border:"1px solid rgba(26,26,46,.1)",borderRadius:"18px 18px 18px 4px",padding:"14px 18px",display:"flex",gap:5}}>
                {[0,.2,.4].map((d,i) => <span key={i} style={{width:7,height:7,background:"#c9a84c",borderRadius:"50%",display:"inline-block",animation:`bounce 1.2s ${d}s infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
        {showQuick && (
          <div style={{padding:"0 16px 12px",flexShrink:0}}>
            <div style={{fontSize:"0.67rem",color:"#9a8f80",letterSpacing:1,textTransform:"uppercase",marginBottom:7}}>Hızlı Talep</div>
            <div style={{display:"flex",gap:7,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
              {QUICK.map(q => <button key={q.label} disabled={loading} onClick={() => send(q.text)} style={{background:"#fff",border:"1.5px solid rgba(26,26,46,.1)",borderRadius:20,padding:"7px 13px",fontSize:"0.75rem",color:"#1a1a2e",cursor:"pointer",whiteSpace:"nowrap"}}>{q.icon} {q.label}</button>)}
            </div>
          </div>
        )}
        <div style={{background:"#fff",borderTop:"1px solid rgba(26,26,46,.1)",padding:"12px 16px 20px",display:"flex",gap:10,alignItems:"flex-end",flexShrink:0}}>
          <textarea ref={taRef} style={{flex:1,background:"#f0ebe1",border:"1.5px solid rgba(26,26,46,.1)",borderRadius:22,padding:"10px 18px",fontSize:"0.87rem",color:"#1a1a2e",outline:"none",resize:"none",minHeight:42,lineHeight:1.4}} placeholder="Mesajınızı yazın..." value={input} rows={1}
            onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,100)+"px";}}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
          />
          <button onClick={()=>send()} disabled={!input.trim()||loading} style={{width:44,height:44,borderRadius:"50%",background:"#1a1a2e",border:"none",color:"#c9a84c",fontSize:"1rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:(!input.trim()||loading)?.4:1}}>➤</button>
        </div>
      </div>
    </>
  );
}
