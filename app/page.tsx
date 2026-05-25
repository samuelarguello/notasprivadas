'use client';

import { useState } from 'react';

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}
function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
function base64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function deriveKey(secret: Uint8Array, salt: Uint8Array) {
  const material = await crypto.subtle.importKey(
  'raw',
  secret.buffer as ArrayBuffer,
  'PBKDF2',
  false,
  ['deriveKey']
);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 250000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export default function Home() {
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function createNote() {
    setError('');
    setLink('');
    if (!note.trim()) return setError('Escribe una nota antes de enviarla.');
    setLoading(true);

    try {
      const secret = crypto.getRandomValues(new Uint8Array(32));
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(secret, salt);
      const encoded = new TextEncoder().encode(note);
      const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded));

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encrypted_note: bytesToBase64(encrypted), iv: bytesToBase64(iv), salt: bytesToBase64(salt) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo crear la nota.');

      const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      setLink(`${baseUrl}/note/${data.id}#${base64Url(secret)}`);
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link);
  }

  return (
    <main>
      <section className="card">
        <h1>Notas privadas</h1>
        <p>Escribe una nota. Se cifra en tu navegador, se guarda temporalmente y se destruye al abrirse una vez.</p>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Escribe aqui la nota privada..." />
        <div className="row" style={{ marginTop: 14 }}>
          <button onClick={createNote} disabled={loading}>{loading ? 'Creando...' : 'Crear enlace privado'}</button>
        </div>
        {error && <p className="error">{error}</p>}
        {link && (
          <div className="result">
            <p><strong>Enlace privado:</strong></p>
            <input readOnly value={link} onFocus={e => e.currentTarget.select()} />
            <div className="row" style={{ marginTop: 12 }}>
              <button className="secondary" onClick={copyLink}>Copiar enlace</button>
            </div>
            <p className="small">La clave de descifrado va despues de # y no se envia al servidor.</p>
          </div>
        )}
      </section>
    </main>
  );
}
