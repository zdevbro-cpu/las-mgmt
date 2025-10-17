import { useState, useEffect } from 'react'
import { LogOut, Building2, Edit2, Trash2, Plus, X, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminDashboard({ user, onNavigate, onLogout }) {
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [showBranchListModal, setShowBranchListModal] = useState(false)
  const [branches, setBranches] = useState([])
  const [editingBranch, setEditingBranch] = useState(null)
  const [branchForm, setBranchForm] = useState({
    name: '',
    manager_name: '',
    address: '',
    phone: '',
    email: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (showBranchListModal) {
      loadBranches()
    }
  }, [showBranchListModal])

  const loadBranches = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setBranches(data || [])
    } catch (err) {
      console.error('지점 목록 로드 오류:', err)
      alert('지점 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setEditingBranch(null)
    setBranchForm({
      name: '',
      manager_name: '',
      address: '',
      phone: '',
      email: '',
      notes: ''
    })
    setShowBranchModal(true)
  }

  const handleOpenEditModal = (branch) => {
    setEditingBranch(branch)
    setBranchForm({
      name: branch.name || '',
      manager_name: branch.manager_name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      notes: branch.notes || ''
    })
    setShowBranchModal(true)
  }

  const handleFormChange = (e) => {
    setBranchForm({
      ...branchForm,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveBranch = async () => {
    // 필수 입력 검증
    if (!branchForm.name.trim()) {
      alert('지점명을 입력해주세요.')
      return
    }
    if (!branchForm.manager_name.trim()) {
      alert('점장명을 입력해주세요.')
      return
    }

    try {
      if (editingBranch) {
        // 수정
        const updateData = {
          name: branchForm.name.trim(),
          manager_name: branchForm.manager_name.trim()
        }
        
        if (branchForm.address.trim()) updateData.address = branchForm.address.trim()
        if (branchForm.phone.trim()) updateData.phone = branchForm.phone.trim()
        if (branchForm.email.trim()) updateData.email = branchForm.email.trim()
        if (branchForm.notes.trim()) updateData.notes = branchForm.notes.trim()

        const { error } = await supabase
          .from('branches')
          .update(updateData)
          .eq('id', editingBranch.id)
        
        if (error) {
          console.error('수정 오류 상세:', error)
          throw error
        }
        alert('지점 정보가 수정되었습니다.')
      } else {
        // 신규 등록
        const insertData = {
          name: branchForm.name.trim(),
          manager_name: branchForm.manager_name.trim(),
          is_active: true
        }

        if (branchForm.address.trim()) insertData.address = branchForm.address.trim()
        if (branchForm.phone.trim()) insertData.phone = branchForm.phone.trim()
        if (branchForm.email.trim()) insertData.email = branchForm.email.trim()
        if (branchForm.notes.trim()) insertData.notes = branchForm.notes.trim()

        const { data: newBranch, error: insertError } = await supabase
          .from('branches')
          .insert([insertData])
          .select()
        
        if (insertError) {
          console.error('등록 오류 상세:', insertError)
          alert(`지점 등록 중 오류가 발생했습니다.\n오류 내용: ${insertError.message}`)
          return
        }

        // 점장 이메일이 있으면 해당 사용자를 지점관리자로 권한 부여
        if (branchForm.email.trim()) {
          const { error: updateUserError } = await supabase
            .from('users')
            .update({ 
              user_type: '지점관리자',
              branch: branchForm.name.trim()
            })
            .eq('email', branchForm.email.trim())
          
          if (updateUserError) {
            console.warn('사용자 권한 업데이트 실패:', updateUserError)
            alert('지점은 등록되었으나 사용자 권한 업데이트에 실패했습니다.\n회원관리에서 수동으로 권한을 변경해주세요.')
          } else {
            alert('새 지점이 등록되었고, 점장에게 지점관리자 권한이 부여되었습니다.')
          }
        } else {
          alert('새 지점이 등록되었습니다.')
        }
      }
      
      setShowBranchModal(false)
      loadBranches()
    } catch (err) {
      console.error('지점 저장 오류:', err)
      alert(`지점 저장 중 오류가 발생했습니다.\n오류 내용: ${err.message || '알 수 없는 오류'}`)
    }
  }

  const handleDeleteBranch = async (branchId) => {
    if (!window.confirm('정말 이 지점을 삭제하시겠습니까?\n(비활성화 처리됩니다)')) return
    
    try {
      const { error } = await supabase
        .from('branches')
        .update({ is_active: false })
        .eq('id', branchId)
      
      if (error) throw error
      
      alert('지점이 비활성화되었습니다.')
      loadBranches()
    } catch (err) {
      console.error('지점 삭제 오류:', err)
      alert('지점 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center gap-1.5 mb-8">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              관리자 대시보드
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-1.5 mb-8">
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                🏢 지점명
              </label>
              <input
                type="text"
                value={user?.branch || '본사'}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            </div>
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                👤 이름
              </label>
              <input
                type="text"
                value={user?.name || '관리자'}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 bg-gray-50"
                style={{ borderRadius: '10px', color: '#000000', fontSize: '15px' }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setShowBranchListModal(true)}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Building2 size={20} />
              지점관리
            </button>
            <button
              onClick={() => onNavigate('adminUsers')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              회원관리
            </button>
            <button
              onClick={() => onNavigate('adminWorkDiary')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              근무일지관리
            </button>
            <button
              onClick={() => onNavigate('adminCustomers')}
              className="w-full py-4 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              구매자정보관리
            </button>
            <button
              onClick={onLogout}
              className="w-full py-4 font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
            >
              <LogOut size={20} />
              나가기
            </button>
          </div>
        </div>
      </div>

      {/* 지점 목록 모달 */}
      {showBranchListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#249689' }}>
                <Building2 size={24} />
                지점 관리
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                  style={{ backgroundColor: '#249689', fontSize: '14px' }}
                >
                  <Plus size={18} />
                  지점 추가
                </button>
                <button
                  onClick={() => setShowBranchListModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  로딩 중...
                </div>
              ) : branches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  등록된 지점이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                          지점명
                        </th>
                        <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                          점장명
                        </th>
                        <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                          주소
                        </th>
                        <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                          대표전화
                        </th>
                        <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                          이메일
                        </th>
                        <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                          상태
                        </th>
                        <th className="px-4 py-3 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches.map((branch) => (
                        <tr key={branch.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium" style={{ fontSize: '15px' }}>
                            {branch.name}
                          </td>
                          <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                            {branch.manager_name}
                            <Shield size={14} className="inline ml-1" style={{ color: '#8b5cf6' }} title="지점관리자" />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {branch.address || '-'}
                          </td>
                          <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                            {branch.phone || '-'}
                          </td>
                          <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                            {branch.email || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span 
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                branch.is_active 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {branch.is_active ? '활성' : '비활성'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleOpenEditModal(branch)}
                                className="p-2 hover:bg-gray-100 rounded"
                                title="수정"
                              >
                                <Edit2 size={18} style={{ color: '#249689' }} />
                              </button>
                              <button
                                onClick={() => handleDeleteBranch(branch.id)}
                                className="p-2 hover:bg-gray-100 rounded"
                                title="삭제"
                              >
                                <Trash2 size={18} style={{ color: '#dc2626' }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 지점 등록/수정 모달 */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#249689' }}>
              <Building2 size={24} />
              {editingBranch ? '지점 정보 수정' : '새 지점 등록'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  지점명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={branchForm.name}
                  onChange={handleFormChange}
                  placeholder="예: 강남점"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  점장명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="manager_name"
                  value={branchForm.manager_name}
                  onChange={handleFormChange}
                  placeholder="점장 이름을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
                <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                  <Shield size={12} style={{ color: '#8b5cf6' }} />
                  점장에게 지점관리자 권한이 부여됩니다
                </p>
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  지점 주소
                </label>
                <input
                  type="text"
                  name="address"
                  value={branchForm.address}
                  onChange={handleFormChange}
                  placeholder="지점 주소를 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  대표전화 (점장 전화번호)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={branchForm.phone}
                  onChange={handleFormChange}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  이메일 (점장)
                </label>
                <input
                  type="email"
                  name="email"
                  value={branchForm.email}
                  onChange={handleFormChange}
                  placeholder="manager@example.com"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  💡 이메일이 있으면 해당 사용자를 자동으로 지점관리자로 지정합니다
                </p>
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  비고
                </label>
                <textarea
                  name="notes"
                  value={branchForm.notes}
                  onChange={handleFormChange}
                  placeholder="추가 정보를 입력하세요"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveBranch}
                className="flex-1 py-2 text-white font-bold rounded-lg hover:opacity-90"
                style={{ backgroundColor: '#249689', fontSize: '15px' }}
              >
                {editingBranch ? '수정' : '등록'}
              </button>
              <button
                onClick={() => setShowBranchModal(false)}
                className="flex-1 py-2 font-bold rounded-lg hover:bg-gray-50"
                style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}