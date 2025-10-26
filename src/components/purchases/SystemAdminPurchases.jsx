import PurchaseHistoryBase from './PurchaseHistoryBase'

/**
 * 시스템 관리자용 구매이력 관리 페이지
 * - 모든 지점의 구매이력 조회 가능
 * - 지점 필터, 날짜 필터, 검색 기능 제공
 * - 출력 기능 제공
 */
export default function SystemAdminPurchases({ user, onNavigate }) {
  return (
    <PurchaseHistoryBase 
      user={user}
      onNavigate={onNavigate}
      isAdminView={true}              // 🔑 전체 지점 조회
      title="구매이력조회"            // 목록 페이지 타이틀
      showBranchFilter={true}         // 지점 필터 표시
      showDateFilter={true}           // 날짜 필터 표시
      showPrintButton={true}          // 출력 버튼 표시
      navigateBack="SystemAdminDashboard"  // 뒤로가기: 관리자 대시보드
    />
  )
}