import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yjwxkfhqefdeuzeluihr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqd3hrZmhxZWZkZXV6ZWx1aWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjM5MjEsImV4cCI6MjA4NjUzOTkyMX0.s-cV9ZvdbTrjuY4VQqR5dIzVfHl670nJ1-Zirxs7vRM'
)

async function run() {
  const { data: authors } = await supabase.from('master_authors').select('*').limit(1)
  const { data: pubs } = await supabase.from('master_publications').select('*').limit(1)
  
  if (authors && authors.length > 0) {
    console.log("MASTER_AUTHORS FIELDS:")
    console.log(Object.keys(authors[0]))
  }
  if (pubs && pubs.length > 0) {
    console.log("MASTER_PUBLICATIONS FIELDS:")
    console.log(Object.keys(pubs[0]))
  }
}

run()
