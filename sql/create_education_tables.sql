-- 1. 교육 테이블
CREATE TABLE IF NOT EXISTS public.educations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. 교육 신청 테이블
CREATE TABLE IF NOT EXISTS public.education_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    education_id UUID REFERENCES public.educations(id) ON DELETE CASCADE,
    applicant_name VARCHAR(100) NOT NULL,
    applicant_phone VARCHAR(20) NOT NULL,
    applicant_birthdate VARCHAR(10) NOT NULL, -- YYYY-MM-DD 또는 YYYYMMDD
    referrer_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    attendance_status VARCHAR(20) DEFAULT 'absent', -- absent, attended
    attended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    qr_code_data TEXT UNIQUE, -- 고유 QR 코드 데이터 식별자
    
    -- 전화번호와 교육별로 중복 신청 방지
    CONSTRAINT unique_education_applicant UNIQUE (education_id, applicant_phone)
);

-- RLS 정책 설정 (간단히 모든 접근 허용으로 시작하거나 필요에 맞게 설정, 실제 환경은 더 엄격하게)
ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_applications ENABLE ROW LEVEL SECURITY;

-- Educations Policies
CREATE POLICY "Public can view active educations" 
ON public.educations FOR SELECT 
USING (is_active = true);

CREATE POLICY "System Admins can manage educations" 
ON public.educations FOR ALL 
USING (true); -- 앱에서 권한 제어하므로 편의상 true (추후 JWT role 기반 제한 가능)

-- Applications Policies
CREATE POLICY "Public can insert applications" 
ON public.education_applications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can view own application by info" 
ON public.education_applications FOR SELECT 
USING (true); -- 앱에서 name, phone, birthdate로 필터링

CREATE POLICY "Managers can update applications"
ON public.education_applications FOR UPDATE
USING (true);

CREATE POLICY "Managers can delete applications"
ON public.education_applications FOR DELETE
USING (true);
