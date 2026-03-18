"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<"knowledge" | "passwords" | "conversations" | "pdfs">("knowledge");

  // Knowledge & Rules
  const [knowledge, setKnowledge] = useState("");
  const [rules, setRules] = useState("");
  const [savingKnowledge, setSavingKnowledge] = useState(false);
  const [savedKnowledge, setSavedKnowledge] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [savedRules, setSavedRules] = useState(false);

  // Access Passwords
  const [newPassword, setNewPassword] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [addingPassword, setAddingPassword] = useState(false);
  const [addError, setAddError] = useState("");

  // PDFs
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  const settings = useQuery(api.settings.getAll);
  const setSetting = useMutation(api.settings.set);
  const accessPasswords = useQuery(api.accessPasswords.list);
  const conversations = useQuery(api.conversations.list);
  const addPassword = useMutation(api.accessPasswords.add);
  const removePassword = useMutation(api.accessPasswords.remove);
  const pdfDocuments = useQuery(api.pdfDocuments.list);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uploadingDoc = useQuery(api.pdfDocuments.getById, uploadingDocId ? { id: uploadingDocId as any } : "skip");
  const removePdfDocument = useMutation(api.pdfDocuments.remove);
  const deleteChunksByDocument = useMutation(api.pdfChunks.deleteByDocument);

  useEffect(() => {
    if (settings) {
      setKnowledge(settings.knowledge ?? "");
      setRules(settings.rules ?? "");
    }
  }, [settings]);

  useEffect(() => {
    if (!uploadingDoc) return;
    if (uploadingDoc.status === "ready") {
      setUploadStatus("done");
      setTimeout(() => {
        setUploadStatus("idle");
        setUploadingDocId(null);
      }, 3000);
    }
    if (uploadingDoc.status === "error") {
      setUploadStatus("error");
      setUploadError("Processing failed. Please try again.");
    }
  }, [uploadingDoc]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPassword }),
    });
    if (res.ok) {
      setAuthenticated(true);
    } else {
      setLoginError("Incorrect password. Please try again.");
    }
  }

  async function handleSaveKnowledge(e: React.FormEvent) {
    e.preventDefault();
    setSavingKnowledge(true);
    await setSetting({ key: "knowledge", value: knowledge });
    setSavingKnowledge(false);
    setSavedKnowledge(true);
    setTimeout(() => setSavedKnowledge(false), 3000);
  }

  async function handleSaveRules(e: React.FormEvent) {
    e.preventDefault();
    setSavingRules(true);
    await setSetting({ key: "rules", value: rules });
    setSavingRules(false);
    setSavedRules(true);
    setTimeout(() => setSavedRules(false), 3000);
  }

  async function handleAddPassword(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    if (!newPassword.trim()) {
      setAddError("Please enter a password.");
      return;
    }
    if (!newExpiry) {
      setAddError("Please select an expiry date.");
      return;
    }
    setAddingPassword(true);
    await addPassword({ password: newPassword.trim(), expiryDate: newExpiry });
    setNewPassword("");
    setNewExpiry("");
    setAddingPassword(false);
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus("uploading");
    setUploadError("");
    setUploadingDocId(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload failed");
      }
      const data = await res.json();
      setUploadingDocId(data.docId);
      setUploadStatus("processing");
      e.target.value = "";
    } catch (err) {
      setUploadStatus("error");
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleDeletePdf(docId: any) {
    await deleteChunksByDocument({ documentId: docId });
    await removePdfDocument({ id: docId });
  }

  function formatDate(isoDate: string) {
    const [year, month, day] = isoDate.split("-");
    return `${day}-${month}-${year}`;
  }

  function getStatus(expiryDate: string) {
    const today = new Date().toISOString().split("T")[0];
    return expiryDate >= today ? "Active" : "Expired";
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-400 mb-6 text-sm">Online Marketing Coaching App</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
                required
              />
            </div>
            {loginError && (
              <p className="text-red-400 text-sm">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 text-sm mt-1">Online Marketing Coaching App</p>
          </div>
          <button
            onClick={() => setAuthenticated(false)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "knowledge"
                ? "bg-gray-800 text-white border border-gray-700"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Knowledge & Rules
          </button>
          <button
            onClick={() => setActiveTab("passwords")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "passwords"
                ? "bg-gray-800 text-white border border-gray-700"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Access Passwords
          </button>
          <button
            onClick={() => setActiveTab("conversations")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "conversations"
                ? "bg-gray-800 text-white border border-gray-700"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Conversations
          </button>
          <button
            onClick={() => setActiveTab("pdfs")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "pdfs"
                ? "bg-gray-800 text-white border border-gray-700"
                : "text-gray-400 hover:text-white"
            }`}
          >
            PDFs
          </button>
        </div>

        {/* Knowledge & Rules Tab */}
        {activeTab === "knowledge" && (
          <div className="space-y-6">
            <form onSubmit={handleSaveKnowledge} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-1">Knowledge Base</h2>
              <p className="text-gray-400 text-sm mb-4">
                What the AI knows — your expertise, services, content, and background info.
              </p>
              <textarea
                value={knowledge}
                onChange={(e) => setKnowledge(e.target.value)}
                rows={10}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm mb-4"
                placeholder="Enter your knowledge here..."
              />
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={savingKnowledge}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                  {savingKnowledge ? "Saving..." : "Save Knowledge"}
                </button>
                {savedKnowledge && (
                  <span className="text-green-400 text-sm">Knowledge saved!</span>
                )}
              </div>
            </form>

            <form onSubmit={handleSaveRules} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-1">Response Rules</h2>
              <p className="text-gray-400 text-sm mb-4">
                How the AI should respond — tone, style, boundaries, and instructions.
              </p>
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={8}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm mb-4"
                placeholder="Enter your rules here..."
              />
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={savingRules}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                  {savingRules ? "Saving..." : "Save Rules"}
                </button>
                {savedRules && (
                  <span className="text-green-400 text-sm">Rules saved!</span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Access Passwords Tab */}
        {activeTab === "passwords" && (
          <div className="space-y-6">
            {/* Add New Password */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-1">Add New Password</h2>
              <p className="text-gray-400 text-sm mb-4">
                Create access passwords for your customers.
              </p>
              <form onSubmit={handleAddPassword}>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={newExpiry}
                      onChange={(e) => setNewExpiry(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {addError && <p className="text-red-400 text-sm mb-3">{addError}</p>}
                <button
                  type="submit"
                  disabled={addingPassword}
                  className="bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg border border-gray-700 transition-colors"
                >
                  {addingPassword ? "Adding..." : "Add Password"}
                </button>
              </form>
            </div>

            {/* Active Passwords Table */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-1">Active Passwords</h2>
              <p className="text-gray-400 text-sm mb-4">Manage customer access passwords.</p>

              {!accessPasswords || accessPasswords.length === 0 ? (
                <p className="text-gray-500 text-sm">No access passwords yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left text-gray-400 font-medium pb-3">Password</th>
                        <th className="text-left text-gray-400 font-medium pb-3">Expiry Date</th>
                        <th className="text-left text-gray-400 font-medium pb-3">Status</th>
                        <th className="text-left text-gray-400 font-medium pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {accessPasswords.map((pw) => {
                        const status = getStatus(pw.expiryDate);
                        return (
                          <tr key={pw._id}>
                            <td className="py-3 text-white font-mono">{pw.password}</td>
                            <td className="py-3 text-gray-300">{formatDate(pw.expiryDate)}</td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  status === "Active"
                                    ? "bg-green-900/50 text-green-400"
                                    : "bg-red-900/50 text-red-400"
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="py-3">
                              <button
                                onClick={() => removePassword({ id: pw._id })}
                                className="text-red-400 hover:text-red-300 text-xs transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === "conversations" && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-1">Customer Conversations</h2>
            <p className="text-gray-400 text-sm mb-4">
              All questions asked by customers, most recent first.
            </p>

            {!conversations || conversations.length === 0 ? (
              <p className="text-gray-500 text-sm">No conversations yet.</p>
            ) : (
              <div className="space-y-4">
                {conversations.map((conv) => (
                  <div key={conv._id} className="border border-gray-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(conv.askedAt).toLocaleString()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        conv.source === "knowledge_base"
                          ? "bg-green-900/50 text-green-400"
                          : conv.source === "pdf"
                          ? "bg-blue-900/50 text-blue-400"
                          : conv.source === "both"
                          ? "bg-purple-900/50 text-purple-400"
                          : "bg-gray-800 text-gray-400"
                      }`}>
                        {conv.source === "knowledge_base" && "Knowledge Base"}
                        {conv.source === "pdf" && "PDF"}
                        {conv.source === "both" && "PDF + Knowledge Base"}
                        {conv.source === "none" && "No source"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-0.5">Question</p>
                      <p className="text-sm text-white">{conv.question}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-0.5">Answer</p>
                      <p className="text-sm text-gray-300 line-clamp-3">{conv.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PDFs Tab */}
        {activeTab === "pdfs" && (
          <div className="space-y-6">
            {/* Upload */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-1">Upload PDF</h2>
              <p className="text-gray-400 text-sm mb-4">
                Upload a PDF to extract and index its content for the AI to use.
              </p>

              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                uploadStatus === "idle" || uploadStatus === "done"
                  ? "border-gray-700 hover:border-gray-500"
                  : "border-gray-800 cursor-not-allowed"
              }`}>
                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    {uploadStatus === "idle" && "Click to select a PDF file"}
                    {uploadStatus === "uploading" && "Uploading..."}
                    {uploadStatus === "processing" && "Processing..."}
                    {uploadStatus === "done" && "Done!"}
                    {uploadStatus === "error" && "Upload failed — try again"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">PDF files only</p>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                  onChange={handlePdfUpload}
                />
              </label>

              {/* Progress bar */}
              {(uploadStatus === "uploading" || uploadStatus === "processing") && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">
                      {uploadStatus === "uploading"
                        ? "Uploading file..."
                        : `Indexing chunks... ${uploadingDoc?.progress ?? 0}%`}
                    </span>
                    <span className="text-xs text-gray-500">{uploadingDoc?.progress ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${uploadingDoc?.progress ?? 0}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadStatus === "done" && (
                <p className="mt-3 text-green-400 text-sm">PDF indexed successfully!</p>
              )}
              {uploadStatus === "error" && uploadError && (
                <p className="mt-3 text-red-400 text-sm">{uploadError}</p>
              )}
            </div>

            {/* PDF List */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-1">Uploaded PDFs</h2>
              <p className="text-gray-400 text-sm mb-4">Manage indexed PDF documents.</p>

              {!pdfDocuments || pdfDocuments.length === 0 ? (
                <p className="text-gray-500 text-sm">No PDFs uploaded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left text-gray-400 font-medium pb-3">Filename</th>
                        <th className="text-left text-gray-400 font-medium pb-3">Uploaded</th>
                        <th className="text-left text-gray-400 font-medium pb-3">Chunks</th>
                        <th className="text-left text-gray-400 font-medium pb-3">Status</th>
                        <th className="text-left text-gray-400 font-medium pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {pdfDocuments.map((doc) => (
                        <tr key={doc._id}>
                          <td className="py-3 text-white font-mono text-xs max-w-[200px] truncate">{doc.filename}</td>
                          <td className="py-3 text-gray-300 text-xs">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                          <td className="py-3 text-gray-300 text-xs">{doc.totalChunks}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              doc.status === "ready"
                                ? "bg-green-900/50 text-green-400"
                                : doc.status === "processing"
                                ? "bg-yellow-900/50 text-yellow-400"
                                : "bg-red-900/50 text-red-400"
                            }`}>
                              {doc.status === "ready" ? "Ready" : doc.status === "processing" ? "Processing" : "Error"}
                            </span>
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => handleDeletePdf(doc._id)}
                              disabled={doc.status === "processing"}
                              className="text-red-400 hover:text-red-300 text-xs transition-colors disabled:opacity-40"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
