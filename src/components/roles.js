// 권한 상수
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
}

// 로그인 모드
export const LOGIN_MODES = {
  STAFF: 'staff',      // 일반 업무
  MANAGER: 'manager'   // 지점 관리
}

// ========== 권한 체크 함수 ==========

// 시스템관리자인가?
export const isSystemAdmin = (user) => {
  return user?.user_type === USER_ROLES.ADMIN
}

// 점장인가?
export const isBranchManager = (user) => {
  return user?.is_branch_manager === true
}

// 관리자 모드인가?
export const isManagerMode = (user) => {
  return user?.loginMode === LOGIN_MODES.MANAGER
}

// 모든 지점 접근 가능한가?
export const canAccessAllBranches = (user) => {
  return isSystemAdmin(user)
}

// 관리 기능 접근 가능한가?
export const canAccessManagement = (user) => {
  return isSystemAdmin(user) || isManagerMode(user)
}

// ========== 표시용 함수 ==========

// 역할 표시명
export const getDisplayRole = (user) => {
  if (isSystemAdmin(user)) return '시스템관리자'
  if (isBranchManager(user)) return '점장'
  return '일반 사용자'
}

// 모드 표시명
export const getDisplayMode = (user) => {
  if (isSystemAdmin(user)) return '전체 시스템 관리'
  if (isManagerMode(user)) return `${user.branch} 관리`
  return '일반 업무'
}

// 역할 라벨 (테이블 표시용)
export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: '시스템관리자',
  [USER_ROLES.USER]: '일반 사용자'
}