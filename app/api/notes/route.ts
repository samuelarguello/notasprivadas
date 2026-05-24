import { NextResponse } from 'next/server';
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const MAX_NOTE_SIZE = 200_000;

function randomId(length = 10) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, v => alphabet[v % alphabet.length]).join('');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const encrypted_note = String(body.encrypted_note || '');
    const iv = String(body.iv || '');
    const salt = String(body.salt || '');

    if (!encrypted_note || !iv || !salt) {
      return NextResponse.json({ error: 'Faltan datos cifrados.' }, { status: 400 });
    }

    if (encrypted_note.length > MAX_NOTE_SIZE) {
      return NextResponse.json({ error: 'La nota es demasiado grande.' }, { status: 413 });
    }

    const ttlHours = Number(process.env.NOTE_TTL_HOURS || 72);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const id = randomId();
      const { error } = await supabaseAdmin.from('notes').insert({
        id,
        encrypted_note,
        iv,
        salt,
        expires_at: expiresAt
      });

      if (!error) return NextResponse.json({ id, expires_at: expiresAt });
      if (error.code !== '23505') throw error;
    }

    return NextResponse.json({ error: 'No se pudo crear un identificador unico.' }, { status: 500 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'No se pudo guardar la nota.' }, { status: 500 });
  }
}
