import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('notes')
      .select('id, encrypted_note, iv, salt, expires_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'No se pudo leer la nota.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'La nota no existe o ya ha sido leída.' }, { status: 404 });
    }

    await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', id);

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: 'La nota ha caducado.' }, { status: 410 });
    }

    return NextResponse.json({
      encrypted_note: data.encrypted_note,
      iv: data.iv,
      salt: data.salt
    });
  } catch {
    return NextResponse.json({ error: 'Error inesperado al abrir la nota.' }, { status: 500 });
  }
}
