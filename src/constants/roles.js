// src/constants/roles.js

// 로그인 모드
export const LOGIN_MODES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager'
}

// 사용자 타입 (권한 레벨: 낮음 → 높음)
export const USER_TYPES = {
  MONITORING_AGENT: '모니터링요원', // 레벨 0
  CONTRACT_WORKER: '계약근무',     // 레벨 1
  OWNER: '점주',              // 레벨 2
  STORE_MANAGER: '점장',      // 레벨 3
  BRANCH_MANAGER: '지점관리자', // 레벨 4
  SYSTEM_ADMIN: '시스템관리자'  // 레벨 5
}

export const USER_ROLES = USER_TYPES

// ==================== 권한 체크 함수 ====================

export const isMonitoringAgent = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.MONITORING_AGENT
}

export const isContractWorker = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.CONTRACT_WORKER
}

export const isOwner = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.OWNER
}

export const canAccessManagement = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.STORE_MANAGER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER ||
         user.user_type === USER_TYPES.SYSTEM_ADMIN
}

export const isBranchManager = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.BRANCH_MANAGER ||
         user.user_type === USER_TYPES.SYSTEM_ADMIN
}

export const isSystemAdmin = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.SYSTEM_ADMIN
}

export const canAccessAllBranches = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.SYSTEM_ADMIN
}

export const canGetReferralCode = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.MONITORING_AGENT ||
         user.user_type === USER_TYPES.CONTRACT_WORKER ||
         user.user_type === USER_TYPES.OWNER ||
         user.user_type === USER_TYPES.STORE_MANAGER
}

export const canGetSalesCommission = (user) => {
  if (!user) return false
  return user.user_type !== USER_TYPES.MONITORING_AGENT &&
         user.user_type !== USER_TYPES.CONTRACT_WORKER
}

export const canManageUsers = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.STORE_MANAGER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER ||
         user.user_type === USER_TYPES.SYSTEM_ADMIN
}

export const canManageWorkDiaries = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.STORE_MANAGER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER ||
         user.user_type === USER_TYPES.SYSTEM_ADMIN
}

export const canManageCustomers = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.STORE_MANAGER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER ||
         user.user_type === USER_TYPES.SYSTEM_ADMIN
}

export const canViewStatistics = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.SYSTEM_ADMIN
}

export const canWriteWorkDiary = (user) => {
  if (!user) return false
  return user.user_type !== USER_TYPES.MONITORING_AGENT
}

export const canManageSales = (user) => {
  if (!user) return false
  return user.user_type !== USER_TYPES.MONITORING_AGENT
}

export const canAccessEventDashboard = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.STORE_MANAGER ||
         user.user_type === USER_TYPES.BRANCH_MANAGER ||
         user.user_type === USER_TYPES.SYSTEM_ADMIN
}

export const canViewOwnDataOnly = (user) => {
  if (!user) return true
  return user.user_type === USER_TYPES.OWNER ||
         user.user_type === USER_TYPES.CONTRACT_WORKER ||
         user.user_type === USER_TYPES.MONITORING_AGENT
}

export const canViewOwnBranchOnly = (user) => {
  if (!user) return true
  return user.user_type === USER_TYPES.STORE_MANAGER ||
         user.user_type === USER_TYPES.BRANCH_MANAGER
}

export const canCreateUser = (user) => {
  if (!user) return false
  return user.user_type === USER_TYPES.STORE_MANAGER || 
         user.user_type === USER_TYPES.BRANCH_MANAGER ||
         user.user_type === USER_TYPES.SYSTEM_ADMIN
}

export const canEditUser = (user, targetUser) => {
  if (!user || !targetUser) return false
  if (user.id === targetUser.id) return true
  if (user.user_type === USER_TYPES.SYSTEM_ADMIN) return true
  
  if (user.user_type === USER_TYPES.BRANCH_MANAGER) {
    return user.branch === targetUser.branch && 
           (targetUser.user_type === USER_TYPES.STORE_MANAGER ||
            targetUser.user_type === USER_TYPES.OWNER ||
            targetUser.user_type === USER_TYPES.CONTRACT_WORKER ||
            targetUser.user_type === USER_TYPES.MONITORING_AGENT)
  }
  
  if (user.user_type === USER_TYPES.STORE_MANAGER) {
    return user.branch === targetUser.branch && 
           (targetUser.user_type === USER_TYPES.OWNER ||
            targetUser.user_type === USER_TYPES.CONTRACT_WORKER ||
            targetUser.user_type === USER_TYPES.MONITORING_AGENT)
  }
  
  return false
}

export const canDeleteUser = (user, targetUser) => {
  if (!user || !targetUser) return false
  if (user.id === targetUser.id) return false
  if (user.user_type === USER_TYPES.SYSTEM_ADMIN) return true
  
  if (user.user_type === USER_TYPES.BRANCH_MANAGER) {
    return user.branch === targetUser.branch && 
           (targetUser.user_type === USER_TYPES.STORE_MANAGER ||
            targetUser.user_type === USER_TYPES.OWNER ||
            targetUser.user_type === USER_TYPES.CONTRACT_WORKER ||
            targetUser.user_type === USER_TYPES.MONITORING_AGENT)
  }
  
  if (user.user_type === USER_TYPES.STORE_MANAGER) {
    return user.branch === targetUser.branch && 
           (targetUser.user_type === USER_TYPES.OWNER ||
            targetUser.user_type === USER_TYPES.CONTRACT_WORKER ||
            targetUser.user_type === USER_TYPES.MONITORING_AGENT)
  }
  
  return false
}

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
    case USER_TYPES.CONTRACT_WORKER:
      return '계약근무'
    case USER_TYPES.MONITORING_AGENT:
      return '모니터링요원'
    default:
      return userType || '점주'
  }
}

export const getPermissionLevel = (user) => {
  if (!user) return 0
  
  switch (user.user_type) {
    case USER_TYPES.SYSTEM_ADMIN:
      return 5
    case USER_TYPES.BRANCH_MANAGER:
      return 4
    case USER_TYPES.STORE_MANAGER:
      return 3
    case USER_TYPES.OWNER:
      return 2
    case USER_TYPES.CONTRACT_WORKER:
      return 1
    case USER_TYPES.MONITORING_AGENT:
      return 0
    default:
      return 0
  }
}

export const hasHigherPermission = (userA, userB) => {
  return getPermissionLevel(userA) > getPermissionLevel(userB)
}

// ==================== LAS 고유번호 생성 ====================

/**
 * LAS 고유번호 범위
 * - 직원 (점주/점장): LAS1000 ~ LAS2999
 * - 모니터링요원: LAS3000 ~ LAS4999
 * - 계약근무: LAS5000 ~ LAS6999
 */

const REFERRAL_CODE_RANGES = {
  [USER_TYPES.OWNER]: { prefix: 'LAS', start: 1000, end: 2999 },
  [USER_TYPES.STORE_MANAGER]: { prefix: 'LAS', start: 1000, end: 2999 },
  [USER_TYPES.MONITORING_AGENT]: { prefix: 'LAS', start: 3000, end: 4999 },
  [USER_TYPES.CONTRACT_WORKER]: { prefix: 'LAS', start: 5000, end: 6999 }
}

export const generateReferralCode = (user, existingCodes = []) => {
  if (!user || !user.user_type) return null
  
  const range = REFERRAL_CODE_RANGES[user.user_type]
  
  if (!range) {
    console.warn('고유번호 발급 대상이 아닌 사용자 타입:', user.user_type)
    return null
  }
  
  const prefix = range.prefix
  const existingNumbers = existingCodes
    .filter(code => code && code.startsWith(prefix))
    .map(code => parseInt(code.replace(prefix, '')))
    .filter(num => !isNaN(num) && num >= range.start && num <= range.end)
  
  for (let num = range.start; num <= range.end; num++) {
    if (!existingNumbers.includes(num)) {
      return `${prefix}${num}`
    }
  }
  
  console.error('사용 가능한 고유번호가 없습니다:', user.user_type)
  return null
}

export const validateReferralCodeFormat = (code) => {
  if (!code || typeof code !== 'string') {
    return { isValid: false, error: '고유번호를 입력해주세요' }
  }
  
  const trimmedCode = code.trim().toUpperCase()
  
  const pattern = /^LAS\d{4}$/
  
  if (!pattern.test(trimmedCode)) {
    return {
      isValid: false,
      error: '올바른 고유번호 형식이 아닙니다 (예: LAS1000)'
    }
  }
  
  const number = parseInt(trimmedCode.replace('LAS', ''))
  
  // ✅ 수정: 1000, 3000, 5000부터 시작
  const isInValidRange = 
    (number >= 1000 && number <= 2999) ||
    (number >= 3000 && number <= 4999) ||
    (number >= 5000 && number <= 6999)
  
  if (!isInValidRange) {
    return {
      isValid: false,
      error: '허용되지 않은 고유번호 범위입니다'
    }
  }
  
  return { isValid: true, error: '' }
}

export const getUserTypeFromReferralCode = (code) => {
  if (!code) return null
  
  const number = parseInt(code.replace('LAS', ''))
  
  // ✅ 수정: 1000, 3000, 5000부터 시작
  if (number >= 1000 && number <= 2999) return '직원 (점주/점장)'
  if (number >= 3000 && number <= 4999) return '모니터링요원'
  if (number >= 5000 && number <= 6999) return '계약근무'
  
  return '알 수 없음'
}