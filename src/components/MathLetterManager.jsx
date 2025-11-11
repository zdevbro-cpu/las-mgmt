import React, { useState, useEffect } from 'react'
import { Search, Plus, Upload, Edit, Trash2, Eye, Check, X, Save, FileSpreadsheet, Folder } from 'lucide-react'

export default function MathLetterManager({ user, onNavigate, onBack }) {
  const [selectedFilter, setSelectedFilter] = useState('전체')
  const [statusFilter, setStatusFilter] = useState('전체')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showBulkRegisterModal, setShowBulkRegisterModal] = useState(false)
  const [registerForm, setRegisterForm] = useState({
    series: 'K2',
    letter_number: '',
    title: '',
    description: '',
    video_file: null,
    thumbnail_file: null,
    pdf_file: null,
    duration: 0
  })
  const [bulkRegisterForm, setBulkRegisterForm] = useState({
    excel_file: null,
    video_directory: '',
    preview_data: []
  })

  // ... 기존 코드 (classStats, generateLetters 등) 동일 ...

  const classStats = [
    { id: 'K2', name: 'K2', total: 96, registered: 72, unregistered: 24, percentage: 75 },
    { id: 'K3', name: 'K3', total: 96, registered: 85, unregistered: 11, percentage: 89 },
    { id: 'K4', name: 'K4', total: 96, registered: 64, unregistered: 32, percentage: 67 },
    { id: 'K5', name: 'K5', total: 96, registered: 90, unregistered: 6, percentage: 94 },
    { id: 'K6', name: 'K6', total: 96, registered: 78, unregistered: 18, percentage: 81 },
    { id: 'K7', name: 'K7', total: 96, registered: 82, unregistered: 14, percentage: 85 },
    { id: 'G1', name: 'G1', total: 96, registered: 88, unregistered: 8, percentage: 92 },
    { id: 'G2', name: 'G2', total: 96, registered: 76, unregistered: 20, percentage: 79 },
    { id: 'G3', name: 'G3', total: 96, registered: 91, unregistered: 5, percentage: 95 },
    { id: 'G4', name: 'G4', total: 96, registered: 69, unregistered: 27, percentage: 72 },
    { id: 'G5', name: 'G5', total: 96, registered: 84, unregistered: 12, percentage: 88 },
    { id: 'G6', name: 'G6', total: 96, registered: 79, unregistered: 17, percentage: 82 },
  ]

  const generateLetters = () => {
    const allLetters = []
    classStats.forEach((cls) => {
      for (let i = 1; i <= 96; i++) {
        allLetters.push({
          id: `${cls.id}-${i}`,
          series: cls.id,
          letter_number: i,
          title: `${cls.id} 수학편지 ${i}번`,
          description: `${cls.id} 수학편지 ${i}번 설명 내용입니다.`,
          duration: Math.floor(Math.random() * 600) + 180,
          is_ready: Math.random() > 0.3,
          created_at: new Date(2025, 0, Math.floor(Math.random() * 30) + 1).toISOString(),
          video_url: `https://example.com/videos/${cls.id.toLowerCase()}_${String(i).padStart(3, '0')}.mp4`,
          thumbnail_url: `https://example.com/thumbnails/${cls.id.toLowerCase()}_${String(i).padStart(3, '0')}.jpg`,
        })
      }
    })
    return allLetters
  }

  const [letters] = useState(generateLetters())

  const totalStats = {
    total: classStats.reduce((sum, c) => sum + c.total, 0),
    registered: classStats.reduce((sum, c) => sum + c.registered, 0),
    unregistered: classStats.reduce((sum, c) => sum + c.unregistered, 0),
    kSeries: classStats.filter(c => c.id.startsWith('K')).reduce((sum, c) => sum + c.registered, 0),
    gSeries: classStats.filter(c => c.id.startsWith('G')).reduce((sum, c) => sum + c.registered, 0),
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const filteredLetters = letters.filter(letter => {
    const matchesSeriesFilter = selectedFilter === '전체' || letter.series === selectedFilter
    const matchesStatusFilter = 
      statusFilter === '전체' || 
      (statusFilter === '등록' && letter.is_ready) || 
      (statusFilter === '미등록' && !letter.is_ready)
    const matchesSearch = 
      letter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSeriesFilter && matchesStatusFilter && matchesSearch
  })

  const sortedLetters = [...filteredLetters].sort((a, b) => {
    if (!sortConfig.key) return 0
    
    let aValue = a[sortConfig.key]
    let bValue = b[sortConfig.key]
    
    if (sortConfig.key === 'created_at') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedLetters.length / 96)
  const paginatedLetters = sortedLetters.slice((currentPage - 1) * 96, currentPage * 96)

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(paginatedLetters.map(l => l.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const handlePreview = (letter) => {
    alert(`미리보기: ${letter.title}`)
  }

  const handleEdit = (letter) => {
    alert(`수정: ${letter.title}`)
  }

  const handleDelete = (letter) => {
    if (confirm(`"${letter.title}"을(를) 삭제하시겠습니까?`)) {
      alert(`삭제: ${letter.title}`)
    }
  }

  const handleBulkDelete = () => {
    if (confirm(`선택한 ${selectedItems.length}개 항목을 삭제하시겠습니까?`)) {
      alert(`${selectedItems.length}개 항목 삭제`)
      setSelectedItems([])
    }
  }

  const handleIndividualRegister = () => {
    setRegisterForm({
      series: 'K2',
      letter_number: '',
      title: '',
      description: '',
      video_file: null,
      thumbnail_file: null,
      pdf_file: null,
      duration: 0
    })
    setShowRegisterModal(true)
  }

  const handleBulkRegister = () => {
    setBulkRegisterForm({
      excel_file: null,
      video_directory: '',
      preview_data: []
    })
    setShowBulkRegisterModal(true)
  }

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setRegisterForm({ ...registerForm, video_file: file })
      
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        setRegisterForm(prev => ({ ...prev, duration: Math.floor(video.duration) }))
      }
      video.src = URL.createObjectURL(file)
    }
  }

  const handleThumbnailFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setRegisterForm({ ...registerForm, thumbnail_file: file })
    }
  }

  const handlePdfFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setRegisterForm({ ...registerForm, pdf_file: file })
    }
  }

  const handleRegisterSubmit = async () => {
    if (!registerForm.letter_number || registerForm.letter_number < 1 || registerForm.letter_number > 96) {
      alert('번호는 1~96 사이여야 합니다.')
      return
    }
    if (!registerForm.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }
    if (!registerForm.video_file) {
      alert('동영상 파일을 선택해주세요.')
      return
    }

    const formData = new FormData()
    formData.append('series', registerForm.series)
    formData.append('letter_number', registerForm.letter_number)
    formData.append('title', registerForm.title)
    formData.append('description', registerForm.description)
    formData.append('video_file', registerForm.video_file)
    formData.append('duration', registerForm.duration)
    if (registerForm.thumbnail_file) {
      formData.append('thumbnail_file', registerForm.thumbnail_file)
    }

    try {
      console.log('등록 데이터:', registerForm)
      alert('등록되었습니다.\n(실제 API 연동 필요)')
      setShowRegisterModal(false)
    } catch (error) {
      console.error('등록 오류:', error)
      alert('등록 중 오류가 발생했습니다.')
    }
  }

  // 일괄등록 - 엑셀 파일 처리
  const handleExcelFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setBulkRegisterForm({ ...bulkRegisterForm, excel_file: file })
      
      // TODO: 엑셀 파일 파싱 (XLSX 라이브러리 사용)
      // 임시 미리보기 데이터
      const sampleData = [
        { series: 'K2', letter_number: 1, title: 'K2 수학편지 1번', description: '설명1', video_filename: 'K2_001.mp4' },
        { series: 'K2', letter_number: 2, title: 'K2 수학편지 2번', description: '설명2', video_filename: 'K2_002.mp4' },
        { series: 'K2', letter_number: 3, title: 'K2 수학편지 3번', description: '설명3', video_filename: 'K2_003.mp4' },
      ]
      setBulkRegisterForm(prev => ({ ...prev, preview_data: sampleData }))
    }
  }

  // 일괄등록 제출
  const handleBulkRegisterSubmit = async () => {
    if (!bulkRegisterForm.excel_file) {
      alert('엑셀 파일을 선택해주세요.')
      return
    }
    if (!bulkRegisterForm.video_directory.trim()) {
      alert('동영상 디렉토리 경로를 입력해주세요.')
      return
    }

    try {
      const formData = new FormData()
      formData.append('excel_file', bulkRegisterForm.excel_file)
      formData.append('video_directory', bulkRegisterForm.video_directory)

      // TODO: API 호출
      console.log('일괄등록 데이터:', bulkRegisterForm)
      alert(`${bulkRegisterForm.preview_data.length}개 항목이 등록되었습니다.\n(실제 API 연동 필요)`)
      setShowBulkRegisterModal(false)
    } catch (error) {
      console.error('일괄등록 오류:', error)
      alert('일괄등록 중 오류가 발생했습니다.')
    }
  }

  // 엑셀 템플릿 다운로드
  const handleDownloadTemplate = () => {
    // TODO: 실제 엑셀 템플릿 다운로드
    alert('엑셀 템플릿 다운로드\n\n컬럼:\n- series (K2~K7, G1~G6)\n- letter_number (1~96)\n- title\n- description\n- video_filename')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ... 기존 헤더, 통계, 클래스별 카드, 필터, 테이블 코드 동일 ... */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => onNavigate('SystemAdminDashboard')}
            className="flex items-center text-teal-600 hover:text-teal-700"
          >
            <span className="text-xl mr-2">←</span>
            <span>나가기</span>
          </button>
          
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="LAS Logo" className="h-12 w-12" />
            <h1 className="text-3xl font-bold text-teal-600">수학편지 관리</h1>
          </div>
          
          <div className="w-20"></div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
            <div className="text-sm opacity-90 mb-2">전체 등록률</div>
            <div className="text-3xl font-bold mb-1">
              {Math.round((totalStats.registered / totalStats.total) * 100)}%
            </div>
            <div className="text-xs opacity-75">{totalStats.registered}/{totalStats.total}개</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
            <div className="text-sm opacity-90 mb-2">K 시리즈</div>
            <div className="text-3xl font-bold mb-1">{totalStats.kSeries}개</div>
            <div className="text-xs opacity-75">K2 ~ K7</div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-6 text-white shadow-lg">
            <div className="text-sm opacity-90 mb-2">G 시리즈</div>
            <div className="text-3xl font-bold mb-1">{totalStats.gSeries}개</div>
            <div className="text-xs opacity-75">G1 ~ G6</div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white shadow-lg">
            <div className="text-sm opacity-90 mb-2">미등록</div>
            <div className="text-3xl font-bold mb-1">{totalStats.unregistered}개</div>
            <div className="text-xs opacity-75">등록 필요</div>
          </div>
        </div>

        {/* 클래스별 카드 - 6x2 레이아웃 */}
        <div className="bg-white rounded-lg p-6 shadow mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📊 클래스별 현황</h2>
          <div className="grid grid-cols-6 gap-3">
            {classStats.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedFilter(cls.id)}
                className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedFilter === cls.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 bg-white hover:border-teal-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold text-gray-800">{cls.name}</span>
                  <span className="text-sm font-semibold text-teal-600">{cls.percentage}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span>등록 {cls.registered}</span>
                  <span>미등록 {cls.unregistered}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all"
                    style={{ width: `${cls.percentage}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="전체">전체 시리즈</option>
                <optgroup label="K 시리즈">
                  {classStats.filter(c => c.id.startsWith('K')).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
                <optgroup label="G 시리즈">
                  {classStats.filter(c => c.id.startsWith('G')).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="전체">전체 상태</option>
                <option value="등록">등록</option>
                <option value="미등록">미등록</option>
              </select>

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="제목 또는 내용 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleIndividualRegister}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                개별등록
              </button>
              <button 
                onClick={handleBulkRegister}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Upload className="w-4 h-4" />
                일괄등록
              </button>
              {selectedItems.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  선택삭제 ({selectedItems.length})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === paginatedLetters.length && paginatedLetters.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('series')}
                  >
                    시리즈 {sortConfig.key === 'series' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('letter_number')}
                  >
                    번호 {sortConfig.key === 'letter_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('title')}
                  >
                    제목 {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('duration')}
                  >
                    동영상 길이 {sortConfig.key === 'duration' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('is_ready')}
                  >
                    등록상태 {sortConfig.key === 'is_ready' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created_at')}
                  >
                    작성일 {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLetters.map((letter) => (
                  <tr key={letter.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(letter.id)}
                        onChange={() => handleSelectItem(letter.id)}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded">{letter.series}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{letter.letter_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{letter.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDuration(letter.duration)}</td>
                    <td className="px-4 py-3">
                      {letter.is_ready ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          <Check className="w-3 h-3" />
                          등록
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          <X className="w-3 h-3" />
                          미등록
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(letter.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handlePreview(letter)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                          title="미리보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(letter)}
                          className="p-1 text-teal-600 hover:bg-teal-50 rounded transition-colors" 
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(letter)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" 
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                전체 {sortedLetters.length}개 중 {((currentPage - 1) * 96) + 1} - {Math.min(currentPage * 96, sortedLetters.length)}개 표시
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-teal-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 개별등록 모달 */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src="/images/logo.png" alt="LAS Logo" className="h-10 w-10" />
                <h2 className="text-2xl font-bold text-teal-600">수학편지 개별등록</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    시리즈 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={registerForm.series}
                    onChange={(e) => setRegisterForm({ ...registerForm, series: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <optgroup label="K 시리즈">
                      {classStats.filter(c => c.id.startsWith('K')).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="G 시리즈">
                      {classStats.filter(c => c.id.startsWith('G')).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    번호 (1~96) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="96"
                    value={registerForm.letter_number}
                    onChange={(e) => setRegisterForm({ ...registerForm, letter_number: e.target.value })}
                    placeholder="1~96"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={registerForm.title}
                  onChange={(e) => setRegisterForm({ ...registerForm, title: e.target.value })}
                  placeholder="수학편지 제목을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={registerForm.description}
                  onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                  placeholder="수학편지 설명을 입력하세요"
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  수학편지 (선택)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {registerForm.pdf_file && (
                  <p className="mt-2 text-sm text-gray-600">
                    {registerForm.pdf_file.name}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  * 수학편지 전송 시 PDF 파일이 포함됩니다
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    동영상 파일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {registerForm.video_file && (
                    <p className="mt-2 text-sm text-gray-600">
                      {registerForm.video_file.name}
                      {registerForm.duration > 0 && ` (${formatDuration(registerForm.duration)})`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    썸네일 이미지 (선택)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {registerForm.thumbnail_file && (
                    <p className="mt-2 text-sm text-gray-600">
                      {registerForm.thumbnail_file.name}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    * 미선택 시 동영상 첫 프레임 사용
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
                취소
              </button>
              <button
                onClick={handleRegisterSubmit}
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일괄등록 모달 */}
      {showBulkRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src="/images/logo.png" alt="LAS Logo" className="h-10 w-10" />
                <h2 className="text-2xl font-bold text-teal-600">수학편지 일괄등록</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* 안내 메시지 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📋 일괄등록 방법</h3>
                <ol className="text-sm text-blue-700 space-y-1 ml-4 list-decimal">
                  <li>엑셀 템플릿을 다운로드하여 데이터를 입력합니다</li>
                  <li>동영상 파일들을 서버의 특정 디렉토리에 업로드합니다</li>
                  <li>작성한 엑셀 파일을 선택하고 동영상 디렉토리 경로를 입력합니다</li>
                  <li>미리보기에서 데이터를 확인 후 등록합니다</li>
                </ol>
              </div>

              {/* 엑셀 템플릿 다운로드 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    1. 엑셀 템플릿
                  </label>
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    템플릿 다운로드
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  컬럼: series, letter_number, title, description, video_filename
                </p>
              </div>

              {/* 엑셀 파일 업로드 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  2. 엑셀 파일 선택 <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {bulkRegisterForm.excel_file && (
                  <p className="mt-2 text-sm text-gray-600">
                    선택된 파일: {bulkRegisterForm.excel_file.name}
                  </p>
                )}
              </div>

              {/* 동영상 디렉토리 경로 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  3. 동영상 디렉토리 경로 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={bulkRegisterForm.video_directory}
                    onChange={(e) => setBulkRegisterForm({ ...bulkRegisterForm, video_directory: e.target.value })}
                    placeholder="/server/videos/math_letters"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  * 서버에 업로드된 동영상 파일들이 있는 디렉토리의 절대 경로를 입력하세요
                </p>
              </div>

              {/* 미리보기 */}
              {bulkRegisterForm.preview_data.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    4. 미리보기 ({bulkRegisterForm.preview_data.length}개 항목)
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">시리즈</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">번호</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">제목</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">동영상 파일명</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bulkRegisterForm.preview_data.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{item.series}</td>
                            <td className="px-3 py-2">{item.letter_number}</td>
                            <td className="px-3 py-2">{item.title}</td>
                            <td className="px-3 py-2 text-gray-600">{item.video_filename}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowBulkRegisterModal(false)}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
                취소
              </button>
              <button
                onClick={handleBulkRegisterSubmit}
                disabled={!bulkRegisterForm.excel_file || !bulkRegisterForm.video_directory}
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                일괄등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}