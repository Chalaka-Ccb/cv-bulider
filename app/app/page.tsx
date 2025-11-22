"use client";

import { useEffect, useState } from "react";

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

function fromBase64(b64: string) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importAesKey(raw: Uint8Array) {
  return window.crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptWithKey(plain: Uint8Array, rawKey: Uint8Array) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await importAesKey(rawKey);
  const cipher = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  return { iv: toBase64(iv), data: toBase64(new Uint8Array(cipher)) };
}

async function decryptWithKey(payload: { iv: string; data: string }, rawKey: Uint8Array) {
  const iv = fromBase64(payload.iv);
  const data = fromBase64(payload.data);
  const key = await importAesKey(rawKey);
  const plain = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new Uint8Array(plain);
}

export default function Home() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string>("");
  const [retrieved, setRetrieved] = useState<string | null>(null);
  const [providedKey, setProvidedKey] = useState<string>("");

  useEffect(() => {
    // If URL contains a hash, populate providedKey automatically (strip leading '#')
    if (typeof window !== "undefined") {
      const h = window.location.hash && window.location.hash.startsWith("#") ? window.location.hash.substring(1) : window.location.hash || "";
      if (h) setProvidedKey(h);
    }
  }, []);

  async function handleEncryptAndUpload() {
    setMessage(null);
    try {
      if (!file && !text.trim()) return setMessage("Enter text or choose a file to encrypt.");

      // Generate a fresh random 256-bit key (raw)
      const rawKey = window.crypto.getRandomValues(new Uint8Array(32));

      let payload: any = {};
      if (file) {
        const buf = new Uint8Array(await file.arrayBuffer());
        const enc = await encryptWithKey(buf, rawKey);
        payload = { ...enc, filename: file.name, type: file.type };
      } else {
        const encText = new TextEncoder().encode(text);
        const enc = await encryptWithKey(encText, rawKey);
        payload = { ...enc, type: "text/plain" };
      }

      const res = await fetch("http://localhost:4000/api/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const body = await res.json();
      setNoteId(body.id);

      // Build link with key in URL hash (base64 of raw key)
      const keyB64 = toBase64(rawKey);
      const link = `${window.location.origin}/#${keyB64}?id=${encodeURIComponent(body.id)}`;
      // For convenience, set providedKey and message with link
      setProvidedKey(keyB64);
      setMessage(`Uploaded — share this link: ${link}`);
    } catch (err: any) {
      setMessage(String(err.message || err));
    }
  }

  async function handleRetrieve() {
    setMessage(null);
    setRetrieved(null);
    try {
      // Determine id and key. If URL contains hash and query param, prefer those.
      let id = noteId;
      if (!id && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        id = params.get("id") || id;
      }
      if (!id) return setMessage("Enter note id or open link with id in query.");
      if (!providedKey) return setMessage("No key provided. Provide the key (from the link hash).");

      const res = await fetch(`http://localhost:4000/api/note/${encodeURIComponent(id)}`);
      if (res.status === 404) return setMessage("Note not found or already burned.");
      if (!res.ok) throw new Error("Failed to fetch note");
      const body = await res.json();
      const rawKey = fromBase64(providedKey);
      const decrypted = await decryptWithKey(body.payload, rawKey);
      if (body.payload.filename) {
        const blob = new Blob([decrypted], { type: body.payload.type || "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        setRetrieved(`File downloaded: ${body.payload.filename} — ${url}`);
      } else {
        setRetrieved(new TextDecoder().decode(decrypted));
      }
    } catch (err: any) {
      setMessage(String(err.message || err));
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <main className="mx-auto max-w-3xl bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold">BurnNote — Zero-knowledge burn-once notes</h1>
        <p className="text-zinc-600 mt-2">Encrypt in-browser (key never sent). Server stores only ciphertext+iv and cannot read your secret.</p>

        <section className="mt-6">
          <h2 className="font-semibold">Create a burn-once note</h2>
          <div className="mt-3 flex flex-col gap-3">
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Or type a note to encrypt" className="w-full h-24 p-2 border rounded" />
            <div className="flex gap-2">
              <button onClick={handleEncryptAndUpload} className="px-4 py-2 bg-blue-600 text-white rounded">Encrypt & Upload</button>
            </div>
            {message && <div className="text-sm text-zinc-800 mt-2 break-words">{message}</div>}
            {noteId && (
              <div className="text-sm">
                Stored note id: <code className="bg-zinc-100 p-1 rounded">{noteId}</code>
                <div className="text-xs text-zinc-600 mt-1">Share the full link and the key in the hash; the note will be deleted after one successful retrieval.</div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-semibold">Retrieve a note</h2>
          <div className="mt-3 flex flex-col gap-3">
            <input value={noteId} onChange={(e) => setNoteId(e.target.value)} placeholder="Note id (or open link)" className="w-full p-2 border rounded" />
            <input value={providedKey} onChange={(e) => setProvidedKey(e.target.value)} placeholder="Key (paste or open link with hash)" className="w-full p-2 border rounded" />
            <div className="flex gap-2">
              <button onClick={handleRetrieve} className="px-4 py-2 bg-green-600 text-white rounded">Retrieve (burns on read)</button>
            </div>
            {retrieved && <div className="mt-2 p-2 bg-zinc-50 rounded break-words">{retrieved}</div>}
            {message && <div className="text-sm text-red-600">{message}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
