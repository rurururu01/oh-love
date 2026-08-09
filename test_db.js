const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://embhtuslyxitahcducsr.supabase.co';
const supabaseKey = 'sb_publishable_monbW26tQNbV7DXmmSRhAQ_qQIgdmUk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Memulai pengetesan koneksi Supabase...");
  
  const slug = Math.random().toString(36).substring(2, 8);
  console.log("1. Mencoba Insert Data (Membuat surat dengan slug:", slug, ")");
  
  const { data, error } = await supabase
    .from('letters')
    .insert([
      {
        slug,
        sender_name: "AI Mentor",
        recipient_name: "Kamu",
        content: "Ini adalah pesan percobaan dari sistem untuk mengecek apakah Supabase sudah terkoneksi.",
        theme: "default"
      }
    ])
    .select();

  if (error) {
    console.error("❌ Gagal Insert:", error.message);
    return;
  }
  console.log("✅ Sukses Insert Data!");

  console.log("2. Mencoba Membaca Data...");
  const { data: readData, error: readError } = await supabase
    .from('letters')
    .select('slug, sender_name, recipient_name')
    .eq('slug', slug)
    .single();

  if (readError) {
    console.error("❌ Gagal Membaca Data:", readError.message);
  } else {
    console.log("✅ Berhasil Membaca Data:", readData);
    console.log("🥳 SEMUA TES BERHASIL!");
  }
}

test();
