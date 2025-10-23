import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminBranches({ user, onNavigate }) {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  })

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
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

  const handleAdd = () => {
    setFormData({ name: '', address: '', phone: '' })
    setShowAddModal(true)
  }

  const handleEdit = (branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || ''
    })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveNew = async () => {
    if (!formData.name.trim()) {
      alert('지점명을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('branches')
        .insert({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          created_by: user.id,
          is_active: true
        })

      if (error) throw error

      alert('지점이 추가되었습니다.')
      setShowAddModal(false)
      loadBranches()
    } catch (err) {
      console.error('지점 추가 오류:', err)
      alert('지점 추가 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!formData.name.trim()) {
      alert('지점명을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('branches')
        .update({
          name: formData.name,
          address: formData.address,
          phone: formData.phone
        })
        .eq('id', editingBranch.id)

      if (error) throw error

      alert('지점 정보가 수정되었습니다.')
      setEditingBranch(null)
      loadBranches()
    } catch (err) {
      console.error('지점 수정 오류:', err)
      alert('지점 수정 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (branchId, branchName) => {
    if (!window.confirm(`'${branchName}' 지점을 삭제하시겠습니까?`)) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('branches')
        .update({ is_active: false })
        .eq('id', branchId)

      if (error) throw error

      alert('지점이 삭제되었습니다.')
      loadBranches()
    } catch (err) {
      console.error('지점 삭제 오류:', err)
      alert('지점 삭제 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-md p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate('adminDashboard')}
            className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
            style={{ color: '#249689', fontSize: '15px' }}
          >
            <ArrowLeft size={20} />
            나가기
          </button>
          <div className="flex items-center gap-1.5">
            <img 
              src="/images/logo.png" 
              alt="LAS Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              지점관리
            </h1>
          </div>
          <div style={{ width: '100px' }}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold" style={{ color: '#000000', fontSize: '18px' }}>
              등록된 지점 목록
            </h2>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#249689', fontSize: '15px' }}
            >
              <Plus size={18} />
              지점 추가
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    지점명
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    주소
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    연락처
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    등록일
                  </th>
                  <th className="px-4 py-3 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : branches.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      등록된 지점이 없습니다.
                    </td>
                  </tr>
                ) : (
                  branches.map((branch) => (
                    <tr key={branch.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {branch.name}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {branch.address || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {branch.phone || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {new Date(branch.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(branch)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="수정"
                          >
                            <Edit2 size={18} style={{ color: '#249689' }} />
                          </button>
                          <button
                            onClick={() => handleDelete(branch.id, branch.name)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="삭제"
                          >
                            <Trash2 size={18} style={{ color: '#dc2626' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 지점 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>
              지점 추가
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  지점명 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="지점명을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>주소</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="주소를 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>연락처</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="연락처를 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveNew}
                disabled={loading}
                className="flex-1 py-2 text-white font-bold rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#249689', fontSize: '15px' }}
              >
                {loading ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={loading}
                className="flex-1 py-2 font-bold rounded-lg"
                style={{ color: '#000000', border: '2px solid #7f95eb', backgroundColor: 'white', fontSize: '15px' }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 지점 수정 모달 */}
      {editingBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>
              지점 수정
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>
                  지점명 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>주소</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>연락처</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="flex-1 py-2 text-white font-bold rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#249689', fontSize: '15px' }}
              >
                {loading ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => setEditingBranch(null)}
                disabled={loading}
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