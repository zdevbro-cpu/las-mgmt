import React from 'react'
import OrderListCommon from './OrderListCommon'

export default function SystemAdminShipping({ user, onNavigate }) {
  const config = {
    // 컨테이너 설정
    containerClass: 'max-w-6xl mx-auto p-6',
    cardClass: 'bg-white rounded-lg shadow-lg p-6',
    headerClass: 'flex items-center justify-between mb-8',
    
    // 화면 설정
    title: '주문목록',
    showBackButton: true,
    backNavigation: 'system-admin',
    backButtonText: '나가기',
    showBranchInfo: false,
    showBranchFilter: true,
    filterByBranch: false,
    
    // 검색 설정
    searchPlaceholder: '이름, 전화번호, 이메일로 검색',
    searchFields: ['customer_name', 'phone', 'customer_phone', 'email', 'address'],
    
    // 테이블 설정
    tableColumns: ['주문일', '지점', '이름', '연락처', '주소', '수량', '주문내역'],
    renderTableRow: (purchase, formatDate, formatPhoneNumber) => (
      <>
        <td className="px-3 py-3" style={{ fontSize: '15px' }}>
          {formatDate(purchase.created_at)}
        </td>
        <td className="px-3 py-3 font-bold" style={{ fontSize: '15px', color: '#249689' }}>
          {purchase.branch_name || '-'}
        </td>
        <td className="px-3 py-3" style={{ fontSize: '15px' }}>
          {purchase.customer_name || '-'}
        </td>
        <td className="px-3 py-3" style={{ fontSize: '15px' }}>
          {formatPhoneNumber(purchase.customer_phone || purchase.phone)}
        </td>
        <td className="px-3 py-3" style={{ fontSize: '15px' }}>
          {purchase.address ? (
            purchase.address.length > 30 ? purchase.address.substring(0, 30) + '...' : purchase.address
          ) : '-'}
        </td>
        <td className="px-3 py-3 text-center font-bold" style={{ fontSize: '15px' }}>
          {purchase.quantity || 0}개
        </td>
        <td className="px-3 py-3" style={{ fontSize: '15px' }}>
          {purchase.order_details ? (
            purchase.order_details.length > 20 ? purchase.order_details.substring(0, 20) + '...' : purchase.order_details
          ) : '-'}
        </td>
      </>
    ),
    
    // 인쇄 설정
    printTitle: '주문목록',
    printHeaderTitle: '주문목록',
    printSectionTitle: '수취인 정보',
    printFooter: 'LAS Book Store · 주문목록',
    showBranchInPrint: true,
    quantityUnit: '권',
    
    // 엑셀 설정
    excelColumns: ['번호', '주문일', '지점', '이름', '연락처', '주소', '수량', '주문내역'],
    getFileName: (user, today) => {
      return `주문목록_전체_${today}.csv`
    }
  }

  return <OrderListCommon user={user} onNavigate={onNavigate} config={config} />
}