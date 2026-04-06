import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * 전사 매출 데이터를 바탕으로 단말기별 일일 매출 보고서를 생성합니다.
 * @param {Array} salesData - 매출 데이터 배열
 * @param {string} selectedDate - 보고서 대상 날짜 (YYYY-MM-DD)
 */
export const generateDailySalesReport = async (salesData, selectedDate) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('일일 매출보고');

  // 데이터 그룹화: 단말기 번호별
  const terminalGroups = {};
  salesData.forEach(sale => {
    let paymentInfo = {};
    try {
      paymentInfo = typeof sale.payment_info === 'string' 
        ? JSON.parse(sale.payment_info) 
        : (sale.payment_info || {});
    } catch (e) {
      console.error('Payment info parsing error', e);
    }

    // 단말기 번호 추출 (첫 번째 카드 정보에서 가져오거나 미지정 처리)
    const terminalNo = paymentInfo.cards?.[0]?.terminalNo || '미지정';
    if (!terminalGroups[terminalNo]) {
      terminalGroups[terminalNo] = [];
    }
    terminalGroups[terminalNo].push({ ...sale, parsedPaymentInfo: paymentInfo });
  });

  let currentRow = 1;

  // 단말기별로 섹션 생성
  for (const [terminalNo, data] of Object.entries(terminalGroups)) {
    // 1. 타이틀 영역
    const titleRow = worksheet.getRow(currentRow);
    titleRow.values = ['라벤 구독회원 일일 매출보고', '', '', `단말기 번호: ${terminalNo}`];
    worksheet.mergeCells(currentRow, 1, currentRow, 3);
    titleRow.font = { name: '돋움', size: 14, bold: true };
    titleRow.alignment = { vertical: 'middle', horizontal: 'left' };
    currentRow++;

    // 2. 메타 정보 영역 (소속, 날짜)
    const metaRow = worksheet.getRow(currentRow);
    const dateFormatted = new Date(selectedDate).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });
    metaRow.values = [`소속 : ${data[0]?.branch_name || '전체'}`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', `${dateFormatted}`];
    worksheet.mergeCells(currentRow, 1, currentRow, 4);
    worksheet.mergeCells(currentRow, 17, currentRow, 22);
    metaRow.font = { name: '돋움', size: 10, bold: true };
    metaRow.alignment = { vertical: 'middle' };
    currentRow++;

    // 3. 테이블 헤더 (구독회원 정보, 한글버전, 영문버전, 결제 정보 등)
    // 3.1 상단 대분류 헤더
    const header1 = worksheet.getRow(currentRow);
    header1.values = [
      '순번', '구독회원 정보', '', '', '', 
      '한글버전', '', '', '', 
      '영문버전', '', '', '', 
      '결제 정보', '', '', '', '', '', 
      '판매자'
    ];
    worksheet.mergeCells(currentRow, 1, currentRow + 1, 1); // 순번
    worksheet.mergeCells(currentRow, 2, currentRow, 5);     // 구독회원 정보
    worksheet.mergeCells(currentRow, 6, currentRow, 9);     // 한글버전
    worksheet.mergeCells(currentRow, 10, currentRow, 13);   // 영문버전
    worksheet.mergeCells(currentRow, 14, currentRow, 19);   // 결제 정보
    worksheet.mergeCells(currentRow, 20, currentRow + 1, 20); // 판매자

    // 3.2 하단 중분류 헤더
    const header2 = worksheet.getRow(currentRow + 1);
    header2.values = [
      '', '이름', '생년월일', '핸드폰', '주소', 
      'K2', 'K5', 'S2', 'G1', 
      'K2', 'K5', 'S2', 'G1', 
      '합계', '현금', '카드', '카드명', '승인번호', '카드번호'
    ];

    // 헤더 스타일링
    [header1, header2].forEach(row => {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        cell.font = { name: '돋움', size: 9, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });
    currentRow += 2;

    // 4. 데이터 영역
    let terminalTotal = 0;
    data.forEach((sale, index) => {
      const row = worksheet.getRow(currentRow);
      const info = sale.parsedPaymentInfo;

      // 버전별 체크 로직
      const getItemFlag = (lang, ser) => {
        const found = info.items?.find(i => i.language === lang && i.series === ser);
        return found ? '○' : '';
      };

      const cleanNum = (val) => {
        if (!val) return 0;
        const cleaned = val.toString().replace(/[^0-9-]/g, "");
        return parseInt(cleaned, 10) || 0;
      };

      const cardInfo = info.cards?.[0] || {};
      const cashAmount = info.cash ? cleanNum(info.cash.amount) : 0;
      const cardAmount = info.cards ? info.cards.reduce((sum, c) => sum + cleanNum(c.amount), 0) : 0;
      
      const cardAmounts = info.cards ? info.cards.map(c => cleanNum(c.amount).toLocaleString('ko-KR')).join('\r\n') : '';
      const cardIssuers = info.cards ? info.cards.map(c => c.issuer || '-').join('\r\n') : '';
      const cardApprovals = info.cards ? info.cards.map(c => c.approvalNo || '-').join('\r\n') : '';
      const cardNumbers = info.cards ? info.cards.map(c => (c.number ? c.number.join('-') : '----')).join('\r\n') : '';

      row.values = [
        index + 1,
        sale.customer_name || '-',
        sale.age || '-',
        sale.phone || '-',
        sale.address || '-',
        getItemFlag('한글', 'K2'), getItemFlag('한글', 'K5'), getItemFlag('한글', 'S2'), getItemFlag('한글', 'G1'),
        getItemFlag('영문', 'K2'), getItemFlag('영문', 'K5'), getItemFlag('영문', 'S2'), getItemFlag('영문', 'G1'),
        parseInt(sale.deposit_amount || 0),
        cashAmount.toLocaleString('ko-KR'), // 현금 콤마 추가
        cardAmounts, // 개별 카드 금액 리스트 (줄바꿈 포함)
        cardIssuers,  // 개별 카드사 리스트 (줄바꿈 포함)
        cardApprovals, // 개별 승인번호 리스트 (줄바꿈 포함)
        cardNumbers,  // 개별 카드번호 리스트 (줄바꿈 포함)
        sale.user_name || sale.seller_name || '-'
      ];

      // 다중 결제인 경우 행 높이 조절
      if (info.cards && info.cards.length > 1) {
        row.height = 15 * info.cards.length + 10;
      }

      terminalTotal += parseInt(sale.deposit_amount || 0);

      row.eachCell(cell => {
        const colIdx = cell.col;
        
        // 기본 스타일 설정
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        cell.font = { name: '돋움', size: 9 };

        // 정렬 및 줄바꿈 설정 통합
        const isAmountCol = colIdx >= 14 && colIdx <= 16;
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: isAmountCol ? 'right' : 'center', 
          wrapText: true 
        };

        // 금액 포맷 (단일 숫자일 때 작동하도록 설정하되 문자열은 무시됨)
        if (isAmountCol) {
          cell.numFmt = '#,##0';
        }
      });
      
      currentRow++;
    });

    // 5. 단말기별 합계행 추가
    const totalRow = worksheet.getRow(currentRow);
    totalRow.values = ['소계 (단말기 합계)', '', '', '', '', '', '', '', '', '', '', '', '', terminalTotal];
    worksheet.mergeCells(currentRow, 1, currentRow, 13);
    totalRow.font = { name: '돋움', size: 9, bold: true };
    totalRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE0' } };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });
    const subTotalCell = totalRow.getCell(14);
    subTotalCell.alignment = { horizontal: 'right' };
    subTotalCell.numFmt = '#,##0';

    currentRow += 3; // 다음 단말기 그룹 간 간격
  }

  // 컬럼 너비 설정
  worksheet.getColumn(1).width = 5;   // 순번
  worksheet.getColumn(2).width = 10;  // 이름
  worksheet.getColumn(3).width = 12;  // 생년월일
  worksheet.getColumn(4).width = 15;  // 핸드폰
  worksheet.getColumn(5).width = 30;  // 주소
  worksheet.getColumn(14).width = 12; // 합계
  worksheet.getColumn(15).width = 12; // 현금
  worksheet.getColumn(16).width = 12; // 카드
  worksheet.getColumn(17).width = 10; // 카드명
  worksheet.getColumn(18).width = 15; // 승인번호
  worksheet.getColumn(19).width = 20; // 카드번호
  worksheet.getColumn(20).width = 10; // 판매자

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `매출현황보고서_${selectedDate}.xlsx`);
};
