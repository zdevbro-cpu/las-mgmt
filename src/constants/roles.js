// src/constants/roles.js

// 로그인 모드
export const LOGIN_MODES = {
  EMPLOYEE: 'employee',  // 직원 모드 (일반 업무)
  MANAGER: 'manager'     // 관리자 모드 (지점 관리)
}

// 사용자 타입
export const USER_TYPES = {
  OWNER: '점주',
  BRANCH_MANAGER: '지점관리자',
  EMPLOYEE: '직원'
}

// 지점관리자 또는 점주인지 확인 (관리 권한)
export const isBranchManager = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.OWNER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER
}

// 관리 페이지 접근 권한 확인
export const canAccessManagement = (user) => {
  if (!user) return false
  
  // 점주와 지점관리자만 관리 페이지 접근 가능
  return user.user_type === USER_TYPES.OWNER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER
}

// 특정 기능별 권한 확인
export const canManageUsers = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.OWNER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER
}

export const canManageWorkDiaries = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.OWNER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER
}

export const canManageCustomers = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.OWNER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER
}

// 본인 데이터만 조회 가능한지 확인
export const canViewOwnDataOnly = (user) => {
  if (!user) return true
  return user.user_type === USER_TYPES.EMPLOYEE
}