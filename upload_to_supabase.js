const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseKey = 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09'; // Using the key provided by user

const supabase = createClient(supabaseUrl, supabaseKey);

async function upload() {
  const data = JSON.parse(fs.readFileSync('./src/app/parsed_products.json', 'utf-8'));
  
  console.log(`Uploading ${data.length} products to Supabase...`);
  
  for (const product of data) {
    const { error } = await supabase.from('products').upsert(product);
    if (error) {
      console.error(`Error uploading product ${product.id}:`, error.message);
    } else {
      console.log(`Successfully uploaded product: ${product.name}`);
    }
  }
  console.log('Upload complete.');
}

upload();
