import PurchaseHistoryBase from './PurchaseHistoryBase'

/**
 * 지점 사용자용 구매이력 조회 페이지
 * - 자신의 지점 구매이력만 조회 가능 (점주/점장/지점관리자)
 * - 날짜 필터, 검색 기능 제공
 * - 지점 필터는 숨김 (자동으로 자신의 지점만 조회)
 * - 출력 기능은 선택적 제공
 */
export default function BranchPurchases({ user, onNavigate }) {
  return (
    <PurchaseHistoryBase 
      user={user}
      onNavigate={onNavigate}
      isAdminView={false}             // 🔑 자신의 지점만 조회
      title="구매이력조회"            // 목록 페이지 타이틀
      showBranchFilter={false}        // 지점 필터 숨김
      showDateFilter={true}           // 날짜 필터 표시
      showPrintButton={true}          // 출력 버튼 표시
      navigateBack="Dashboard"        // 뒤로가기: 일반 대시보드
    />
  )
}