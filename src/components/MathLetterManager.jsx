import { useState, useEffect } from 'react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { BookOpen, Upload, Edit, Trash2, Eye, Video, FileText, Plus, ArrowLeft } from 'lucide-react';

export default function MathLetterManager({ user, onBack, onNavigate }) {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('all');
  
  // 신규 등록 및 수정 모달 상태
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    series: 'K2',
    day_number: '',
    title: '',
    description: '',
    duration: '',
    pdf_file: null,
    video_file: null
  });

  // 실제 DB에서 데이터 로드
  useEffect(() => {
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('math_letters')
        .select('*')
        .order('day_number', { ascending: true});

      if (error) throw error;
      setLetters(data || []);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // title에서 시리즈 추출
  const extractSeries = (title) => {
    if (!title) return '';
    const match = title.match(/^([KGkg]\d+)/);
    return match ? match[1].toUpperCase() : '';
  };

  // duration(초)을 분:초 형식으로 변환
  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 통계 계산
  const totalStats = {
    total: letters.length,
    kSeries: letters.filter(l => (l.series || extractSeries(l.title)).startsWith('K')).length,
    gSeries: letters.filter(l => (l.series || extractSeries(l.title)).startsWith('G')).length,
  };

  // 필터링된 목록
  const filteredLetters = letters.filter(letter => {
    const series = letter.series || extractSeries(letter.title);
    const matchesSearch = 
      letter.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      series.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.day_number?.toString().includes(searchTerm);
    
    const matchesSeries = 
      seriesFilter === 'all' || 
      (seriesFilter === 'K' && series.startsWith('K')) ||
      (seriesFilter === 'G' && series.startsWith('G'));

    return matchesSearch && matchesSeries;
  });

  // 등록 여부 확인
  const isRegistered = (letter) => {
    return letter.pdf_url && letter.video_url;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('math_letters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('삭제되었습니다.');
      fetchLetters();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleView = (letter) => {
    setSelectedLetter(letter);
    setShowModal(true);
  };

  // 동영상 시간 자동 계산
  const getVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = Math.floor(video.duration);
        resolve(duration);
      };
      
      video.onerror = () => {
        reject(new Error('동영상 메타데이터를 읽을 수 없습니다.'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  // 신규 등록 제출
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.series || !formData.day_number || !formData.title) {
      alert('시리즈, 일차, 제목은 필수 입력 항목입니다.');
      return;
    }

    if (!formData.pdf_file || !formData.video_file) {
      alert('PDF 파일과 동영상 파일을 모두 업로드해주세요.');
      return;
    }

    try {
      setUploading(true);

      // PDF 파일 업로드
      const pdfExt = formData.pdf_file.name.split('.').pop();
      const pdfFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${pdfExt}`;
      
      const { error: pdfError } = await supabase.storage
        .from('math-letters-pdf')
        .upload(pdfFileName, formData.pdf_file);

      if (pdfError) throw pdfError;

      const pdfUrl = `${supabaseUrl}/storage/v1/object/public/math-letters-pdf/${pdfFileName}`;

      // 동영상 파일 업로드
      const videoExt = formData.video_file.name.split('.').pop();
      const videoFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${videoExt}`;
      
      const { error: videoError } = await supabase.storage
        .from('math-letters-video')
        .upload(videoFileName, formData.video_file);

      if (videoError) throw videoError;

      const videoUrl = `${supabaseUrl}/storage/v1/object/public/math-letters-video/${videoFileName}`;

      // DB에 저장
      const insertData = {
        series: formData.series,
        title: formData.title,
        day_number: parseInt(formData.day_number),
        description: formData.description,
        duration: parseInt(formData.duration) || null,
        pdf_url: pdfUrl,
        video_url: videoUrl,
        is_ready: true,
        created_at: new Date().toISOString()
      };

      const { error: dbError } = await supabase
        .from('math_letters')
        .insert([insertData]);

      if (dbError) throw dbError;

      alert('등록이 완료되었습니다.');
      setShowRegisterModal(false);
      setFormData({
        series: 'K2',
        day_number: '',
        title: '',
        description: '',
        duration: '',
        pdf_file: null,
        video_file: null
      });
      fetchLetters();
    } catch (error) {
      console.error('등록 실패:', error);
      alert(`등록에 실패했습니다: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 수정 제출
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.series || !formData.day_number || !formData.title) {
      alert('시리즈, 일차, 제목은 필수 입력 항목입니다.');
      return;
    }

    try {
      setUploading(true);

      let pdfUrl = selectedLetter.pdf_url;
      let videoUrl = selectedLetter.video_url;

      // PDF 파일이 새로 업로드된 경우
      if (formData.pdf_file) {
        const pdfExt = formData.pdf_file.name.split('.').pop();
        const pdfFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${pdfExt}`;
        
        const { error: pdfError } = await supabase.storage
          .from('math-letters-pdf')
          .upload(pdfFileName, formData.pdf_file);

        if (pdfError) throw pdfError;
        pdfUrl = `${supabaseUrl}/storage/v1/object/public/math-letters-pdf/${pdfFileName}`;
      }

      // 동영상 파일이 새로 업로드된 경우
      if (formData.video_file) {
        const videoExt = formData.video_file.name.split('.').pop();
        const videoFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${videoExt}`;
        
        const { error: videoError } = await supabase.storage
          .from('math-letters-video')
          .upload(videoFileName, formData.video_file);

        if (videoError) throw videoError;
        videoUrl = `${supabaseUrl}/storage/v1/object/public/math-letters-video/${videoFileName}`;
      }

      // DB 업데이트
      const updateData = {
        series: formData.series,
        title: formData.title,
        day_number: parseInt(formData.day_number),
        description: formData.description,
        duration: parseInt(formData.duration) || null,
        pdf_url: pdfUrl,
        video_url: videoUrl,
        is_ready: true
      };

      const { error: dbError } = await supabase
        .from('math_letters')
        .update(updateData)
        .eq('id', selectedLetter.id);

      if (dbError) throw dbError;

      alert('수정이 완료되었습니다.');
      setShowEditModal(false);
      setShowModal(false);
      fetchLetters();
    } catch (error) {
      console.error('수정 실패:', error);
      alert(`수정에 실패했습니다: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">데이터 로딩 중...</p>
          </div>
        </div>
      ) : (
        <>
          {/* 헤더 */}
          <div className="max-w-7xl mx-auto mb-6">
            <div className="flex items-center justify-between mb-4">
              {/* 왼쪽: 나가기 */}
              <button
                onClick={() => onNavigate('SystemAdminDashboard')}
                className="flex items-center text-teal-600 hover:text-teal-700"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                <span>나가기</span>
              </button>

              {/* 중앙: 로고 + 타이틀 */}
              <div className="flex items-center gap-3">
                <img 
                  src="/images/logo.png" 
                  alt="LAS Logo" 
                  className="h-10 w-10 sm:h-12 sm:w-12"
                />
                <h1 className="text-xl sm:text-2xl font-bold text-teal-700">
                  수학편지 관리
                </h1>
              </div>

              {/* 오른쪽: 신규 등록 */}
              <button
                onClick={() => {
                  setFormData({
                    series: 'K2',
                    day_number: '',
                    title: '',
                    description: '',
                    duration: '',
                    pdf_file: null,
                    video_file: null
                  });
                  setShowRegisterModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90"
                style={{ backgroundColor: '#249689' }}
              >
                <Plus className="w-5 h-5" />
                <span>신규 등록</span>
              </button>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600 mb-1">전체</p>
                <p className="text-2xl font-bold text-gray-800">{totalStats.total}개</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600 mb-1">K 시리즈</p>
                <p className="text-2xl font-bold text-teal-600">{totalStats.kSeries}개</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600 mb-1">G 시리즈</p>
                <p className="text-2xl font-bold text-blue-600">{totalStats.gSeries}개</p>
              </div>
            </div>

            {/* 필터 */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSeriesFilter('all')}
                    className={`px-4 py-2 rounded-lg ${seriesFilter === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setSeriesFilter('K')}
                    className={`px-4 py-2 rounded-lg ${seriesFilter === 'K' ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    K 시리즈
                  </button>
                  <button
                    onClick={() => setSeriesFilter('G')}
                    className={`px-4 py-2 rounded-lg ${seriesFilter === 'G' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    G 시리즈
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 테이블 */}
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">시리즈</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">일차</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">길이</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLetters.map((letter) => {
                      const series = letter.series || extractSeries(letter.title);
                      const registered = isRegistered(letter);
                      
                      return (
                        <tr key={letter.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {series}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {letter.day_number}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {letter.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDuration(letter.duration)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              registered 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {registered ? '등록완료' : '미등록'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleView(letter)}
                                className="text-teal-600 hover:text-teal-900"
                                title="상세보기"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(letter.id)}
                                className="text-red-600 hover:text-red-900"
                                title="삭제"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 상세보기 모달 */}
          {showModal && selectedLetter && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedLetter.title}</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>시리즈: {selectedLetter.series || extractSeries(selectedLetter.title)}</span>
                        <span>일차: {selectedLetter.day_number}</span>
                        <span>길이: {formatDuration(selectedLetter.duration)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <span className="text-2xl">&times;</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedLetter.description && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">설명</h3>
                        <p className="text-gray-600">{selectedLetter.description}</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      {selectedLetter.pdf_url && (
                        <a
                          href={selectedLetter.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <FileText className="w-5 h-5" />
                          <span>PDF 보기</span>
                        </a>
                      )}

                      {selectedLetter.video_url && (
                        <a
                          href={selectedLetter.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Video className="w-5 h-5" />
                          <span>동영상 보기</span>
                        </a>
                      )}
                    </div>

                    {!selectedLetter.pdf_url && !selectedLetter.video_url && (
                      <div className="text-center py-8 text-gray-500">
                        등록된 콘텐츠가 없습니다
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setFormData({
                          series: selectedLetter.series || extractSeries(selectedLetter.title),
                          day_number: selectedLetter.day_number.toString(),
                          title: selectedLetter.title,
                          description: selectedLetter.description || '',
                          duration: selectedLetter.duration?.toString() || '',
                          pdf_file: null,
                          video_file: null
                        });
                        setShowModal(false);
                        setShowEditModal(true);
                      }}
                      className="px-6 py-2 text-white rounded-lg hover:opacity-90"
                      style={{ backgroundColor: '#249689' }}
                    >
                      수정하기
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 수정 모달 */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">수학편지 수정</h2>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                      disabled={uploading}
                    >
                      <span className="text-2xl">&times;</span>
                    </button>
                  </div>

                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          시리즈 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.series}
                          onChange={(e) => setFormData({...formData, series: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          required
                        >
                          <option value="K2">K2</option>
                          <option value="K3">K3</option>
                          <option value="K4">K4</option>
                          <option value="K5">K5</option>
                          <option value="K6">K6</option>
                          <option value="K7">K7</option>
                          <option value="G1">G1</option>
                          <option value="G2">G2</option>
                          <option value="G3">G3</option>
                          <option value="G4">G4</option>
                          <option value="G5">G5</option>
                          <option value="G6">G6</option>
                          <option value="G7">G7</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          일차 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.day_number}
                          onChange={(e) => setFormData({...formData, day_number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        제목 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설명
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        rows="3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        수학편지
                      </label>
                      {selectedLetter.pdf_url && (
                        <div className="mb-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">현재 파일:</p>
                          <a 
                            href={selectedLetter.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-teal-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            {selectedLetter.pdf_url.split('/').pop()}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setFormData({...formData, pdf_file: e.target.files[0]})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      {formData.pdf_file && (
                        <p className="text-sm text-teal-600 mt-1">→ 새 파일로 교체: {formData.pdf_file.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        동영상 파일
                      </label>
                      {selectedLetter.video_url && (
                        <div className="mb-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">현재 파일:</p>
                          <a 
                            href={selectedLetter.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Video className="w-4 h-4" />
                            {selectedLetter.video_url.split('/').pop()}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              try {
                                const duration = await getVideoDuration(file);
                                setFormData({...formData, video_file: file, duration: duration.toString()});
                              } catch (error) {
                                console.error('동영상 시간 계산 실패:', error);
                                setFormData({...formData, video_file: file});
                              }
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        <Video className="w-5 h-5 text-gray-400" />
                      </div>
                      {formData.video_file && (
                        <p className="text-sm text-blue-600 mt-1">
                          → 새 파일로 교체: {formData.video_file.name}
                          {formData.duration && ` (${formatDuration(parseInt(formData.duration))})`}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        disabled={uploading}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                        style={{ backgroundColor: '#249689' }}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>저장 중...</span>
                          </>
                        ) : (
                          <>
                            <Edit className="w-5 h-5" />
                            <span>저장</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 신규 등록 모달 */}
          {showRegisterModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">수학편지 신규 등록</h2>
                    <button
                      onClick={() => setShowRegisterModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                      disabled={uploading}
                    >
                      <span className="text-2xl">&times;</span>
                    </button>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          시리즈 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.series}
                          onChange={(e) => setFormData({...formData, series: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          required
                        >
                          <option value="K2">K2</option>
                          <option value="K3">K3</option>
                          <option value="K4">K4</option>
                          <option value="K5">K5</option>
                          <option value="K6">K6</option>
                          <option value="K7">K7</option>
                          <option value="G1">G1</option>
                          <option value="G2">G2</option>
                          <option value="G3">G3</option>
                          <option value="G4">G4</option>
                          <option value="G5">G5</option>
                          <option value="G6">G6</option>
                          <option value="G7">G7</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          일차 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.day_number}
                          onChange={(e) => setFormData({...formData, day_number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="예: 1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        제목 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="예: K2 수학편지 1번"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설명
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        rows="3"
                        placeholder="수학편지에 대한 설명을 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        수학편지 <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setFormData({...formData, pdf_file: e.target.files[0]})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          required
                        />
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      {formData.pdf_file && (
                        <p className="text-sm text-gray-600 mt-1">선택됨: {formData.pdf_file.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        동영상 파일 <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              try {
                                const duration = await getVideoDuration(file);
                                setFormData({...formData, video_file: file, duration: duration.toString()});
                              } catch (error) {
                                console.error('동영상 시간 계산 실패:', error);
                                setFormData({...formData, video_file: file});
                              }
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          required
                        />
                        <Video className="w-5 h-5 text-gray-400" />
                      </div>
                      {formData.video_file && (
                        <p className="text-sm text-gray-600 mt-1">
                          선택됨: {formData.video_file.name}
                          {formData.duration && ` (${formatDuration(parseInt(formData.duration))})`}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowRegisterModal(false)}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        disabled={uploading}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                        style={{ backgroundColor: '#249689' }}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>업로드 중...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            <span>등록</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}