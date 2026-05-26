/**
 * Onboarding form enums, option lists, and copy for FinJar survey (labels in Vietnamese).
 */

/** @typedef {'SixJars' | 'Rule503020' | 'Custom'} BudgetMethodId */

export const BUDGET_METHOD = {
  SIX_JARS: 'SixJars',
  RULE_503020: 'Rule503020',
  CUSTOM: 'Custom',
}

export const OCCUPATION_OPTIONS = [
  { value: 'student', label: 'Học sinh/Sinh viên' },
  { value: 'office', label: 'Nhân viên văn phòng' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'business', label: 'Kinh doanh' },
  { value: 'other', label: 'Khác' },
]

export const AGE_RANGE_OPTIONS = [
  { value: 'under22', label: 'Dưới 22' },
  { value: '22_30', label: '22-30' },
  { value: '30_40', label: '30-40' },
  { value: 'over40', label: 'Trên 40' },
]

export const FINANCIAL_GOAL_OPTIONS = [
  { value: 'control_daily', label: 'Kiểm soát chi tiêu hàng ngày' },
  { value: 'save_big', label: 'Tiết kiệm mua tài sản lớn' },
  { value: 'emergency', label: 'Xây dựng quỹ khẩn cấp' },
  { value: 'debt_tuition', label: 'Trả nợ / học phí' },
  { value: 'invest', label: 'Đầu tư tương lai' },
]

export const SPENDING_CHALLENGE_OPTIONS = [
  { value: 'impulse', label: 'Chi tiêu bốc đồng' },
  { value: 'forget_log', label: 'Quên ghi chép' },
  { value: 'unstable_income', label: 'Thu nhập không ổn định' },
  { value: 'over_budget', label: 'Chi tiêu vượt kế hoạch' },
]

export const METHOD_CARDS = [
  {
    id: BUDGET_METHOD.SIX_JARS,
    title: '6 Jars Method',
    short: '6 Jars',
    description: 'Chia 6 hũ cố định theo tỷ lệ phù hợp thu nhập.',
  },
  {
    id: BUDGET_METHOD.RULE_503020,
    title: '50/30/20 Rule',
    short: '50/30/20',
    description: '50% nhu cầu, 30% mong muốn, 20% tiết kiệm.',
  },
  {
    id: BUDGET_METHOD.CUSTOM,
    title: 'Tùy chỉnh (Custom)',
    short: 'Custom',
    description: 'Tự thiết lập hũ theo ý muốn.',
  },
]

export const BUDGET_METHOD_LABEL = {
  [BUDGET_METHOD.SIX_JARS]: '6 Jars (Six Jars)',
  [BUDGET_METHOD.RULE_503020]: '50/30/20',
  [BUDGET_METHOD.CUSTOM]: 'Tùy chỉnh',
}

export const BUDGET_METHOD_DESC = {
  [BUDGET_METHOD.SIX_JARS]:
    'Hệ thống chia thu nhập theo 6 hũ mục đích (sinh hoạt, giáo dục, tiết kiệm, giải trí, đầu tư, từ thiện) với tỷ lệ gợi ý.',
  [BUDGET_METHOD.RULE_503020]: 'Nửa thu nhập cho nhu cầu, 30% cho mong muốn, 20% cho tích lũy dài hạn.',
  [BUDGET_METHOD.CUSTOM]: 'Bạn tự quyết định tên hũ và tỷ lệ phù hợp với bối cảnh tài chính.',
}

export const ONBOARDING_UI = {
  pageTitle: 'Bắt đầu với FinJar',
  stepLabel: (n, total) => `Bước ${n} / ${total}`,
  back: 'Quay lại',
  next: 'Tiếp tục',
  reviewSubmit: 'Xác nhận và bắt đầu',
  submitError:
    'Không lưu được khảo sát. Kiểm tra kết nối hoặc định dạng dữ liệu (schema BE).',
  reviewTitle: 'Gợi ý hũ theo thu nhập',
  monthlyIncome: 'Thu nhập hàng tháng (VND)',
  occupation: 'Nghề nghiệp / tình hình',
  ageRange: 'Độ tuổi',
  financialGoals: 'Mục tiêu tài chính',
  challenges: 'Thói quen / thách thức chi tiêu',
  methodTitle: 'Chọn phương pháp lập ngân sách',
}
