#!/bin/bash
# Export all conversations from IndexedDB
DEST="/Users/yzy/Desktop/evidenceflow-ai/聊天记录"
mkdir -p "$DEST"

echo "正在导出聊天记录..."

# Use node with fake-indexeddb isn't possible since the real DB is in the browser.
# We need a different approach - open the app and use JS to export.
echo "请在浏览器中打开 http://localhost:5173/，然后按 Cmd+Option+J 打开控制台，复制粘贴以下代码："
echo ""
echo '--- 复制以下代码到浏览器控制台 ---'
cat << 'JSEOF'
(async () => {
  // Open the IndexedDB
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open("EvidenceFlowDB", 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  // Get all data
  const tx = db.transaction(["conversations", "documents", "claims", "evidences"], "readonly");
  const convs = await new Promise(r => { const req = tx.objectStore("conversations").getAll(); req.onsuccess = () => r(req.result); });
  const docs = await new Promise(r => { const req = tx.objectStore("documents").getAll(); req.onsuccess = () => r(req.result); });
  const claims = await new Promise(r => { const req = tx.objectStore("claims").getAll(); req.onsuccess = () => r(req.result); });
  const evids = await new Promise(r => { const req = tx.objectStore("evidences").getAll(); req.onsuccess = () => r(req.result); });
  db.close();

  // Build export data
  const exportData = {
    exportTime: new Date().toISOString(),
    conversations: convs.map(c => {
      const doc = docs.find(d => d.id === c.documentId);
      return {
        documentName: doc?.fileName || "全局对话",
        documentId: c.documentId,
        messageCount: c.messages.length,
        messages: c.messages.map(m => ({
          role: m.role === "user" ? "用户" : "AI",
          content: m.content,
          citations: m.citations?.length || 0,
          time: m.createdAt
        })),
        claims: claims.filter(cl => cl.conversationId === c.id),
        evidences: evids.filter(e => claims.some(cl => cl.id === e.claimId && cl.conversationId === c.id))
      };
    })
  };

  // Create downloadable JSON
  const json = JSON.stringify(exportData, null, 2);
  console.log("导出完成！共 " + convs.length + " 个对话，" + claims.length + " 条结论，" + evids.length + " 条证据");

  // Download as file
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "聊天记录_" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(url);
  console.log("文件已下载，请保存到 /Users/yzy/Desktop/evidenceflow-ai/聊天记录/ 文件夹");
})();
JSEOF
echo '--- 复制以上代码到浏览器控制台 ---'
