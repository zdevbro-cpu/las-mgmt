// 송장 형태로 인쇄 - 수정된 버전
  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
      return
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>배송 송장</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Malgun Gothic', sans-serif; 
            padding: 0;
            line-height: 1.4;
          }
          
          @page {
            size: A4;
            margin: 10mm;
          }
          
          .page {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 5mm;
            page-break-after: always;
            padding: 5mm;
          }
          
          .page:last-child {
            page-break-after: auto;
          }
          
          .invoice {
            border: 2px solid #249689;
            padding: 5mm;
            background: white;
            border-radius: 3mm;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          
          .invoice-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 3mm;
            margin-bottom: 3mm;
          }
          
          .invoice-header h1 {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 1mm;
          }
          
          .invoice-number {
            font-size: 9pt;
            color: #666;
          }
          
          .section {
            margin-bottom: 3mm;
          }
          
          .section-title {
            font-size: 10pt;
            font-weight: bold;
            background-color: #f0f0f0;
            padding: 1.5mm;
            margin-bottom: 1.5mm;
            border-left: 3mm solid #249689;
          }
          
          .field {
            display: flex;
            padding: 1mm 0;
            font-size: 9pt;
          }
          
          .field-label {
            font-weight: bold;
            width: 18mm;
            flex-shrink: 0;
          }
          
          .field-value {
            flex: 1;
            word-break: break-all;
          }
          
          .order-box {
            border: 1px solid #ddd;
            padding: 2mm;
            background-color: #fafafa;
            min-height: 15mm;
            max-height: 25mm;
            font-size: 8pt;
            white-space: pre-wrap;
            word-break: break-word;
            overflow: hidden;
          }
          
          .footer {
            margin-top: auto;
            padding-top: 2mm;
            border-top: 1px dashed #ccc;
            text-align: center;
            font-size: 7pt;
            color: #666;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .page {
              page-break-after: always;
            }
            .page:last-child {
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        ${(() => {
          let html = ''
          for (let i = 0; i < selectedItems.length; i += 4) {
            html += '<div class="page">'
            for (let j = i; j < Math.min(i + 4, selectedItems.length); j++) {
              const item = selectedItems[j]
              html += `
                <div class="invoice">
                  <div class="invoice-header">
                    <h1>📦 배송 송장</h1>
                    <div class="invoice-number">No. ${String(j + 1).padStart(4, '0')}</div>
                  </div>
                  
                  <div class="section">
                    <div class="section-title">📍 수취인 정보</div>
                    <div class="field">
                      <div class="field-label">성명</div>
                      <div class="field-value">${item.customer_name || '-'}</div>
                    </div>
                    <div class="field">
                      <div class="field-label">연락처</div>
                      <div class="field-value">${item.customer_phone || '-'}</div>
                    </div>
                    <div class="field">
                      <div class="field-label">주소</div>
                      <div class="field-value">${item.address || '-'}</div>
                    </div>
                  </div>
                  
                  <div class="section">
                    <div class="section-title">📝 주문 정보</div>
                    <div class="field">
                      <div class="field-label">주문일</div>
                      <div class="field-value">${formatDate(item.created_at)}</div>
                    </div>
                    <div class="field">
                      <div class="field-label">수량</div>
                      <div class="field-value">${item.quantity || '-'}개</div>
                    </div>
                    <div style="margin-top: 1.5mm;">
                      <div class="field-label" style="margin-bottom: 1mm;">주문내역</div>
                      <div class="order-box">${item.order_info || '주문 정보 없음'}</div>
                    </div>
                  </div>
                  
                  <div class="footer">
                    LAS Book Store · 배송 송장<br/>
                    발행일: ${new Date().toLocaleDateString('ko-KR')}
                  </div>
                </div>
              `
            }
            html += '</div>'
          }
          return html
        })()}
        
        <script>
          // 인쇄 후 자동으로 창 닫기
          window.onload = function() {
            // 페이지 로드 후 잠시 대기 (렌더링 완료 대기)
            setTimeout(function() {
              window.print();
            }, 500);
          }

          // 인쇄 다이얼로그가 닫힌 후 처리
          window.onafterprint = function() {
            window.close();
          };

          // 인쇄 취소 감지 (Safari, 구형 브라우저용)
          if (window.matchMedia) {
            var mediaQueryList = window.matchMedia('print');
            mediaQueryList.addListener(function(mql) {
              if (!mql.matches) {
                // 인쇄 모드가 아니면 (인쇄 완료 또는 취소)
                setTimeout(function() {
                  window.close();
                }, 100);
              }
            });
          }

          // 추가 안전장치: 사용자가 ESC나 취소를 눌렀을 때
          window.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
              window.close();
            }
          });

          // 포커스가 다시 돌아왔을 때 (인쇄 완료 후)
          var printExecuted = false;
          window.addEventListener('focus', function() {
            if (printExecuted) {
              setTimeout(function() {
                window.close();
              }, 500);
            }
          });

          // print() 실행 추적
          window.addEventListener('beforeprint', function() {
            printExecuted = true;
          });
        </script>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
  }