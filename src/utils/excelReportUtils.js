import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * 템플릿(일일매출현황취합.xlsx) 포맷을 그대로 유지하여 매출보고서를 생성합니다.
 */
export const generateDailySalesReport = async (salesData, startDate, endDate) => {
  // 1. 템플릿 로드
  const res = await fetch('/일일매출현황취합.xlsx');
  const arrayBuffer = await res.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const templateWs = workbook.worksheets[0];

  // 2. 지점·단말기별 그룹화 (지점명 + 단말기번호 합성키)
  const terminalGroups = {};
  salesData.forEach(sale => {
    let info = {};
    try {
      info = typeof sale.payment_info === 'string'
        ? JSON.parse(sale.payment_info)
        : (sale.payment_info || {});
    } catch {}
    const branchName = sale.branch_name || '미지정';
    const terminalNo = info.cards?.[0]?.terminalNo || '미지정';
    const key = `${branchName}||${terminalNo}`;
    if (!terminalGroups[key]) terminalGroups[key] = { branch: branchName, terminalNo, sales: [] };
    terminalGroups[key].sales.push({ ...sale, info });
  });

  // 3. 날짜 포맷: 단일 날짜 또는 시작일~종료일 범위 표시
  const fmt = (d) => new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });
  const todayLocal = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const sDate = startDate || endDate || todayLocal;
  const eDate = endDate || startDate || todayLocal;
  const isRange = sDate !== eDate;
  const dateStr = isRange ? `${fmt(sDate)} ~ ${fmt(eDate)}` : fmt(sDate);

  // 4. 헬퍼: 셀 스타일 안전 복사
  const copyStyle = (cell) => {
    try { return JSON.parse(JSON.stringify(cell.style)); } catch { return {}; }
  };

  // 5. 헬퍼: 템플릿 한 행 전체를 출력 시트에 복사 (값 제외)
  const copyRowStyle = (srcRow, dstRow) => {
    srcRow.eachCell({ includeEmpty: true }, (srcCell, col) => {
      const dstCell = dstRow.getCell(col);
      dstCell.style = copyStyle(srcCell);
    });
    dstRow.height = srcRow.height || 15;
  };

  // 6. 헬퍼: 카드 정보 여러 장 -> 줄바꿈 문자열 (최대 3개)
  const multiLine = (cards, fn) => (cards || []).slice(0, 3).map(fn).join('\n');

  // 7. 항목 체크 (items 배열에서 언어+시리즈 매칭)
  const flag = (items, lang, ser) =>
    items?.find(i => i.language === lang && i.series === ser) ? 'O' : '';

  // 8. 금액 정규화
  const toNum = (v) => Number(String(v || '0').replace(/[^0-9]/g, '')) || 0;

  // 9. 출력용 워크시트 생성 (템플릿 복제 후 데이터만 교체)
  const outputWb = new ExcelJS.Workbook();
  const outputWs = outputWb.addWorksheet('일일매출보고');

  // 컬럼 너비 복사 (A~T = 1~20)
  for (let c = 1; c <= 20; c++) {
    outputWs.getColumn(c).width = templateWs.getColumn(c).width || 10;
  }

  // 10. 템플릿 헤더 블록 구조 (rows 1~5 기준)
  //   row1: 타이틀 / 단말기번호
  //   row2: 소속 / 날짜
  //   row3: 대분류 헤더
  //   row4: 소분류 헤더
  //   row5: 단가행
  const HEADER_ROW_COUNT = 5;
  const TEMPLATE_DATA_START = 6; // 템플릿에서 데이터가 시작되는 행

  // 메인 처리: 지점명 가나다순 → 같은 지점 내 단말기번호 순으로 섹션 생성
  let outRow = 1;
  const terminals = Object.values(terminalGroups).sort((a, b) => {
    if (a.branch !== b.branch) return a.branch.localeCompare(b.branch, 'ko');
    return String(a.terminalNo).localeCompare(String(b.terminalNo), 'ko', { numeric: true });
  });

  for (let ti = 0; ti < terminals.length; ti++) {
    const { branch, terminalNo, sales: groupData } = terminals[ti];

    // --- 헤더 5행 복사 (스타일만) ---
    for (let hr = 1; hr <= HEADER_ROW_COUNT; hr++) {
      const srcRow = templateWs.getRow(hr);
      const dstRow = outputWs.getRow(outRow + hr - 1);
      copyRowStyle(srcRow, dstRow);
    }

    // 병합 정보 복사 (헤더 범위 내)
    templateWs._merges && Object.values(templateWs._merges).forEach(merge => {
      const m = merge.model;
      if (m.top >= 1 && m.bottom <= HEADER_ROW_COUNT) {
        try {
          outputWs.mergeCells(
            outRow + m.top - 1, m.left,
            outRow + m.bottom - 1, m.right
          );
        } catch {}
      }
    });

    // 헤더 값 채우기
    const r1 = outRow;
    outputWs.getCell(r1, 1).value = '라벤 구독회원 일일 매출보고';
    outputWs.getCell(r1, 5).value = `단말기 번호: ${terminalNo}`;

    const r2 = outRow + 1;
    outputWs.getCell(r2, 1).value = `소속 : ${branch}`;
    outputWs.getCell(r2, 14).value = `    ${dateStr}`;

    const r3 = outRow + 2;
    outputWs.getCell(r3, 1).value = '순번';
    outputWs.getCell(r3, 2).value = '구독회원 정보';
    outputWs.getCell(r3, 6).value = '한글버전';
    outputWs.getCell(r3, 10).value = '영문버전';
    outputWs.getCell(r3, 14).value = '결제 정보';
    outputWs.getCell(r3, 20).value = '판매자';

    const r4 = outRow + 3;
    ['', '이름', '생년\n월일', '핸드폰', '주소',
     'K2', 'K5', 'S2', 'G1',
     'K2', 'K5', 'S2', 'G1',
     '합계', '현금', '카드', '카드명', '승인번호', '카드번호', '판매자'
    ].forEach((v, i) => { outputWs.getCell(r4, i + 1).value = v; });

    const r5 = outRow + 4;
    [, , , , , '160만원', '160만원', '220만원', '340만원',
     '320만원', '320만원', '440만원', '680만원'
    ].forEach((v, i) => { if (v) outputWs.getCell(r5, i + 1).value = v; });

    outRow += HEADER_ROW_COUNT;

    // --- 데이터 행 ---
    // 템플릿 데이터행 스타일 참조 (row 6)
    const templateDataRow = templateWs.getRow(TEMPLATE_DATA_START);

    let sectionTotal = 0;

    groupData.forEach((sale, idx) => {
      const { info } = sale;
      const cards = info.cards || [];
      const items = info.items || [];
      const cash = info.cash;

      const cashAmt = cash ? toNum(cash.amount) : 0;
      const cardAmt = cards.reduce((s, c) => s + toNum(c.amount), 0);
      const total = toNum(sale.deposit_amount) || cashAmt + cardAmt;
      sectionTotal += total;

      const dstRow = outputWs.getRow(outRow);

      // 스타일 복사
      copyRowStyle(templateDataRow, dstRow);

      // 카드 정보가 있으면 행 높이 조정 (최대 3개 지원)
      if (cards.length > 0) {
        const lineCount = Math.min(cards.length, 3);
        dstRow.height = Math.max(30, 20 * lineCount);
      }

      dstRow.getCell(1).value  = idx + 1;                                   // 순번
      dstRow.getCell(2).value  = sale.customer_name || '-';                  // 이름
      dstRow.getCell(3).value  = sale.age ? String(sale.age) : '-';         // 생년월일
      dstRow.getCell(4).value  = sale.phone || '-';                          // 핸드폰
      dstRow.getCell(5).value  = sale.address || '-';                        // 주소
      dstRow.getCell(6).value  = flag(items, '한글', 'K2');
      dstRow.getCell(7).value  = flag(items, '한글', 'K5');
      dstRow.getCell(8).value  = flag(items, '한글', 'S2');
      dstRow.getCell(9).value  = flag(items, '한글', 'G1');
      dstRow.getCell(10).value = flag(items, '영문', 'K2');
      dstRow.getCell(11).value = flag(items, '영문', 'K5');
      dstRow.getCell(12).value = flag(items, '영문', 'S2');
      dstRow.getCell(13).value = flag(items, '영문', 'G1');
      dstRow.getCell(14).value = total;                                       // 합계
      dstRow.getCell(15).value = cashAmt || '';                               // 현금
      // 카드 (최대 3개까지 줄바꿈 표시)
      dstRow.getCell(16).value = cards.length > 0 
        ? multiLine(cards, c => toNum(c.amount).toLocaleString('ko-KR'))
        : '';
      dstRow.getCell(17).value = multiLine(cards, c => c.issuer || '-');     // 카드명
      dstRow.getCell(18).value = multiLine(cards, c => c.approvalNo || '-'); // 승인번호
      dstRow.getCell(19).value = multiLine(cards, c => c.number || c.cardNo || '');      // 카드번호
      dstRow.getCell(20).value = sale.seller_name || sale.user_name || '-';  // 판매자

      // 셀 정렬
      dstRow.eachCell({ includeEmpty: false }, (cell, col) => {
        cell.alignment = {
          vertical: 'middle',
          horizontal: (col >= 14 && col <= 16) ? 'right' : 'center',
          wrapText: true,
        };
      });

      outRow++;
    });

    // --- 소계행 ---
    const totalRow = outputWs.getRow(outRow);
    outputWs.mergeCells(outRow, 1, outRow, 13);
    totalRow.getCell(1).value = '소 계';
    totalRow.getCell(14).value = sectionTotal;
    totalRow.getCell(14).numFmt = '#,##0';
    totalRow.font = { name: '돋움', size: 9, bold: true };
    totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(14).alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.eachCell({ includeEmpty: false }, cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE0' } };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      };
    });

    outRow += 2; // 섹션 간격
  }

  // 11. 다운로드
  const buffer = await outputWb.xlsx.writeBuffer();
  const filename = isRange
    ? `매출보고서_${sDate}_${eDate}.xlsx`
    : `매출보고서_${sDate}.xlsx`;
  saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename
  );
};
