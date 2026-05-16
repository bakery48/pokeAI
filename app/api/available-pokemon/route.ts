import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('available_pokemon')
    .select('id, name_ja, type1, type2, ability1, ability2, ability_hidden, national_dex_id')
    .order('id')

  if (error) {
    // national_dex_id カラムが未作成の場合のフォールバック
    const { data: data2, error: error2 } = await supabase
      .from('available_pokemon')
      .select('id, name_ja, type1, type2, ability1, ability2, ability_hidden')
      .order('id')
    if (error2) return NextResponse.json({ error: error2.message }, { status: 500 })
    return NextResponse.json(data2)
  }

  return NextResponse.json(data)
}
