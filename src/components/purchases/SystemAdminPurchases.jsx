import PurchaseHistoryBase from './PurchaseHistoryBase'

/**
 * 시스템 관리자용 구매이력 조회 페이지
 * - 모든 지점의 구매이력 조회 가능
 * - 지점 필터 표시
 * - SystemAdminDashboard로 복귀
 */
export default function SystemAdminPurchases({ user, onNavigate }) {
  return (
    <PurchaseHistoryBase 
      user={user}
      onNavigate={onNavigate}
      isAdminView={true}                    // 🔑 전체 지점 조회
      title="구매이력조회"                  // 페이지 타이틀
      showBranchFilter={true}               // 지점 드롭다운 표시
      navigateBack="SystemAdminDashboard"   // 뒤로가기 경로
    />
  )
}