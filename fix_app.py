
import re

with open(r"frontend/src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace <input type="file" ...>
content = re.sub(
    r"(<input type=\"file\" ref=\{fileInputRef\})", 
    r"\1 aria-label=\"Upload legal document\"", 
    content
)

# Replace <input value={docQuestion} ...>
content = re.sub(
    r"(<input\s+value=\{docQuestion\}\s+onChange=\{e => setDocQuestion\(e\.target\.value\)\})",
    r"\1 aria-label=\"Ask a question about this document\"",
    content
)

# Replace <input value={q} ...>
content = re.sub(
    r"(<input value=\{q\}\s+onChange=\{e => setQ\(e\.target\.value\)\})",
    r"\1 aria-label=\"Search conversations\"",
    content
)

# Upload Document (already has title, let`s add aria-label)
content = re.sub(
    r"(<button onClick=\{onUpload\} title=\"Upload Document\")",
    r"<button onClick={onUpload} title=\"Upload Document\" aria-label=\"Upload document\"",
    content
)

# Microphone button
content = re.sub(
    r"(<button style=\{\{ width: 34, height: 34, borderRadius: 8, display: \"flex\", alignItems: \"center\", justifyContent: \"center\", background: \"rgba\(255,255,255,\.05\)\", color: \"var\(--fg3\)\", border: \"1px solid var\(--border\)\", cursor: \"pointer\" \}\}>)(\s*<Ico c=\{<I\.Mic \/>\})",
    r"<button aria-label=\"Voice input\" style={{ width: 34, height: 34, borderRadius: 8, display: \"flex\", alignItems: \"center\", justifyContent: \"center\", background: \"rgba(255,255,255,.05)\", color: \"var(--fg3)\", border: \"1px solid var(--border)\", cursor: \"pointer\" }}>\2",
    content
)

# Send button (Composer)
content = re.sub(
    r"(<button onClick=\{send\}\n?\s*style=\{\{\n?\s*width: 34, height: 34, borderRadius: 8, display: \"flex\", alignItems: \"center\", justifyContent: \"center\",)",
    r"<button aria-label=\"Send message\" onClick={send}\n                  style={{ width: 34, height: 34, borderRadius: 8, display: \"flex\", alignItems: \"center\", justifyContent: \"center\",",
    content
)

# Send button (DocAnalysis)
content = re.sub(
    r"(<button\s+onClick=\{handleAskDoc\}\s+disabled=\{asking\})",
    r"<button aria-label=\"Send message\" onClick={handleAskDoc} disabled={asking}",
    content
)

# Dots / More options button
content = re.sub(
    r"(<button style=\{\{ width: 30, height: 30, borderRadius: 8, display: \"flex\", alignItems: \"center\", justifyContent: \"center\", color: \"var\(--fg3\)\", background: \"var\(--surface\)\", border: \"1px solid var\(--border\)\" \}\}>)(\s*<Ico c=\{<I\.Dots \/>\})",
    r"<button aria-label=\"More options\" style={{ width: 30, height: 30, borderRadius: 8, display: \"flex\", alignItems: \"center\", justifyContent: \"center\", color: \"var(--fg3)\", background: \"var(--surface)\", border: \"1px solid var(--border)\" }}>\2",
    content
)

# Close Modal (X) button
content = re.sub(
    r"(<button onClick=\{onClose\} style=\{\{ width: 30, height: 30, borderRadius: 8, display: \"flex\", alignItems: \"center\", justifyContent: \"center\", background: \"rgba\(255,255,255,\.06\)\", color: \"var\(--fg3\)\", marginLeft: 12, flexShrink: 0, cursor: \"pointer\" \}\}>)(\s*<Ico c=\{<I\.X \/>\})",
    r"<button aria-label=\"Close\" onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: \"flex\", alignItems: \"center\", justifyContent: \"center\", background: \"rgba(255,255,255,.06)\", color: \"var(--fg3)\", marginLeft: 12, flexShrink: 0, cursor: \"pointer\" }}>\2",
    content
)

# Back button
content = re.sub(
    r"(<button className=\"btn-ghost\" onClick=\{.*? setPage\(\"documents\"\).*? style=\{\{ fontSize: 12, cursor: \"pointer\" \}\}>)",
    r"<button aria-label=\"Go back\" className=\"btn-ghost\" onClick={() => setPage(\"documents\")} style={{ fontSize: 12, cursor: \"pointer\" }}>",
    content
)

# "Drop a document or click to upload" giant button area
content = re.sub(
    r"(<button onClick=\{onUpload\}\n?\s*style=\{\{\s*width: \"100%\",\s*display: \"flex\",)",
    r"<button aria-label=\"Upload document area\" onClick={onUpload}\n            style={{ width: \"100%\", display: \"flex\",",
    content
)

# aria-live for loading states
# typing/loading state
content = re.sub(
    r"(<div className=\"typing-dot\" />)",
    r"<div aria-live=\"polite\" className=\"typing-dot\" />",
    content
)

# Document analysis loading
content = re.sub(
    r"(<p style=\{\{ fontSize: 15, color: \"var\(--fg2\)\" \}\}>Analyzing document\.\.\.<\/p>)",
    r"<p aria-live=\"polite\" style={{ fontSize: 15, color: \"var(--fg2)\" }}>Analyzing document...</p>",
    content
)

# Upload status text
content = re.sub(
    r"(<h2 className=\"sora\" style=\{\{ fontSize: 20, fontWeight: 600, color: \"var\(--fg\)\", marginBottom: 8 \}\}>Uploading document\.\.\.<\/h2>)",
    r"<h2 aria-live=\"polite\" className=\"sora\" style={{ fontSize: 20, fontWeight: 600, color: \"var(--fg)\", marginBottom: 8 }}>Uploading document...</h2>",
    content
)

# Error messages
content = re.sub(
    r"(<p style=\{\{ fontSize: 14, color: \"#f87171\", marginBottom: 20 \}\}>\{errorMsg\}<\/p>)",
    r"<p role=\"alert\" style={{ fontSize: 14, color: \"#f87171\", marginBottom: 20 }}>{errorMsg}</p>",
    content
)
content = re.sub(
    r"(<p style=\{\{ fontSize: 13, color: \"#f87171\", padding: 16 \}\}>\{error\}<\/p>)",
    r"<p role=\"alert\" style={{ fontSize: 13, color: \"#f87171\", padding: 16 }}>{error}</p>",
    content
)

# Semantic landmarks - specifically targeting the outer divs of large components
content = content.replace("<div className=\"app-container\">", "<main className=\"app-container\">")
content = content.replace("</main>", "</div>") # This avoids messing up other divs, wait no
content = content.replace("export default function App() {", "export default function App() {")

with open(r"frontend/src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Regex replacements complete")
