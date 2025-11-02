import React from 'react'
import OrderListCommon from './OrderListCommon'

export default function ShippingList({ user, onNavigate }) {
  const config = {
    // 컨테이너 설정
    containerClass: 'max-w-7xl mx-auto p-6',
    cardClass: 'bg-white rounded-lg shadow-lg p-6',
    headerClass: 'flex items-center justify-between mb-8',
    
    // 화면 설정
    title: '주문목록',
    showBackButton: true,
    backNavigation: 'Dashboard',
    backButtonText: '나가기',
    showBranchInfo: true,
    showBranchFilter: false,
    filterByBranch: true,
    
    // 검색 설정
    searchPlaceholder: '이름, 전화번호, 이메일로 검색',
    searchFields: ['customer_name', 'phone', 'email'],
    
    // 테이블 설정
    tableColumns: ['이름', '연락처', '주소', '주문정보', '주문일'],
    renderTableRow: (purchase, formatDate, formatPhoneNumber) => (
      <>
        <td className="px-3 py-3" style={{ fontSize: '14px' }}>
          {purchase.customer_name}
        </td>
        <td className="px-3 py-3" style={{ fontSize: '14px' }}>
          {formatPhoneNumber(purchase.phone)}
        </td>
        <td className="px-3 py-3" style={{ fontSize: '14px' }}>
          {purchase.address?.substring(0, 30)}{purchase.address?.length > 30 ? '...' : ''}
        </td>
        <td className="px-3 py-3" style={{ fontSize: '14px' }}>
          {purchase.order_details?.substring(0, 20)}{purchase.order_details?.length > 20 ? '...' : ''}
        </td>
        <td className="px-3 py-3" style={{ fontSize: '14px' }}>
          {formatDate(purchase.created_at)}
        </td>
      </>
    ),
    
    // 인쇄 설정
    printTitle: '배송 송장',
    printHeaderTitle: '📦 배송 송장',
    printSectionTitle: '📍 수취인 정보',
    printFooter: 'LAS Book Store · 배송 송장',
    showBranchInPrint: false,
    quantityUnit: '개',
    
    // 엑셀 설정
    excelColumns: ['번호', '주문일', '이름', '연락처', '주소', '수량', '주문내역'],
    getFileName: (user, today) => {
      const branchName = user?.branch || '지점명'
      const userName = user?.name || '사용자'
      return `주문목록_${branchName}_${userName}_${today}.csv`
    }
  }

  return <OrderListCommon user={user} onNavigate={onNavigate} config={config} />
}