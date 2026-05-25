'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  return base64ToBytes(padded);
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
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 250000,
      hash: 'SHA-256'
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

export default function ReadNote({ params }: { params: { id: string } }) {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('Abriendo nota...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadNote() {
      try {
        const id = params.id;
        const hash = window.location.hash.replace(/^#/, '');

        if (!hash) {
          throw new Error('Falta la clave de descifrado en el enlace.');
        }

        const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, {
          cache: 'no-store'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'La nota no existe o ya ha sido leída.');
        }

        const key = await deriveKey(
          base64UrlToBytes(hash),
          base64ToBytes(data.salt)
        );

        const decrypted = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: base64ToBytes(data.iv)
          },
          key,
          base64ToBytes(data.encrypted_note)
        );

        setNote(new TextDecoder().decode(decrypted));
        setStatus('Nota abierta. Ya ha sido destruida del servidor.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo abrir la nota.');
        setStatus('');
      }
    }

    loadNote();
  }, [params.id]);

  return (
    <main>
      <section className="card">
        <h1>Nota privada</h1>
        {status && <p>{status}</p>}
        {error && <p className="error">{error}</p>}
        {note && <div className="note">{note}</div>}
        <p style={{ marginTop: 20 }}>
          <Link href="/">Crear otra nota</Link>
        </p>
      </section>
    </main>
  );
}
