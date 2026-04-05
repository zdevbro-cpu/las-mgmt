/**
 * 위치정보(lat/lng)가 없는 지점에 네이버 지오코딩으로 좌표를 채우는 스크립트
 * 실행: node scripts/backfill_geocode.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// .env 직접 파싱 (dotenv 패키지 없이)
const loadEnv = () => {
  const envMap = {};
  for (const file of ['.env', '.env.local']) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        envMap[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    } catch {
      // 파일 없으면 무시
    }
  }
  return envMap;
};

const env = loadEnv();

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const clientId = env.VITE_NAVER_MAP_CLIENT_ID?.trim();
const clientSecret = env.VITE_NAVER_MAP_CLIENT_SECRET?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ .env에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 없습니다.');
  process.exit(1);
}
if (!clientId || !clientSecret) {
  console.error('❌ .env에 VITE_NAVER_MAP_CLIENT_ID / VITE_NAVER_MAP_CLIENT_SECRET 가 없습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const isMissing = (val) => {
  if (val === null || val === undefined) return true;
  const num = Number(val);
  return !Number.isFinite(num) || num === 0;
};

const normalize = (s) =>
  s.replace(/사구/g, '서구')
   .replace(/인천시/g, '인천광역시')
   .replace(/\([^)]*\)/g, ' ')
   .replace(/\s+/g, ' ')
   .trim();

const buildVariants = (address, name) => {
  const variants = new Set();
  const push = (s) => { const v = normalize(s); if (v) variants.add(v); };

  const base = normalize(address);
  push(address);
  push(base);
  push(base.replace(/\s*\d+\s*(동|호)\s*/g, ' '));
  push(base.replace(/(지하|지상)?\s*\d+\s*층|B\s*\d+\s*층|B\s*\d+/g, ' '));

  const regionMap = {
    '서울': '서울특별시', '부산': '부산광역시', '대구': '대구광역시',
    '인천': '인천광역시', '광주': '광주광역시', '대전': '대전광역시',
    '울산': '울산광역시', '경기': '경기도', '강원': '강원도',
    '충북': '충청북도', '충남': '충청남도', '전북': '전라북도',
    '전남': '전라남도', '경북': '경상북도', '경남': '경상남도',
  };
  const regionKey = Object.keys(regionMap).find((k) => base.startsWith(`${k} `));
  if (regionKey) push(base.replace(`${regionKey} `, `${regionMap[regionKey]} `));

  const roadMatch = base.match(/(.+?(로|길|대로)\s*\d+(?:-\d+)?)/);
  if (roadMatch) push(roadMatch[1]);

  if (name) { push(name); push(`${base.split(' ')[0]} ${name}`); }

  return Array.from(variants);
};

const geocodeOne = async (query) => {
  const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'X-NCP-APIGW-API-KEY-ID': clientId,
      'X-NCP-APIGW-API-KEY': clientSecret,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!data.addresses?.length) return null;

  const lat = parseFloat(data.addresses[0].y);
  const lng = parseFloat(data.addresses[0].x);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

const geocode = async (address, name) => {
  for (const variant of buildVariants(address, name)) {
    const result = await geocodeOne(variant);
    if (result) return result;
  }
  return null;
};

const run = async () => {
  console.log('🔍 좌표 없는 지점 조회 중...');

  const { data, error } = await supabase.from('branches').select('*');
  if (error) {
    console.error('❌ 지점 조회 실패:', error.message);
    process.exit(1);
  }

  const targets = data.filter(
    (b) => (isMissing(b.lat) || isMissing(b.lng)) && b.address?.trim()
  );

  if (targets.length === 0) {
    console.log('✅ 모든 지점에 위치정보가 있습니다.');
    return;
  }

  console.log(`📍 ${targets.length}개 지점 지오코딩 시작\n`);

  let success = 0;
  let fail = 0;

  for (const branch of targets) {
    process.stdout.write(`  [${branch.name}] ${branch.address} → `);

    const coords = await geocode(branch.address, branch.name);
    if (!coords) {
      console.log('❌ 결과 없음');
      fail++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('branches')
      .update({ lat: coords.lat, lng: coords.lng })
      .eq('id', branch.id);

    if (updateError) {
      console.log(`❌ 저장 실패: ${updateError.message}`);
      fail++;
    } else {
      console.log(`✅ ${coords.lat}, ${coords.lng}`);
      success++;
    }

    // 레이트 리밋 방지
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n완료: 성공 ${success}개 / 실패 ${fail}개`);
};

run().catch((err) => {
  console.error('❌ 스크립트 오류:', err);
  process.exit(1);
});
