import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// 엑셀 데이터 정의 (헤더 + 예시 데이터)
const data = [
  { "언어": "한글", "시리즈": "K2", "수량": 1 },
  { "언어": "영어", "시리즈": "G1", "수량": 2 },
  { "언어": "한글", "시리즈": "S1", "수량": 1 }
];

// 워크시트 생성
const worksheet = XLSX.utils.json_to_sheet(data);

// 워크북 생성 및 워크시트 추가
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "구매상품목록");

// 저장 경로 설정
const docsPath = 'c:/ProjectCode/las-mgmt/docs';
if (!fs.existsSync(docsPath)) {
  fs.mkdirSync(docsPath, { recursive: true });
}

const filePath = path.join(docsPath, '구매상품_업로드_양식.xlsx');

// 파일 쓰기
XLSX.writeFile(workbook, filePath);

console.log(`Excel template created successfully at ${filePath}`);
