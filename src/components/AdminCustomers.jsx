import { useState, useEffect } from 'react'
import { Edit2, Trash2, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminCustomers({ user, onNavigate }) {
  const [sales, setSales] = useState([])
  const [editingSale, setEditingSale] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('구매자 목록 조회 오류:', error)
        alert('구매자 목록을 불러오는 중 오류가 발생했습니다: ' + error.message)
        return
      }

      setSales(data || [])
    } catch (err) {
      console.error('구매자 목록 로드 오류:', err)
      alert('구매자 목록 로드 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSale = (sale) => {
    setEditingSale(sale)
    setEditForm({ ...sale })
  }

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveSaleEdit = async () => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({
          customer_name: editForm.customer_name,
          age: editForm.age ? parseInt(editForm.age) : null,
          customer_email: editForm.customer_email,
          customer_phone: editForm.customer_phone,
          address: editForm.address
        })
        .eq('id', editingSale.id)

      if (error) {
        console.error('구매자 수정 오류:', error)
        alert('수정 중 오류가 발생했습니다.')
        return
      }

      alert('구매자 정보가 수정되었습니다.')
      setEditingSale(null)
      loadSales()
    } catch (err) {
      console.error('구매자 수정 오류:', err)
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteSale = async (saleId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)

      if (error) {
        console.error('구매자 삭제 오류:', error)
        alert('삭제 중 오류가 발생했습니다.')
        return
      }

      alert('구매자 정보가 삭제되었습니다.')
      loadSales()
    } catch (err) {
      console.error('구매자 삭제 오류:', err)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const filteredSales = sales.filter(s => 
    s.customer_name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    s.age?.toString().includes(customerSearchTerm) ||
    s.customer_email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    s.customer_phone?.includes(customerSearchTerm)
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
              구매자정보관리
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
              검색
            </label>
            <input
              type="text"
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              placeholder="이름, 나이, 이메일, 전화번호로 검색"
              className="flex-1 px-4 py-2 border border-gray-300"
              style={{ borderRadius: '10px', fontSize: '15px' }}
            />
            <button 
              onClick={loadSales}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              🔄
            </button>
          </div>

          {/* 구매자 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    이름
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    나이
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    전화번호
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    주소
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    결제방법
                  </th>
                  <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    판매수량
                  </th>
                  <th className="px-4 py-3 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3" style={{ fontSize: '15px' }}>{sale.customer_name}</td>
                    <td className="px-4 py-3" style={{ fontSize: '15px' }}>{sale.age || '-'}</td>
                    <td className="px-4 py-3" style={{ fontSize: '15px' }}>{sale.customer_email}</td>
                    <td className="px-4 py-3" style={{ fontSize: '15px' }}>{sale.customer_phone}</td>
                    <td className="px-4 py-3" style={{ fontSize: '15px' }}>{sale.address}</td>
                    <td className="px-4 py-3" style={{ fontSize: '15px' }}>{sale.payment_method}</td>
                    <td className="px-4 py-3" style={{ fontSize: '15px' }}>{sale.quantity || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditSale(sale)}
                          className="p-2 hover:bg-gray-100 rounded"
                          title="수정"
                        >
                          <Edit2 size={18} style={{ color: '#249689' }} />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
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

      {/* 구매자 수정 모달 */}
      {editingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#249689' }}>
              구매자 정보 수정
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>이름</label>
                <input
                  type="text"
                  name="customer_name"
                  value={editForm.customer_name}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>나이</label>
                <input
                  type="number"
                  name="age"
                  value={editForm.age || ''}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>이메일</label>
                <input
                  type="email"
                  name="customer_email"
                  value={editForm.customer_email}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>전화번호</label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={editForm.customer_phone}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
              <div>
                <label className="block mb-2 font-bold" style={{ fontSize: '15px' }}>주소</label>
                <input
                  type="text"
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ borderRadius: '10px', fontSize: '15px' }}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveSaleEdit}
                className="flex-1 py-2 text-white font-bold rounded-lg"
                style={{ backgroundColor: '#249689', fontSize: '15px' }}
              >
                저장
              </button>
              <button
                onClick={() => setEditingSale(null)}
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