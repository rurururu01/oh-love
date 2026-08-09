import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://embhtuslyxitahcducsr.supabase.co';
const supabaseKey = 'sb_publishable_monbW26tQNbV7DXmmSRhAQ_qQIgdmUk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestLetter() {
  const slug = 'test-spotify';
  const { data, error } = await supabase
    .from('letters')
    .upsert([
      {
        slug: slug,
        sender_name: 'AI System Test',
        recipient_name: 'User',
        content: 'This is a test letter for the Spotify embed feature.',
        music_url: 'https://open.spotify.com/track/0ug5NqcwcFR2xrfTkc7k8e?si=9987a9f3535d4f76'
      }
    ], { onConflict: 'slug' });
  
  if (error) {
    console.error('Error inserting test letter:', error);
  } else {
    console.log('Successfully created test letter! Slug: test-spotify');
  }
}

createTestLetter();
