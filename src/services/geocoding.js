/**
 * 주소를 위도/경도로 변환 (네이버 지오코딩 API)
 * @param {string} address - 주소 문자열
 * @param {string} [branchName] - 지점명 (fallback 검색용)
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export const addressToCoordinates = async (address, branchName) => {
  if (!address || !address.trim()) return null;

  const variants = buildAddressVariants(address, branchName);

  for (const variant of variants) {
    console.log('[Geocoding] Trying variant:', variant);
    const result = await requestGeocode(variant);
    if (result) {
      console.log('[Geocoding] Success with variant:', variant);
      return result;
    }
  }

  console.warn('[Geocoding] No results for:', address);
  return null;
};

const requestGeocode = async (query) => {
  try {
    const url = `/api/naver-geocode?query=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.addresses && data.addresses.length > 0) {
      return {
        lat: parseFloat(data.addresses[0].y),
        lng: parseFloat(data.addresses[0].x),
      };
    }
  } catch (err) {
    console.error('[Geocoding] Request error:', err);
  }
  return null;
};

const buildAddressVariants = (input, name) => {
  const variants = new Set();

  const normalize = (s) =>
    s
      .replace(/사구/g, '서구')
      .replace(/인천시/g, '인천광역시')
      .replace(/\([^)]*\)/g, ' ')
      .replace(/[，,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const regionMap = {
    '서울': '서울특별시', '부산': '부산광역시', '대구': '대구광역시',
    '인천': '인천광역시', '광주': '광주광역시', '대전': '대전광역시',
    '울산': '울산광역시', '세종': '세종특별자치시', '경기': '경기도',
    '강원': '강원도', '충북': '충청북도', '충남': '충청남도',
    '전북': '전라북도', '전남': '전라남도', '경북': '경상북도',
    '경남': '경상남도', '제주': '제주특별자치도',
  };

  const push = (s) => { const v = normalize(s); if (v) variants.add(v); };

  const base = normalize(input);
  push(input);
  push(base);

  // 공백 제거 버전 (가끔 네이버는 공백 없는 검색을 더 잘함)
  push(base.replace(/\s/g, ''));

  // 동/호 제거
  push(base.replace(/\s*\d+\s*(동|호)\s*/g, ' '));
  // 층 제거
  push(base.replace(/(지하|지상)?\s*\d+\s*층|B\s*\d+\s*층|B\s*\d+/g, ' '));

  // 번길 관련 처리 (공백 허용)
  if (base.includes('번길')) {
    push(base.replace(/(\d+)번길/, ' $1번길 '));
  }

  // 지역명 확장
  const regionKey = Object.keys(regionMap).find((k) => base.startsWith(`${k} `));
  if (regionKey) push(base.replace(`${regionKey} `, `${regionMap[regionKey]} `));

  // 도로명만 추출
  const roadMatch = base.match(/(.+?(로|길|대로)\s*\d+(?:-\d+)?)/);
  if (roadMatch) push(roadMatch[1]);

  // 지점명으로 검색
  if (name) {
    push(name);
    const city = base.split(' ')[0];
    push(`${city} ${name}`);
    push(`${city} ${normalize(name)}`);
  }

  return Array.from(variants);
};
