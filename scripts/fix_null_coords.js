import { createClient } from '@supabase/supabase-js';

// Node 20+ has global fetch, no need for node-fetch
// Use process.env directly (passed via --env-file)

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const clientId = process.env.VITE_NAVER_MAP_CLIENT_ID;
const clientSecret = process.env.VITE_NAVER_MAP_CLIENT_SECRET;

async function requestGeocode(query) {
  const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret,
      },
    });
    if (!res.ok) {
       const errBody = await res.text();
       console.error(`API Error for ${query}: ${res.status} ${errBody}`);
       return null;
    }
    const data = await res.json();
    if (data.addresses && data.addresses.length > 0) {
      return {
        lat: parseFloat(data.addresses[0].y),
        lng: parseFloat(data.addresses[0].x),
      };
    }
  } catch (err) {
    console.error(`Geocode error for ${query}:`, err.message);
  }
  return null;
}

async function fixNullCoordinates() {
  console.log('Fetching branches with NULL coordinates...');
  const { data: branches, error } = await supabase
    .from('branches')
    .select('id, name, address')
    .or('lat.is.null,lng.is.null');

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Found ${branches.length} branches to fix.`);

  for (const branch of branches) {
    if (!branch.address) {
       console.log(`Skipping branch ${branch.name} (no address)`);
       continue;
    }
    
    console.log(`\n--- Processing branch: ${branch.name} ---`);
    console.log(`Address: ${branch.address}`);
    
    // Try different variations
    const variations = [
      branch.address,
      branch.address.replace(/\s+/g, ' '), // Normalize spaces
      branch.address.split(',')[0].trim(), // Remove detail address after comma
      branch.address.split('(')[0].trim(), // Remove info in brackets
      branch.address.replace(/\d+번길/g, '').replace(/\s+/g, ' ').trim(), // Remove 'XX-gil' part and try
    ];

    let coords = null;
    for (const v of variations) {
      console.log(`Trying variant: ${v}`);
      coords = await requestGeocode(v);
      if (coords) break;
    }
    
    if (!coords) {
       // Last resort: search by city + name
       const cityPart = branch.address.split(' ').slice(0, 2).join(' ');
       const search = `${cityPart} ${branch.name}`;
       console.log(`Retrying with branch name: ${search}`);
       coords = await requestGeocode(search);
    }

    if (coords) {
      console.log(`Success! Updating ${branch.name} with ${coords.lat}, ${coords.lng}`);
      const { error: updateError } = await supabase
        .from('branches')
        .update({ lat: coords.lat, lng: coords.lng })
        .eq('id', branch.id);
      
      if (updateError) console.error(`Update error for ${branch.name}:`, updateError);
    } else {
      console.error(`FAILED to find coordinates for ${branch.name}`);
    }
  }
  
  console.log('\nFinished processing.');
  process.exit(0);
}

fixNullCoordinates();
