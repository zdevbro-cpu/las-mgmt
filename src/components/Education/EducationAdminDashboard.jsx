import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LogOut, BookOpen, Plus, Users, CheckCircle, ChevronLeft, Camera, X, FileDown } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as XLSX from 'xlsx';

export default function EducationAdminDashboard({ user, onNavigate }) {
  const [educations, setEducations] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', event_date: '', location: '', description: '' });
  const [selectedEducation, setSelectedEducation] = useState(null);
  const [applications, setApplications] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [filterReferrerId, setFilterReferrerId] = useState('');

  useEffect(() => {
    fetchEducations();
  }, []);

  const fetchEducations = async () => {
    const { data, error } = await supabase
      .from('educations')
      .select('*, education_applications(count)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setEducations(data);
    }
  };

  const fetchApplications = async (educationId) => {
    const { data, error } = await supabase
      .from('education_applications')
      .select('*, referrer:users(name, branch)')
      .eq('education_id', educationId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApplications(data);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (editMode && editingId) {
      const { error } = await supabase
        .from('educations')
        .update({
          title: formData.title,
          event_date: formData.event_date,
          location: formData.location,
          description: formData.description
        })
        .eq('id', editingId);

      if (!error) {
        setShowCreateModal(false);
        setEditMode(false);
        setEditingId(null);
        setFormData({ title: '', event_date: '', location: '', description: '' });
        fetchEducations();
        alert('교육이 성공적으로 수정되었습니다.');
      } else {
        alert('수정 중 오류가 발생했습니다: ' + error.message);
      }
    } else {
      const { error } = await supabase
        .from('educations')
        .insert({
          ...formData,
          created_by: user.id
        });

      if (!error) {
        setShowCreateModal(false);
        setFormData({ title: '', event_date: '', location: '', description: '' });
        fetchEducations();
        alert('교육이 성공적으로 생성되었습니다.');
      } else {
        alert('생성 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    setEditingId(null);
    setFormData({ title: '', event_date: '', location: '', description: '' });
    setShowCreateModal(true);
  };

  const openEditModal = (edu) => {
    setEditMode(true);
    setEditingId(edu.id);
    setFormData({
      title: edu.title,
      event_date: edu.event_date.split('+')[0], // strip timezone if necessary
      location: edu.location,
      description: edu.description
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (edu) => {
    if (window.confirm(`'${edu.title}' 교육을 삭제하시겠습니까? 신청 내역도 함께 비워집니다.`)) {
      const { error } = await supabase
        .from('educations')
        .delete()
        .eq('id', edu.id);

      if (!error) {
        alert('삭제되었습니다.');
        fetchEducations();
      } else {
        alert('삭제 중 오류가 발생했습니다: ' + error.message);
      }
    }
  };

  const handleViewDetails = (edu) => {
    setSelectedEducation(edu);
    setIsScannerOpen(false); // Reset scanner UI when viewing details
    setFilterReferrerId(''); // Reset filter
    fetchApplications(edu.id);
  };

  const toggleAttendance = async (appId, currentStatus) => {
    const newStatus = currentStatus === 'attended' ? 'absent' : 'attended';
    const { error } = await supabase
      .from('education_applications')
      .update({ attendance_status: newStatus, attended_at: newStatus === 'attended' ? new Date().toISOString() : null })
      .eq('id', appId);

    if (!error) {
      setApplications(apps => apps.map(app => app.id === appId ? { ...app, attendance_status: newStatus } : app));
    }
  };

  // Use a ref to keep track of the latest applications state without triggering useEffect re-runs
  const applicationsRef = React.useRef(applications);
  useEffect(() => {
    applicationsRef.current = applications;
  }, [applications]);

  useEffect(() => {
    if (selectedEducation && isScannerOpen) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      const onScanSuccess = async (decodedText) => {
        // Use the ref to get the latest applications data
        const currentApplications = applicationsRef.current;
        const app = currentApplications.find(a => a.qr_code_data === decodedText || a.id === decodedText);

        if (!app) {
          alert("⚠️ 이 교육 과정의 신청자가 아니거나 유효하지 않은 QR 코드입니다.");
          return;
        }

        if (app.attendance_status === 'attended') {
          alert(`⚠️ [${app.applicant_name}] 님은 이미 출석 처리되었습니다.`);
          return;
        }

        const { error } = await supabase
          .from('education_applications')
          .update({ attendance_status: 'attended', attended_at: new Date().toISOString() })
          .eq('id', app.id);

        if (!error) {
          setApplications(prev => prev.map(a => a.id === app.id ? { ...a, attendance_status: 'attended' } : a));
          alert(`✅ [${app.applicant_name}] 님 출석 처리가 정상적으로 완료되었습니다!`);
        } else {
          alert("출석 처리 중 오류가 발생했습니다: " + error.message);
        }
      };

      scanner.render(onScanSuccess, () => { });

      return () => {
        scanner.clear().catch(e => console.error("Scanner clear fail:", e));
      };
    }
  }, [isScannerOpen, selectedEducation]); // Removed applications from dependency array

  const handleDownloadExcel = (filteredApps) => {
    if (!filteredApps || filteredApps.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    const excelData = filteredApps.map(app => ({
      "이름": app.applicant_name,
      "생년월일": app.applicant_birthdate,
      "전화번호": app.applicant_phone,
      "추천인": app.referrer ? app.referrer.name : "없음",
      "소속지점": app.referrer ? app.referrer.branch : "없음",
      "출석상태": app.attendance_status === 'attended' ? '출석' : '미출석',
      "출석시간": app.attended_at ? new Date(app.attended_at).toLocaleString() : '-',
      "신청일시": new Date(app.created_at).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "신청자목록");

    const fileName = `교육명단_${selectedEducation.title}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (selectedEducation) {
    const uniqueReferrers = [];
    applications.forEach(app => {
      if (app.referrer_id && app.referrer && !uniqueReferrers.some(r => r.id === app.referrer_id)) {
        uniqueReferrers.push({ id: app.referrer_id, ...app.referrer });
      }
    });

    const filteredApplications = filterReferrerId
      ? applications.filter(a => a.referrer_id === filterReferrerId)
      : applications;

    const attendedCount = filteredApplications.filter(a => a.attendance_status === 'attended').length;
    const totalCount = filteredApplications.length;

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedEducation(null)} className="p-2 border rounded hover:bg-gray-100">
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold" style={{ color: '#249689' }}>
                {selectedEducation.title} 신청현황
              </h2>
            </div>
            <button
              onClick={() => setIsScannerOpen(!isScannerOpen)}
              className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition-colors ${isScannerOpen ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-[#e0f2f1] text-[#249689] hover:bg-[#b2dfdb]'
                }`}
            >
              {isScannerOpen ? (
                <><X size={20} /> 스캐너 닫기</>
              ) : (
                <><Camera size={20} /> QR 스캐너 열기</>
              )}
            </button>
          </div>

          {isScannerOpen && (
            <div className="mb-6 bg-gray-50 border p-4 rounded-lg">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Camera size={18} /> 카메라/스캐너 장치를 허용해주세요. 자동으로 출석 처리됩니다.
              </h3>
              <div id="qr-reader" className="w-full max-w-sm mx-auto overflow-hidden bg-white shadow-sm rounded-lg border"></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-blue-800 font-bold">총 신청 인원</h3>
              <p className="text-3xl font-black">{totalCount}명</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-green-800 font-bold">참석 인원</h3>
              <p className="text-3xl font-black">{attendedCount}명</p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">신청자 목록</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownloadExcel(filteredApplications)}
                className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-bold text-sm"
              >
                <FileDown size={18} /> 엑셀 다운로드
              </button>
              <select
                value={filterReferrerId}
                onChange={(e) => setFilterReferrerId(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 text-sm bg-white min-w-[200px]"
              >
                <option value="">전체 추천인 목록 보기</option>
                {uniqueReferrers.map(r => (
                  <option key={r.id} value={r.id}>{r.branch} - {r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border-b">이름</th>
                  <th className="p-3 border-b">생년월일</th>
                  <th className="p-3 border-b">전화번호</th>
                  <th className="p-3 border-b">추천인(소속)</th>
                  <th className="p-3 border-b">출석 여부</th>
                  <th className="p-3 border-b">동작</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map(app => (
                  <tr key={app.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{app.applicant_name}</td>
                    <td className="p-3">{app.applicant_birthdate}</td>
                    <td className="p-3">{app.applicant_phone}</td>
                    <td className="p-3">
                      {app.referrer ? `${app.referrer.name} (${app.referrer.branch})` : '없음'}
                    </td>
                    <td className="p-3">
                      {app.attendance_status === 'attended' ?
                        <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={16} /> 출석 완료</span> :
                        <span className="text-gray-400">미출석</span>}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleAttendance(app.id, app.attendance_status)}
                        className={`px-3 py-1 rounded text-white text-sm ${app.attendance_status === 'attended' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                      >
                        {app.attendance_status === 'attended' ? '출석 취소' : '수동 출석'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">조회된 신청자가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between p-6 bg-white rounded-lg shadow">
          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-[#249689]" />
            <h1 className="text-2xl font-bold text-[#249689]">교육 관리 (시스템관리자)</h1>
          </div>
          <button
            onClick={() => onNavigate('SystemAdminDashboard')}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-2"
          >
            돌아가기
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">생성된 교육 목록</h2>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#249689] text-white rounded-lg hover:bg-[#1d7b70] flex items-center gap-2"
            >
              <Plus size={20} /> 새 교육 등록
            </button>
          </div>

          <div className="grid gap-4">
            {educations.map(edu => (
              <div key={edu.id} className="border rounded-lg p-5 flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{edu.title}</h3>
                  <p className="text-gray-600 text-sm mt-1 flex items-center gap-4">
                    <span>📅 {new Date(edu.event_date).toLocaleString()}</span>
                    <span>📍 {edu.location}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(edu)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 font-bold rounded hover:bg-gray-200"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(edu)}
                    className="px-3 py-2 bg-red-50 text-red-600 font-bold rounded hover:bg-red-100"
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => handleViewDetails(edu)}
                    className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded hover:bg-blue-100 ml-2"
                  >
                    현황/출석 관리
                  </button>
                </div>
              </div>
            ))}
            {educations.length === 0 && (
              <div className="text-center py-10 text-gray-500 border rounded-lg bg-gray-50">
                등록된 교육 정보가 없습니다.
              </div>
            )}
          </div>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">{editMode ? '교육 정보 수정' : '새 교육 등록'}</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">교육명</label>
                  <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} type="text" className="w-full border rounded p-2" placeholder="예: 4월 신규직원 교육" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">교육 일시</label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="date"
                      className="flex-1 border rounded p-2"
                      onChange={(e) => {
                        const newDate = e.target.value;
                        const oldTime = formData.event_date ? formData.event_date.split('T')[1]?.substring(0, 5) || '09:00' : '09:00';
                        setFormData({ ...formData, event_date: `${newDate}T${oldTime}` });
                      }}
                      value={formData.event_date ? formData.event_date.split('T')[0] : ''}
                    />
                    <select
                      required
                      className="border rounded p-2"
                      onChange={(e) => {
                        const newTime = e.target.value;
                        const oldDate = formData.event_date ? formData.event_date.split('T')[0] : new Date().toISOString().split('T')[0];
                        setFormData({ ...formData, event_date: `${oldDate}T${newTime}` });
                      }}
                      value={formData.event_date ? formData.event_date.split('T')[1]?.substring(0, 5) : ''}
                    >
                      <option value="" disabled>시간 선택</option>
                      {Array.from({ length: 19 }, (_, i) => {
                        // 09:00 to 18:00 step 30 mins
                        const hour = Math.floor(9 + i / 2);
                        const minute = i % 2 === 0 ? '00' : '30';
                        const timeString = `${hour.toString().padStart(2, '0')}:${minute}`;
                        return <option key={timeString} value={timeString}>{timeString}</option>
                      })}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">장소</label>
                  <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} type="text" className="w-full border rounded p-2" placeholder="예: 본사 대강의장 (또는 온라인)" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">상세 설명</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded p-2 h-24" placeholder="교육 내용, 준비물 등"></textarea>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded hover:bg-gray-100">취소</button>
                  <button type="submit" className="px-4 py-2 bg-[#249689] text-white rounded hover:bg-[#1d7b70]">{editMode ? '수정 완료' : '등록 완료'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
