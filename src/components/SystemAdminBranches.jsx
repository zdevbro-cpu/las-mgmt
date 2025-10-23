import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Edit, Trash2, Building2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function SystemAdminBranches({ user, onNavigate }) {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    manager_name: '',
    phone: ''
  })

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    setLoading(true)
    try {
      console.log('Fetching branches...')
      
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Branches loaded:', data)
      console.log('Number of branches:', data?.length)
      
      if (data && data.length > 0) {
        console.log('First branch:', data[0])
        console.log('Branch columns:', Object.keys(data[0]))
      }
      
      setBranches(data || [])
    } catch (err) {
      console.error('Load branches error:', err)
      alert('지점 목록을 불러오는 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    console.log(`Form change: ${name} = ${value}`)
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const openCreateModal = () => {
    console.log('Opening create modal')
    setModalMode('create')
    setFormData({
      name: '',
      address: '',
      manager_name: '',
      phone: ''
    })
    setShowModal(true)
  }

  const openEditModal = (branch) => {
    console.log('Opening edit modal for:', branch)
    setModalMode('edit')
    setSelectedBranch(branch)
    setFormData({
      name: branch.name || '',
      address: branch.address || '',
      manager_name: branch.manager_name || '',
      phone: branch.phone || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('지점명을 입력해주세요')
      return
    }

    setLoading(true)
    try {
      if (modalMode === 'create') {
        console.log('Creating branch:', formData)
        
        const insertData = {
          name: formData.name.trim(),
          manager_name: formData.manager_name.trim() || null
        }
        
        if (formData.address.trim()) insertData.address = formData.address.trim()
        if (formData.phone.trim()) insertData.phone = formData.phone.trim()

        const { data, error } = await supabase
          .from('branches')
          .insert([insertData])
          .select()

        if (error) {
          console.error('Insert error:', error)
          throw error
        }

        console.log('Branch created successfully:', data)
        alert('지점이 생성되었습니다!')
      } else {
        console.log('Updating branch:', formData)
        
        const updateData = {
          name: formData.name.trim(),
          manager_name: formData.manager_name.trim() || null
        }
        
        if (formData.address.trim()) updateData.address = formData.address.trim()
        if (formData.phone.trim()) updateData.phone = formData.phone.trim()

        const { data, error } = await supabase
          .from('branches')
          .update(updateData)
          .eq('id', selectedBranch.id)
          .select()

        if (error) {
          console.error('Update error:', error)
          throw error
        }

        console.log('Branch updated successfully:', data)
        alert('지점 정보가 수정되었습니다!')
      }

      setShowModal(false)
      fetchBranches()
    } catch (err) {
      console.error('Save branch error:', err)
      alert(`지점 저장 중 오류가 발생했습니다.\n오류: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (branch) => {
    if (!window.confirm(`"${branch.name}" 지점을 삭제하시겠습니까?\n\n이 지점에 속한 직원들의 지점명도 함께 확인해주세요.`)) {
      return
    }

    setLoading(true)
    try {
      console.log('Deleting branch:', branch.id)
      
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', branch.id)

      if (error) {
        console.error('Delete error:', error)
        throw error
      }

      console.log('Branch deleted successfully')
      alert('지점이 삭제되었습니다!')
      fetchBranches()
    } catch (err) {
      console.error('Delete branch error:', err)
      alert('지점 삭제 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => onNavigate('systemAdminDashboard')}
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
              <h2 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
                지점정보관리
              </h2>
            </div>
            <div style={{ width: '100px' }}></div>
          </div>

          {/* 지점 생성 버튼 */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={openCreateModal}
              disabled={loading}
              className="px-6 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
            >
              <Plus size={18} />
              지점 생성
            </button>
          </div>

          {/* 지점 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    지점명
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    지점주소
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    지점장
                  </th>
                  <th className="px-3 py-3 text-left font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689' }}>
                    연락처
                  </th>
                  <th className="px-3 py-3 text-center font-bold" style={{ fontSize: '16px', borderBottom: '2px solid #249689', width: '120px' }}>
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center" style={{ fontSize: '16px' }}>
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#249689' }}></div>
                        로딩 중...
                      </div>
                    </td>
                  </tr>
                ) : branches.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500" style={{ fontSize: '16px' }}>
                      <div>
                        <Building2 size={48} className="mx-auto mb-2 opacity-30" />
                        <p className="mb-2">등록된 지점이 없습니다</p>
                        <p className="text-sm">상단의 "지점 생성" 버튼을 클릭하여 지점을 추가하세요</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  branches.map((branch) => (
                    <tr
                      key={branch.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-3 font-bold" style={{ fontSize: '14px', color: '#249689' }}>
                        {branch.name}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '14px' }}>
                        {branch.address || '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '14px' }}>
                        {branch.manager_name || '-'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: '14px' }}>
                        {branch.phone || '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(branch)}
                            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            style={{ color: '#2563eb' }}
                            title="수정"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(branch)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            style={{ color: '#dc2626' }}
                            title="삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 총 개수 */}
          {branches.length > 0 && (
            <div className="mt-4 text-right text-gray-600" style={{ fontSize: '13px' }}>
              총 <strong style={{ color: '#249689' }}>{branches.length}</strong>개 지점
            </div>
          )}
        </div>
      </div>

      {/* 지점 생성/수정 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: '10px' }}
          >
            <h3 className="font-bold mb-4" style={{ color: '#249689', fontSize: '20px' }}>
              {modalMode === 'create' ? '지점 생성' : '지점정보수정'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  지점명 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {modalMode === 'create' ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="서초점"
                    className="w-full px-4 py-2 border border-gray-300"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  />
                ) : (
                  <select
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 bg-white"
                    style={{ borderRadius: '10px', fontSize: '15px' }}
                  >
                    <option value="">선택하세요</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  지점주소
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="서울시 서초구..."
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  지점장
                </label>
                <input
                  type="text"
                  name="manager_name"
                  value={formData.manager_name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>

              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  연락처
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#249689', borderRadius: '10px', fontSize: '15px' }}
              >
                {loading ? '저장 중...' : modalMode === 'create' ? '생성' : '수정'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 py-2.5 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                style={{ border: '2px solid #7f95eb', backgroundColor: 'white', borderRadius: '10px', fontSize: '15px' }}
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