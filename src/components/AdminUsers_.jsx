import { useState, useEffect } from 'react'
import { Edit2, Trash2, Check, X, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminUsers({ user, onNavigate }) {
  const [users, setUsers] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('사용자 목록 조회 오류:', error)
        alert('사용자 목록을 불러오는 중 오류가 발생했습니다.')
        return
      }

      setUsers(data || [])
    } catch (err) {
      console.error('사용자 목록 로드 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'approved', 
          approved_at: new Date().toISOString() 
        })
        .eq('id', userId)

      if (error) {
        console.error('승인 오류:', error)
        alert('승인 중 오류가 발생했습니다.')
        return
      }

      alert('사용자가 승인되었습니다.')
      loadUsers()
    } catch (err) {
      console.error('승인 오류:', err)
      alert('승인 중 오류가 발생했습니다.')
    }
  }

  const handleReject = async (userId) => {
    if (!confirm('정말 거부하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'rejected' })
        .eq('id', userId)

      if (error) {
        console.error('거부 오류:', error)
        alert('거부 중 오류가 발생했습니다.')
        return
      }

      alert('사용자 가입이 거부되었습니다.')
      loadUsers()
    } catch (err) {
      console.error('거부 오류:', err)
      alert('거부 중 오류가 발생했습니다.')
    }
  }

  const handleEditUser = (targetUser) => {
    setEditingUser(targetUser)
    setEditForm({ ...targetUser })
  }

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveUserEdit = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editForm.name,
          branch: editForm.branch,
          phone: editForm.phone,
          email: editForm.email
        })
        .eq('id', editingUser.id)

      if (error) {
        console.error('수정 오류:', error)
        alert('수정 중 오류가 발생했습니다.')
        return
      }

      alert('사용자 정보가 수정되었습니다.')
      setEditingUser(null)
      loadUsers()
    } catch (err) {
      console.error('수정 오류:', err)
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('삭제 오류:', error)
        alert('삭제 중 오류가 발생했습니다.')
        return
      }

      alert('사용자가 삭제되었습니다.')
      loadUsers()
    } catch (err) {
      console.error('삭제 오류:', err)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-md p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate('adminDashboard')}
            className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
            style={{ color: '#249689', fontSize: '15px' }}
          >
            <ArrowLeft size={20} />
            뒤로가기
          </button>
          <div className="flex items-center gap-1.5">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              회원관리
            </h1>
          </div>
          <div style={{ width: '100px' }}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 검색바 */}
          <div className="p-4 border-b flex items-center gap-2">
            <label className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>
              이메일
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="flex-1 px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
            <button 
              onClick={loadUsers}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              🔄
            </button>
          </div>

          {/* 회원 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    지점명
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    이름
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    전화번호
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    구분
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    가입확인
                  </th>
                  <th className="px-4 py-3 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((targetUser) => (
                  <tr key={targetUser.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3" style={{ fontSize: '15px' }}>{targetUser.branch}</td>
                    <td className="px-4 py-3" style={{ fontSize: '15px' }}>{targetUser.name}</td>
                    <td className="px-4 py-3" style={{ fontSize: '15px' }}>{targetUser.phone}</td>
                    <td className="px-4 py-3" style={{ fontSize: '15px' }}>{targetUser.user_type}</td>
                    <td className="px-4 py-3" style={{ fontSize: '15px' }}>{targetUser.email}</td>
                    <td className="px-4 py-3">
                      {targetUser.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(targetUser.id)}
                            className="p-1 bg-green-100 hover:bg-green-200 rounded"
                            title="승인"
                          >
                            <Check size={16} className="text-green-600" />
                          </button>
                          <button
                            onClick={() => handleReject(targetUser.id)}
                            className="p-1 bg-red-100 hover:bg-red-200 rounded"
                            title="거부"
                          >
                            <X size={16} className="text-red-600" />
                          </button>
                        </div>
                      ) : (
                        <span 
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            targetUser.status === 'approved' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {targetUser.status === 'approved' ? '승인완료' : '거부됨'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditUser(targetUser)}
                          className="p-2 hover:bg-gray-100 rounded"
                          title="수정"
                        >
                          <Edit2 size={18} style={{ color: '#249689' }} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(targetUser.id)}
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
        </div>
      </div>

      {/* 회원 수정 모달 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>
              회원 정보 수정
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>이름</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>지점명</label>
                <input
                  type="text"
                  name="branch"
                  value={editForm.branch}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>전화번호</label>
                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>이메일</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveUserEdit}
                className="flex-1 py-2 text-white font-bold rounded-lg"
                style={{ backgroundColor: '#249689', fontSize: '15px' }}
              >
                저장
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 font-bold rounded-lg"
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