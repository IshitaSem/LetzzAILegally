import { useState, useRef, useEffect } from "react";
import { api } from "../../api";
import { ChatStage, ChatMessageItem } from "../../types";
import { I, Ico } from "../common/Icons";
import { Star, AIAv } from "../common/Decorative";
import { Composer } from "../common/Composer";
import { AIResponseBlock } from "./AIResponseBlock";

export function ChatView({ onUpload, initialQuery, processedQueryIdRef, messages, setMessages }: { onUpload: () => void, initialQuery?: {id: string, text: string} | null, processedQueryIdRef: React.MutableRefObject<string | null>, messages: ChatMessageItem[], setMessages: React.Dispatch<React.SetStateAction<ChatMessageItem[]>> }) {
  const [stage, setStage] = useState<ChatStage>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery && initialQuery.id !== processedQueryIdRef.current) {
      processedQueryIdRef.current = initialQuery.id;
      handleSend(initialQuery.text);
    }
  }, [initialQuery, processedQueryIdRef]);

  const handleSend = async (text: string) => {
    const userMsg: ChatMessageItem = { id: crypto.randomUUID(), sender: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setStage("typing");

    try {
      const response = await api.sendChat(text);
      const aiMsg: ChatMessageItem = { id: crypto.randomUUID(), sender: "ai", text: response.answer, data: response };
      setMessages(prev => [...prev, aiMsg]);
      setStage("done");
    } catch (err: any) {
      const errorMsg: ChatMessageItem = { id: crypto.randomUUID(), sender: "ai", text: "API Error", error: err.message || "Failed to communicate with LetzAiLegally backend." };
      setMessages(prev => [...prev, errorMsg]);
      setStage("error");
    }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, stage]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* header */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <p className="sora" style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>
            {messages.length === 0 ? "New Conversation" : "LetzAiLegally Legal Chat"}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
            <span style={{ fontSize: 11.5, color: "var(--fg3)" }}>AI Ready · Fast API Session</span>
          </div>
        </div>
        <button
          style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg3)", background: "var(--surface)", border: "1px solid var(--border)" }}
          aria-label="Conversation options"
        >
          <Ico c={<I.Dots />} s={14} />
        </button>
      </div>

      {/* messages */}
      <div className="scroll" style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
        {messages.length === 0 && stage === "idle" ? (
          <div className="anim-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "65%", textAlign: "center", gap: 22, position: "relative" }}>
            <Star x="10%" y="20%" size={10} opacity={0.3} />
            <Star x="88%" y="15%" size={12} opacity={0.25} />
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#3d7fff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 32px rgba(61,127,255,.35)" }} aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M13 2L15.5 9.5H23L17 14L19.5 21.5L13 17L6.5 21.5L9 14L3 9.5H10.5L13 2Z" fill="white"/></svg>
            </div>
            <div>
              <h2 className="sora" style={{ fontSize: 24, fontWeight: 700, color: "var(--fg)", marginBottom: 8 }}>What would you like to explore?</h2>
              <p style={{ fontSize: 13.5, color: "var(--fg2)", lineHeight: 1.6 }}>Type a legal question, or try one of these:</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 520 }}>
              {["What are my rights as a tenant?", "Is my non-compete enforceable?", "What does 'force majeure' mean?", "Review this indemnity clause"].map(q => (
                <button key={q} onClick={() => handleSend(q)}
                  aria-label={`Ask suggestion: ${q}`}
                  style={{ padding: "8px 18px", borderRadius: 99, fontSize: 13, background: "rgba(61,127,255,.08)", border: "1px solid rgba(61,127,255,.22)", color: "var(--blue2)", cursor: "pointer" }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 800, margin: "0 auto" }}>
            {messages.map(m => (
              <div key={m.id}>
                {m.sender === "user" ? (
                  <div className="anim-up" style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ maxWidth: 440, padding: "12px 18px", borderRadius: 16, borderTopRightRadius: 4, background: "linear-gradient(135deg,#3d7fff,#5b94ff)", color: "#fff", fontSize: 13.5, lineHeight: 1.65, boxShadow: "0 4px 20px rgba(61,127,255,.3)" }}>
                      {m.text}
                    </div>
                  </div>
                ) : m.error ? (
                  <div className="anim-up" style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <AIAv />
                    <div role="alert" style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(255,77,109,.1)", border: "1px solid rgba(255,77,109,.25)", color: "var(--fg)" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#ff4d6d" }}>Backend Communication Error</p>
                      <p style={{ fontSize: 12, marginTop: 4, color: "var(--fg2)" }}>{m.error}</p>
                    </div>
                  </div>
                ) : (
                  <AIResponseBlock data={m.data} />
                )}
              </div>
            ))}

            {stage === "typing" && (
              <div className="anim-in" style={{ display: "flex", alignItems: "flex-start", gap: 12 }} role="status" aria-live="polite" aria-label="AI is generating legal response">
                <AIAv />
                <div style={{ padding: "12px 16px", borderRadius: 14, borderTopLeftRadius: 4, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", gap: 5, alignItems: "center" }}>
                  {[0,1,2].map(i => <div key={i} className="blink" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--blue)", animationDelay: `${i*.2}s` }} />)}
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <Composer onSend={(text) => handleSend(text)} onUpload={onUpload} />
    </div>
  );
}
