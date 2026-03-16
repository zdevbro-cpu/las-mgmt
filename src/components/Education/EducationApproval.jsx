import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { isSystemAdmin } from '../../constants/roles';
import { Check, X, Trash2, UserCheck, AlertTriangle, Link } from 'lucide-react';

export default function EducationApproval({ user, onNavigate }) {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterReferrerId, setFilterReferrerId] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    setIsLoading(true);
    let query = supabase
      .from('education_applications')
      .select(`
        *,
        education:educations(title, event_date, location),
        referrer:users(name, branch)
      `)
      .order('created_at', { ascending: false });

    // 이제 지점관리자/점장 권한을 가진 사용자도 전체 교육 신청자 목록을 볼 수 있도록 조건을 해제합니다.
    
    const { data, error } = await query;
    setIsLoading(false);

    if (error) {
      console.error('명단 조회 중 에러:', error);
      alert('데이터를 불러오지 못했습니다.');
    } else {
      setApplications(data || []);
    }
  };

  const updateStatus = async (id, newStatus, actionName) => {
    if (!window.confirm(`선택한 신청건을 "${actionName}" 처리하시겠습니까?`)) return;

    const { error } = await supabase
      .from('education_applications')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert(`${actionName} 처리 중 오류가 발생했습니다.`);
    } else {
      setApplications(apps => apps.map(app => 
        app.id === id ? { ...app, status: newStatus } : app
      ));
    }
  };

  const handleDelete = async (id, applicantName) => {
    if (!window.confirm(`[${applicantName}] 님의 교육 신청을 목록에서 영구 삭제하시겠습니까?`)) return;

    const { error } = await supabase
      .from('education_applications')
      .delete()
      .eq('id', id);

    if (error) {
      alert('삭제 중 오류가 발생했습니다.');
    } else {
      setApplications(apps => apps.filter(app => app.id !== id));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold border border-green-200">승인 완료</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold border border-red-200">거절됨</span>;
      default:
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">대기 중</span>;
    }
  };

  const uniqueReferrers = [];
  applications.forEach(app => {
    if (app.referrer_id && app.referrer && !uniqueReferrers.some(r => r.id === app.referrer_id)) {
      uniqueReferrers.push({ id: app.referrer_id, ...app.referrer });
    }
  });

  const filteredApplications = filterReferrerId 
    ? applications.filter(a => a.referrer_id === filterReferrerId)
    : applications;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white rounded-lg shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#e0f2f1] rounded-lg">
              <UserCheck size={28} className="text-[#249689]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#249689]">교육 신청 승인 관리</h1>
              <p className="text-gray-500 text-sm mt-1">
                전체 신청 내역을 조회합니다. 단, 승인 및 거절 액션은 자신이 추천인으로 지정된 내역에 한해서만 가능합니다.
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
            <button 
              onClick={() => {
                const link = `${window.location.origin}/education/apply`;
                navigator.clipboard.writeText(link)
                  .then(() => alert('📱 모바일 신청 페이지 접속 링크가 복사되었습니다.\n직원들에게 메신저 등으로 전달해주세요.'))
                  .catch(() => alert('링크 복사에 실패했습니다. 브라우저 설정을 확인해주세요.'));
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
            >
              <Link size={18} /> 신청 링크 복사
            </button>
            <button 
              onClick={() => onNavigate('AdminDashboard')}
              className="flex-1 md:flex-none px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </div>

        {/* List Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6 pb-0 mb-[-1px]">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
            <h3 className="font-bold text-lg text-gray-800">신청내역 목록</h3>
            <select 
              value={filterReferrerId}
              onChange={(e) => setFilterReferrerId(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 text-sm bg-gray-50 w-full md:w-auto min-w-[200px]"
            >
              <option value="">전체 추천인 목록 보기</option>
              {uniqueReferrers.map(r => (
                <option key={r.id} value={r.id}>{r.branch} - {r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">데이터를 불러오는 중입니다...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center text-gray-500">
              <AlertTriangle size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-1">등록된 신청 내역이 없습니다</h3>
              <p>조회된 교육 신청건이 존재하지 않습니다.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-4 font-bold text-gray-600 text-sm whitespace-nowrap">상태</th>
                      <th className="p-4 font-bold text-gray-600 text-sm whitespace-nowrap">교육 정보</th>
                      <th className="p-4 font-bold text-gray-600 text-sm whitespace-nowrap">신청자</th>
                      <th className="p-4 font-bold text-gray-600 text-sm whitespace-nowrap">연락처/생년월일</th>
                      <th className="p-4 font-bold text-gray-600 text-sm whitespace-nowrap">추천인(소속)</th>
                      <th className="p-4 font-bold text-gray-600 text-sm whitespace-nowrap">승인 처리</th>
                      <th className="p-4 font-bold text-gray-600 text-sm text-center whitespace-nowrap">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredApplications.map(app => {
                      const canEdit = isSystemAdmin(user) || app.referrer_id === user.id;
                      return (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">{getStatusBadge(app.status)}</td>
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{app.education?.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            📅 {app.education?.event_date ? new Date(app.education.event_date).toLocaleDateString() : '날짜 미정'}
                          </div>
                        </td>
                        <td className="p-4 font-bold">{app.applicant_name}</td>
                        <td className="p-4">
                          <div className="text-sm">{app.applicant_phone}</div>
                          <div className="text-xs text-gray-500 mt-1">{app.applicant_birthdate}</div>
                        </td>
                        <td className="p-4">
                          {app.referrer ? `${app.referrer.name} (${app.referrer.branch})` : '없음'}
                        </td>
                        <td className="p-4">
                          {!canEdit ? (
                            <span className="text-xs text-gray-400 font-bold bg-gray-100 px-2 py-1 rounded">권한 없음</span>
                          ) : (
                            <div className="flex gap-2">
                              <button 
                                disabled={app.status === 'approved'}
                                onClick={() => updateStatus(app.id, 'approved', '승인')}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                                  app.status === 'approved' 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-[#e0f2f1] text-[#249689] hover:bg-[#b2dfdb]'
                                }`}
                              >
                                <Check size={16} /> 승인
                              </button>
                              
                              <button 
                                disabled={app.status === 'rejected'}
                                onClick={() => updateStatus(app.id, 'rejected', '거절')}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                                  app.status === 'rejected' 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                              >
                                <X size={16} /> 거절
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            disabled={!canEdit}
                            onClick={() => canEdit && handleDelete(app.id, app.applicant_name)}
                            className={`p-2 rounded transition-colors ${!canEdit ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                            title={!canEdit ? '삭제 권한 없음' : '영구 삭제'}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 md:hidden p-4 bg-gray-50">
                {filteredApplications.map(app => {
                  const canEdit = isSystemAdmin(user) || app.referrer_id === user.id;
                  return (
                    <div key={app.id} className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
                      
                      {/* Header: Title & Status */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{app.education?.title}</h3>
                          <div className="text-xs text-gray-500">
                            📅 {app.education?.event_date ? new Date(app.education.event_date).toLocaleDateString() : '날짜 미정'}
                          </div>
                        </div>
                        <div className="shrink-0">{getStatusBadge(app.status)}</div>
                      </div>
                      
                      {/* Applicant Info */}
                      <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2 border">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold">신청자</span>
                          <span className="font-black text-gray-800 text-base">{app.applicant_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-xs">연락처</span>
                          <span className="font-medium">{app.applicant_phone}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-xs">생년월일</span>
                          <span className="font-medium">{app.applicant_birthdate}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                          <span className="text-gray-500 text-xs font-bold">추천인 확인</span>
                          <span className="font-bold text-[#249689]">{app.referrer ? `${app.referrer.branch}` : '없음'}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {!canEdit ? (
                        <div className="w-full text-center py-2.5 bg-gray-100 text-gray-400 text-xs font-bold rounded-lg px-2">
                          [권한 없음] 해당 추천인만 승인 가능
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-1">
                          <button 
                            disabled={app.status === 'approved'}
                            onClick={() => updateStatus(app.id, 'approved', '승인')}
                            className={`flex flex-1 items-center justify-center gap-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                              app.status === 'approved' 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-[#e0f2f1] text-[#249689] hover:bg-[#b2dfdb]'
                            }`}
                          >
                            <Check size={18} /> 승인
                          </button>
                          
                          <button 
                            disabled={app.status === 'rejected'}
                            onClick={() => updateStatus(app.id, 'rejected', '거절')}
                            className={`flex flex-1 items-center justify-center gap-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                              app.status === 'rejected' 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            <X size={18} /> 거절
                          </button>

                          <button 
                            onClick={() => handleDelete(app.id, app.applicant_name)}
                            className="flex items-center justify-center p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-gray-200 transition-colors"
                            title="영구 삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
