import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('notes')
      .select('id, encrypted_note, iv, salt, expires_at, read_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'La nota no existe o ya ha sido leida.' }, { status: 404 });
    }

    if (data.read_at || new Date(data.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from('notes').delete().eq('id', id);
      return NextResponse.json({ error: 'La nota ha caducado o ya ha sido leida.' }, { status: 410 });
    }

    await supabaseAdmin.from('notes').delete().eq('id', id);

    return NextResponse.json({
      encrypted_note: data.encrypted_note,
      iv: data.iv,
      salt: data.salt,
      expires_at: data.expires_at
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'No se pudo abrir la nota.' }, { status: 500 });
  }
}
