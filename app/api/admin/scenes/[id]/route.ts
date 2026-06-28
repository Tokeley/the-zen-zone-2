import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

import { createClient } from '@/src/lib/supabase/server';
import { createAdminClient } from '@/src/lib/supabase';
import { deleteSceneVideo } from '@/src/lib/r2';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Scene id is required' }, { status: 400 });
  }

  try {
    await deleteSceneVideo(id);
  } catch (err) {
    console.error('[admin/scenes] R2 delete error:', err);
    return NextResponse.json({ error: 'Failed to delete scene video from R2' }, { status: 500 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('scenes') as any).delete().eq('id', id);

  if (error) {
    console.error('[admin/scenes] delete error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
