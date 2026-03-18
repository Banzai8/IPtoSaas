"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<"knowledge" | "passwords">("knowledge");

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

  const settings = useQuery(api.settings.getAll);
  const setSetting = useMutation(api.settings.set);
  const accessPasswords = useQuery(api.accessPasswords.list);
  const addPassword = useMutation(api.accessPasswords.add);
  const removePassword = useMutation(api.accessPasswords.remove);

  useEffect(() => {
    if (settings) {
      setKnowledge(settings.knowledge ?? "");
      setRules(settings.rules ?? "");
    }
  }, [settings]);

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
      </div>
    </div>
  );
}
