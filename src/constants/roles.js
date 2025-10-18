// src/constants/roles.js

// 로그인 모드
export const LOGIN_MODES = {
  EMPLOYEE: 'employee',  // 일반 업무 모드
  MANAGER: 'manager'     // 관리자 모드
}

// 사용자 타입 (권한 레벨: 낮음 → 높음)
export const USER_TYPES = {
  OWNER: '점주',              // 레벨 1: 직원급 (근무일지만)
  STORE_MANAGER: '점장',      // 레벨 2: 지점 운영 관리
  BRANCH_MANAGER: '지점관리자', // 레벨 3: 지점 전체 관리
  SYSTEM_ADMIN: '시스템관리자'  // 레벨 4: 전체 시스템 관리
}

// USER_ROLES (하위 호환성)
export const USER_ROLES = USER_TYPES

// ==================== 권한 체크 함수 ====================

// 1. 일반 업무만 가능 (점주 레벨)
export const isOwner = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.OWNER
}

// 2. 지점 관리 가능 (점장, 지점관리자, 시스템관리자)
export const canAccessManagement = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.STORE_MANAGER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER ||
         user.user_type === USER_TYPES.SYSTEM_ADMIN
}

// 3. 지점관리자 이상 (지점관리자, 시스템관리자)
export const isBranchManager = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.BRANCH_MANAGER ||
         user.user_type === USER_TYPES.SYSTEM_ADMIN
}

// 4. 시스템관리자만
export const isSystemAdmin = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.SYSTEM_ADMIN
}

// 5. 전체 지점 조회 가능 (시스템관리자만)
export const canAccessAllBranches = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.SYSTEM_ADMIN
}

// ==================== 기능별 권한 ====================

// 직원 관리 권한 (점장 이상)
export const canManageUsers = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.STORE_MANAGER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER ||
         user.user_type === USER_TYPES.SYSTEM_ADMIN
}

// 근무일지 관리 권한 (점장 이상)
export const canManageWorkDiaries = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.STORE_MANAGER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER ||
         user.user_type === USER_TYPES.SYSTEM_ADMIN
}

// 고객 관리 권한 (점장 이상)
export const canManageCustomers = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.STORE_MANAGER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER ||
         user.user_type === USER_TYPES.SYSTEM_ADMIN
}

// 통계 조회 권한 (시스템관리자만)
export const canViewStatistics = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.SYSTEM_ADMIN
}

// 근무일지 작성 권한 (모든 사용자)
export const canWriteWorkDiary = (user) => {
  if (!user) return false
  return true // 모든 사용자 가능
}

// 판매관리 권한 (모든 사용자)
export const canManageSales = (user) => {
  if (!user) return false
  return true // 모든 사용자 가능
}

// ==================== 데이터 접근 제어 ====================

// 본인 데이터만 조회 가능한지 (점주만)
export const canViewOwnDataOnly = (user) => {
  if (!user) return true
  return user.user_type === USER_TYPES.OWNER
}

// 자기 지점 데이터만 조회 가능한지 (점장, 지점관리자)
export const canViewOwnBranchOnly = (user) => {
  if (!user) return true
  return user.user_type === USER_TYPES.STORE_MANAGER ||
         user.user_type === USER_TYPES.BRANCH_MANAGER
}

// ==================== 사용자 관리 권한 ====================

// 사용자 생성 권한
export const canCreateUser = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.STORE_MANAGER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER ||
         user.user_type === USER_TYPES.SYSTEM_ADMIN
}

// 사용자 수정 권한
export const canEditUser = (user, targetUser) => {
  if (!user || !targetUser) return false
  
  // 본인은 항상 수정 가능
  if (user.id === targetUser.id) return true
  
  // 시스템관리자는 모든 사용자 수정 가능
  if (user.user_type === USER_TYPES.SYSTEM_ADMIN) return true
  
  // 지점관리자는 같은 지점의 점장/점주만 수정 가능
  if (user.user_type === USER_TYPES.BRANCH_MANAGER) {
    return user.branch === targetUser.branch && 
           (targetUser.user_type === USER_TYPES.STORE_MANAGER ||
            targetUser.user_type === USER_TYPES.OWNER)
  }
  
  // 점장은 같은 지점의 점주만 수정 가능
  if (user.user_type === USER_TYPES.STORE_MANAGER) {
    return user.branch === targetUser.branch && 
           targetUser.user_type === USER_TYPES.OWNER
  }
  
  return false
}

// 사용자 삭제 권한
export const canDeleteUser = (user, targetUser) => {
  if (!user || !targetUser) return false
  
  // 본인은 삭제 불가
  if (user.id === targetUser.id) return false
  
  // 시스템관리자는 모든 사용자 삭제 가능 (본인 제외)
  if (user.user_type === USER_TYPES.SYSTEM_ADMIN) return true
  
  // 지점관리자는 같은 지점의 점장/점주 삭제 가능
  if (user.user_type === USER_TYPES.BRANCH_MANAGER) {
    return user.branch === targetUser.branch && 
           (targetUser.user_type === USER_TYPES.STORE_MANAGER ||
            targetUser.user_type === USER_TYPES.OWNER)
  }
  
  // 점장은 같은 지점의 점주 삭제 가능
  if (user.user_type === USER_TYPES.STORE_MANAGER) {
    return user.branch === targetUser.branch && 
           targetUser.user_type === USER_TYPES.OWNER
  }
  
  return false
}

// ==================== 표시 헬퍼 ====================

// 역할 표시명 가져오기
export const getDisplayRole = (userType) => {
  switch (userType) {
    case USER_TYPES.SYSTEM_ADMIN:
      return '시스템관리자'
    case USER_TYPES.BRANCH_MANAGER:
      return '지점관리자'
    case USER_TYPES.STORE_MANAGER:
      return '점장'
    case USER_TYPES.OWNER:
      return '점주'
    default:
      return userType || '점주'
  }
}

// 권한 레벨 가져오기 (숫자)
export const getPermissionLevel = (user) => {
  if (!user) return 0
  
  switch (user.user_type) {
    case USER_TYPES.SYSTEM_ADMIN:
      return 4
    case USER_TYPES.BRANCH_MANAGER:
      return 3
    case USER_TYPES.STORE_MANAGER:
      return 2
    case USER_TYPES.OWNER:
      return 1
    default:
      return 0
  }
}

// 권한 비교 (userA가 userB보다 높은 권한인지)
export const hasHigherPermission = (userA, userB) => {
  return getPermissionLevel(userA) > getPermissionLevel(userB)
}