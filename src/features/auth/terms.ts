/**
 * 가입 동의 3종 — h04·h05의 [보기]가 여는 h40의 내용.
 * 세 동의가 팝업 부품 하나를 돌려쓴다 (00 문서 4절).
 *
 * ★ 영상 동의만 시안에 전문이 그려져 있다. 이용약관·개인정보 두 건은 문구가 아직 없어
 *   지어내지 않고 비워 둔다(00 문서 5절과 같은 처리). 법무 문구가 오면 sections만 채우면 된다.
 */

export interface TermSection {
  heading: string;
  body: string;
}

export interface Term {
  key: TermKey;
  /** 가입 화면의 체크박스 문구 */
  label: string;
  /** 팝업 제목 */
  title: string;
  /** 한 줄 요약 — 보라 상자 */
  summary: string | null;
  sections: TermSection[];
}

export type TermKey = 'service' | 'privacy' | 'video';

export const TERMS: Record<TermKey, Term> = {
  service: {
    key: 'service',
    label: '이용약관에 동의합니다',
    title: '이용약관',
    summary: null,
    sections: [],
  },
  privacy: {
    key: 'privacy',
    label: '개인정보 수집·이용에 동의합니다',
    title: '개인정보 수집·이용 동의',
    summary: null,
    sections: [],
  },
  video: {
    key: 'video',
    label: '블랙박스 영상(개인영상정보) 수집·이용에 동의합니다',
    title: '블랙박스 영상 수집·이용 동의',
    summary:
      '올린 영상은 이 사건을 처리할 때만 써요. 사건을 지우면 영상도 함께 지워지고, 보험사에는 회원님이 [보내기]를 눌렀을 때만 갑니다.',
    sections: [
      {
        heading: '1. 무엇을 받나요',
        body: '블랙박스 영상 파일과, 영상에서 읽어 낸 사고 정보(차선 · 진행 방향 · 신호 · 속도 · 충돌 부위)를 받아요.',
      },
      {
        heading: '2. 어디에 쓰나요',
        body: '과실비율을 따지고, 사건경위서와 반박의견서를 쓰는 데만 써요. 광고나 다른 목적으로는 쓰지 않아요.',
      },
      {
        heading: '3. 얼마나 갖고 있나요',
        body: '그 사건이 있는 동안만요. 사건을 지우면 영상과 읽어 낸 정보가 함께 지워져요.',
      },
      {
        heading: '4. 누구에게 보내나요',
        body: '회원님이 반박의견서에서 [보내기]를 눌렀을 때, 회원님이 직접 적은 받는이에게만 첨부로 갑니다. 그 밖의 누구에게도 보내지 않아요.',
      },
      {
        heading: '5. 거절할 수 있나요',
        body: '거절해도 괜찮아요. 다만 영상이 없으면 과실비율을 따져 드릴 수 없어요.',
      },
    ],
  },
};

/** 가입 화면에 보이는 순서. 셋 다 필수다 */
export const TERM_ORDER: TermKey[] = ['service', 'privacy', 'video'];
