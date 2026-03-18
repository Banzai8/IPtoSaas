"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [knowledge, setKnowledge] = useState("");
  const [rules, setRules] = useState("");
  const [chatPassword, setChatPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const settings = useQuery(api.settings.getAll);
  const setSetting = useMutation(api.settings.set);

  useEffect(() => {
    if (settings) {
      setKnowledge(settings.knowledge ?? "");
      setRules(settings.rules ?? "");
      setChatPassword(settings.chatPassword ?? "");
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await Promise.all([
      setSetting({ key: "knowledge", value: knowledge }),
      setSetting({ key: "rules", value: rules }),
      setSetting({ key: "chatPassword", value: chatPassword }),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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

        <form onSubmit={handleSave} className="space-y-6">
          {/* Knowledge */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-1">Knowledge Base</h2>
            <p className="text-gray-400 text-sm mb-4">
              What the AI knows — your expertise, services, content, and background info.
            </p>
            <textarea
              value={knowledge}
              onChange={(e) => setKnowledge(e.target.value)}
              rows={10}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm"
              placeholder="Enter your knowledge here... e.g. I am a marketing coach specializing in funnels. I help coaches and consultants generate leads through..."
            />
          </div>

          {/* Rules */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-1">Response Rules</h2>
            <p className="text-gray-400 text-sm mb-4">
              How the AI should respond — tone, style, boundaries, and instructions.
            </p>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={8}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm"
              placeholder="Enter your rules here... e.g. Always be friendly and professional. Only answer questions about online marketing. Never give financial advice..."
            />
          </div>

          {/* Customer Chat Password */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-1">Customer Chat Password</h2>
            <p className="text-gray-400 text-sm mb-4">
              Password your customers need to enter to access the chat page.
            </p>
            <input
              type="text"
              value={chatPassword}
              onChange={(e) => setChatPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Set a password for customers..."
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-8 py-2.5 rounded-lg transition-colors"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {saved && (
              <span className="text-green-400 text-sm">Settings saved successfully!</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
