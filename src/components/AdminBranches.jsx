import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, BarChart3 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import SalesDashboard from './SalesDashboard'
import { addressToCoordinates } from '../services/geocoding'

export default function AdminBranches({ user, onNavigate }) {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedBranchSales, setSelectedBranchSales] = useState(null) // 매출현황 슬라이드 패널용
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    show_on_map: true
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
    setFormData({ name: '', address: '', phone: '', show_on_map: true })
    setShowAddModal(true)
  }

  const handleEdit = (branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      show_on_map: branch.show_on_map ?? true
    })
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value
    })
  }

  const handleSaveNew = async () => {
    if (!formData.name.trim()) {
      alert('지점명을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const insertData = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        show_on_map: formData.show_on_map,
        created_by: user.id,
        is_active: true
      }

      if (formData.address.trim()) {
        const coords = await addressToCoordinates(formData.address, formData.name)
        if (coords) {
          insertData.lat = coords.lat
          insertData.lng = coords.lng
        }
      }

      const { error } = await supabase.from('branches').insert(insertData)
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
      const updateData = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        show_on_map: formData.show_on_map
      }

      const addressChanged = formData.address.trim() !== (editingBranch.address || '').trim()
      if (formData.address.trim() && addressChanged) {
        const coords = await addressToCoordinates(formData.address, formData.name)
        if (coords) {
          updateData.lat = coords.lat
          updateData.lng = coords.lng
        }
      }

      const { error } = await supabase
        .from('branches')
        .update(updateData)
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
            onClick={() => onNavigate('AdminDashboard')}
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
                            onClick={() => setSelectedBranchSales(branch.name)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                            title="매출현황"
                          >
                            <BarChart3 size={14} /> 매출현황
                          </button>
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

      {/* 매출현황 슬라이드 패널 */}
      {selectedBranchSales && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSelectedBranchSales(null)}
          />
          {/* 슬라이드 패널 */}
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-gray-50 shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* 패널 헤더 (로고 스타일 적용) */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex flex-col items-center mx-auto relative w-full">
                <div className="flex items-center gap-2">
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="w-8 h-8 object-contain"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                  <h1 className="text-2xl font-black tracking-tight" style={{ color: "#1fa193" }}>
                    LAS Book Store
                  </h1>
                </div>
                <p className="text-[13px] font-bold text-gray-400 tracking-widest mt-0.5">
                  판매관리 시스템
                </p>
                <button
                  onClick={() => setSelectedBranchSales(null)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            {/* 대시보드 */}
            <div className="flex-1 overflow-y-auto p-4">
              <SalesDashboard
                user={user}
                viewMode="admin"
                branchFilter={selectedBranchSales}
              />
            </div>
          </div>
        </>
      )}

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
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="show_on_map"
                name="show_on_map"
                checked={formData.show_on_map}
                onChange={handleChange}
                className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
              />
              <label htmlFor="show_on_map" className="font-bold cursor-pointer" style={{ fontSize: '15px' }}>
                지도에 표시
              </label>
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
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="edit_show_on_map"
                name="show_on_map"
                checked={formData.show_on_map}
                onChange={handleChange}
                className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
              />
              <label htmlFor="edit_show_on_map" className="font-bold cursor-pointer" style={{ fontSize: '15px' }}>
                지도에 표시
              </label>
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