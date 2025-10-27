import PurchaseHistoryBase from './PurchaseHistoryBase'

/**
 * 지점 관리자용 구매이력 조회 페이지
 * - 자신의 지점 구매이력만 조회 가능
 * - 지점 필터 숨김 (자동으로 자신의 지점 표시)
 * - Dashboard로 복귀
 */
export default function BranchPurchases({ user, onNavigate }) {
  return (
    <PurchaseHistoryBase 
      user={user}
      onNavigate={onNavigate}
      isAdminView={false}           // 🔑 자신의 지점만 조회
      title="구매이력조회"          // 페이지 타이틀
      showBranchFilter={false}      // 지점 드롭다운 숨김 (대신 고정 표시)
      navigateBack="Dashboard"      // 뒤로가기 경로
    />
  )
}