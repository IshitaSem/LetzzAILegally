import { useState, useRef, useEffect } from "react";
import { Page, ChatMessageItem } from "./types";
import { LogoMark } from "./components/common/LogoMark";
import { Composer } from "./components/common/Composer";
import { Sidebar } from "./components/layout/Sidebar";
import { HomePage } from "./components/views/HomePage";
import { ChatView } from "./components/chat/ChatView";
import { DocumentsView } from "./components/documents/DocumentsView";
import { DocAnalysis } from "./components/documents/DocAnalysis";
import { HistoryView } from "./components/views/HistoryView";
import { SavedView } from "./components/views/SavedView";
import { SettingsView } from "./components/views/SettingsView";
import { UploadModal } from "./components/documents/UploadModal";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [initialQuery, setInitialQuery] = useState<{id: string, text: string} | null>(null);
  const processedQueryIdRef = useRef<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string>(() => crypto.randomUUID());
  const [conversations, setConversations] = useState<Record<string, ChatMessageItem[]>>(() => {
    try {
      const saved = localStorage.getItem("letzAiLegally_conversations");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Local storage fallback handled gracefully
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem("letzAiLegally_conversations", JSON.stringify(conversations));
    } catch (e) {
      // Local storage save error handled gracefully
    }
  }, [conversations]);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "var(--bg)", overflow: "hidden" }}>
      {/* Skip to Main Content link for keyboard accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <Sidebar page={page} setPage={setPage} activeConversationId={activeConversationId} setActiveConversationId={setActiveConversationId} conversations={conversations} />

      <main id="main-content" tabIndex={-1} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, outline: "none" }}>
        {/* top status bar */}
        <div style={{ height: 44, display: "flex", alignItems: "center", padding: "0 24px", borderBottom: "1px solid var(--border2)", flexShrink: 0, background: "rgba(4,6,15,.9)", backdropFilter: "blur(8px)", gap: 8, position: "relative", zIndex: 10 }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(61,127,255,.3),transparent)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <LogoMark size={18} />
            <span style={{ fontSize: 12, color: "var(--fg3)" }}>LetzAiLegally</span>
            <span style={{ fontSize: 12, color: "var(--fg3)" }}>•</span>
            <span className="sora" style={{ fontSize: 12, color: "var(--fg2)", fontWeight: 500, textTransform: "capitalize" }}>
              {page === "doc-analysis" ? "Document Analysis" : page === "home" ? "New Chat" : page}
            </span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "rgba(34,216,122,.07)", border: "1px solid rgba(34,216,122,.14)" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 5px var(--green)" }} />
              <span style={{ fontSize: 11, color: "#5ef0a0", fontWeight: 500 }}>AI Online</span>
            </div>
          </div>
        </div>

        {page === "home"         && <><HomePage setPage={setPage} onUpload={() => setUploadOpen(true)} /><Composer onSend={(text) => { setInitialQuery({id: String(Date.now()), text}); setPage("chat"); }} onUpload={() => setUploadOpen(true)} /></>}
        {page === "chat"         && <ChatView 
            key={activeConversationId} 
            onUpload={() => setUploadOpen(true)} 
            initialQuery={initialQuery} 
            processedQueryIdRef={processedQueryIdRef}
            messages={conversations[activeConversationId] || []}
            setMessages={(msgs) => setConversations(prev => ({...prev, [activeConversationId]: typeof msgs === 'function' ? msgs(prev[activeConversationId] || []) : msgs}))}
          />}
        {page === "documents"    && <DocumentsView setPage={setPage} onUpload={() => setUploadOpen(true)} onSelectDoc={id => setSelectedDocId(id)} />}
        {page === "doc-analysis" && <DocAnalysis docId={selectedDocId} setPage={setPage} />}
        {page === "history"      && <HistoryView setPage={setPage} setActiveConversationId={setActiveConversationId} conversations={conversations} />}
        {page === "saved"        && <SavedView />}
        {page === "settings"     && <SettingsView />}
      </main>

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onDone={(docId) => {
            setSelectedDocId(docId);
            setPage("doc-analysis");
          }}
        />
      )}
    </div>
  );
}
