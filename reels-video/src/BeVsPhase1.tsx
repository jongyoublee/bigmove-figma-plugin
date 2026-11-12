// 생동성 vs 임상1상 설명 릴스 (1080x1920, 30fps, 음악 없음)
// 문구 원칙: 쉼표 최소, 의학적 판단·금액·사례비 금지 (docs/7-인스타그램/인스타그램-운영-가이드.md)
import React from 'react';
import {
  AbsoluteFill,
  Html5Audio,
  Sequence,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ── 디자인 값 (카드뉴스와 같음) ──
export const C = {
  bg: '#FAF8F3',
  ink: '#3D3D3D',
  green: '#54A329',
  lime: '#A8D86E',
  gray: '#8A8A8A',
  line: '#E4E1D9',
  white: '#FFFFFF',
};
export const FONT = "'Noto Sans KR', sans-serif";
export const SAFE_TOP = 250; // 인스타 위쪽 UI 자리
export const SIDE = 96;

// ── 장면 길이(프레임, 30fps) ──
const S = { intro: 90, be: 240, p1: 240, sum: 210, end: 150 };
export const TOTAL = S.intro + S.be + S.p1 + S.sum + S.end; // 930 = 31초

// ── 공통 움직임 ──
export const useIn = (delay = 0) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping: 200 } });
};

export const FadeUp: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay = 0,
  children,
  style,
}) => {
  const p = useIn(delay);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)`, ...style }}>{children}</div>
  );
};

export const Chip: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => (
  <FadeUp delay={delay}>
    <span
      style={{
        display: 'inline-block',
        padding: '14px 30px',
        borderRadius: 999,
        background: C.green,
        color: C.white,
        fontSize: 38,
        fontWeight: 700,
      }}
    >
      {text}
    </span>
  </FadeUp>
);

export const Title: React.FC<{ lines: string[]; delay?: number; size?: number }> = ({ lines, delay = 0, size = 104 }) => (
  <div style={{ fontSize: size, fontWeight: 900, lineHeight: 1.22, color: C.ink, letterSpacing: -2 }}>
    {lines.map((l, i) => (
      <FadeUp key={i} delay={delay + i * 6}>
        {l}
      </FadeUp>
    ))}
  </div>
);

export const Caption: React.FC<{ lines: string[]; delay?: number }> = ({ lines, delay = 0 }) => (
  <FadeUp delay={delay} style={{ fontSize: 48, lineHeight: 1.55, color: C.ink }}>
    {lines.map((l, i) => (
      <div key={i}>{l}</div>
    ))}
  </FadeUp>
);

const Brand: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: SAFE_TOP - 110,
      left: SIDE,
      fontSize: 40,
      fontWeight: 900,
      color: C.green,
      letterSpacing: -1,
    }}
  >
    빅무브
  </div>
);

// gap: Phase1Pk에서 장면별로 넓힐 때만 씀 (기본 44, BeVsPhase1은 그대로)
export const Page: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 44 }) => (
  <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
    <Brand />
    <div
      style={{
        position: 'absolute',
        top: SAFE_TOP + 40,
        left: SIDE,
        right: SIDE,
        display: 'flex',
        flexDirection: 'column',
        gap,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

// ── 납작한 캡슐 (3D 렌더 금지 원칙) ──
const Capsule: React.FC<{ left: string; w?: number; label: string; delay?: number }> = ({
  left,
  w = 260,
  label,
  delay = 0,
}) => {
  const p = useIn(delay);
  const h = w * 0.38;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 22,
        opacity: p,
        transform: `scale(${0.8 + p * 0.2})`,
      }}
    >
      <div
        style={{
          width: w,
          height: h,
          borderRadius: h,
          border: `5px solid ${C.ink}`,
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <div style={{ flex: 1, background: left, borderRight: `5px solid ${C.ink}` }} />
        <div style={{ flex: 1, background: C.white }} />
      </div>
      <div style={{ fontSize: 40, fontWeight: 700, color: C.ink }}>{label}</div>
    </div>
  );
};

// ── 장면 1: 질문 ──
export const Intro: React.FC = () => (
  <Page>
    <Chip text="자주 묻는 질문" />
    <div style={{ height: 120 }} />
    <Title lines={['생동성이랑', '임상1상', '뭐가 달라요?']} delay={8} size={132} />
    <Caption lines={['상담 때 제일 많이 받는 질문']} delay={30} />
  </Page>
);

// ── 장면 2: 생동성 = 몸속 농도 곡선 두 개가 겹침 ──
export const GW = 840;
export const GH = 520;
export const curve = (scale: number, shift: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = (i / 80) * 12;
    const tt = Math.max(0, t - shift);
    const v = scale * 1.6 * (Math.exp(-0.35 * tt) - Math.exp(-1.6 * tt));
    const y = GH - v * GH * 0.9;
    pts.push(`${i === 0 ? 'M' : 'L'}${((i / 80) * GW).toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
};

export const Draw: React.FC<{ id: string; d: string; color: string; start: number; dash?: string; width?: number }> = ({
  id,
  d,
  color,
  start,
  dash,
  width = 10,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [start, start + 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect x={-20} y={-40} width={(GW + 40) * p} height={GH + 80} />
        </clipPath>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dash}
        clipPath={`url(#${id})`}
      />
    </>
  );
};

const BE: React.FC = () => {
  const f = useCurrentFrame();
  const legend = interpolate(f, [150, 170], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Page>
      <Chip text="생동성시험" />
      <Title lines={['이미 나온 약과', '같은지 확인']} delay={6} />
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 10 }}>
        <Capsule left={C.ink} label="이미 나온 약" delay={30} />
        <Capsule left={C.green} label="같은 성분 약" delay={42} />
      </div>
      <FadeUp delay={60}>
        <svg width={888} height={600} viewBox="-24 -20 888 600" style={{ overflow: 'visible' }}>
          <line x1={0} y1={GH} x2={GW} y2={GH} stroke={C.ink} strokeWidth={4} />
          <line x1={0} y1={0} x2={0} y2={GH} stroke={C.ink} strokeWidth={4} />
          <text x={GW} y={570} textAnchor="end" fontSize={34} fill={C.gray} fontFamily={FONT}>
            시간
          </text>
          <text x={20} y={10} fontSize={34} fill={C.gray} fontFamily={FONT}>
            몸속 농도
          </text>
          <Draw id="c1" d={curve(1, 0)} color={C.ink} start={75} />
          <Draw id="c2" d={curve(0.97, 0.15)} color={C.green} start={105} dash="2 18" width={12} />
          <g opacity={legend}>
            <rect x={500} y={60} width={320} height={130} rx={18} fill={C.white} stroke={C.line} strokeWidth={3} />
            <line x1={525} y1={105} x2={580} y2={105} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
            <text x={600} y={117} fontSize={32} fill={C.ink} fontFamily={FONT}>
              이미 나온 약
            </text>
            <line
              x1={525}
              y1={155}
              x2={580}
              y2={155}
              stroke={C.green}
              strokeWidth={12}
              strokeDasharray="2 18"
              strokeLinecap="round"
            />
            <text x={600} y={167} fontSize={32} fill={C.ink} fontFamily={FONT}>
              같은 성분 약
            </text>
          </g>
        </svg>
      </FadeUp>
      <Caption lines={['몸에 들어가는 속도와 양이', '같은지 비교해요']} delay={160} />
    </Page>
  );
};

// ── 장면 3: 임상1상 = 적은 양부터 단계적으로 ──
const Phase1: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bars = [90, 160, 240, 330, 430];
  return (
    <Page>
      <Chip text="임상1상" />
      <Title lines={['새로운 약을', '처음 확인']} delay={6} />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
        <Capsule left={C.lime} label="개발 중인 새 약" delay={30} w={300} />
      </div>
      <div style={{ position: 'relative', height: 560, marginTop: 10 }}>
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 36,
            justifyContent: 'center',
          }}
        >
          {bars.map((h, i) => {
            const p = spring({ frame: f - (70 + i * 14), fps, config: { damping: 200 } });
            return (
              <div
                key={i}
                style={{
                  width: 120,
                  height: h * p,
                  background: i === bars.length - 1 ? C.green : C.lime,
                  borderRadius: '16px 16px 0 0',
                }}
              />
            );
          })}
        </div>
        <div style={{ position: 'absolute', bottom: 56, left: 40, right: 40, height: 4, background: C.ink }} />
        <FadeUp
          delay={140}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', fontSize: 36, color: C.gray }}
        >
          적은 양부터 단계적으로
        </FadeUp>
      </div>
      <Caption lines={['개발 중인 새 약이 몸에서', '어떻게 작용하는지 살펴요']} delay={160} />
    </Page>
  );
};

// ── 장면 4: 한 줄 정리 (좌우 비교) ──
const Card: React.FC<{ chip: string; main: string; sub: string; accent: string; delay: number }> = ({
  chip,
  main,
  sub,
  accent,
  delay,
}) => (
  <FadeUp delay={delay} style={{ flex: 1 }}>
    <div
      style={{
        background: C.white,
        border: `3px solid ${C.line}`,
        borderTop: `14px solid ${accent}`,
        borderRadius: 28,
        padding: '48px 36px',
        minHeight: 560,
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 700, color: C.gray }}>{chip}</div>
      <div style={{ fontSize: 76, fontWeight: 900, color: C.ink, lineHeight: 1.2, whiteSpace: 'pre-line' }}>{main}</div>
      <div style={{ fontSize: 38, color: C.ink, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{sub}</div>
    </div>
  </FadeUp>
);

const Summary: React.FC = () => (
  <Page>
    <Chip text="한 줄 정리" />
    <Title lines={['같은지 확인과', '처음 확인']} delay={6} />
    <div style={{ display: 'flex', gap: 32, marginTop: 20 }}>
      <Card chip="생동성시험" main={'같은지\n확인'} sub={'이미 나온 약과\n같은 성분 약 비교'} accent={C.ink} delay={30} />
      <Card chip="임상1상" main={'처음\n확인'} sub={'개발 중인 새 약을\n단계적으로 확인'} accent={C.green} delay={50} />
    </div>
  </Page>
);

// ── 장면 5: 공통점 + 마무리 ──
// 간격 값은 Phase1Pk에서 넓힐 때만 씀 (기본값 = BeVsPhase1 그대로)
export const End: React.FC<{ pageGap?: number; listTop?: number; stepGap?: number; footTop?: number }> = ({
  pageGap = 44,
  listTop = 20,
  stepGap = 22,
  footTop = 40,
}) => {
  const steps = ['공고 확인', '신청', '상담', '신체검사', '참여']; // 1번 게시물 11/10 수정과 같게
  return (
    <Page gap={pageGap}>
      <Chip text="공통점" />
      <Title lines={['신청 순서는', '같아요']} delay={6} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: stepGap, marginTop: listTop }}>
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          return (
            <FadeUp key={s} delay={30 + i * 12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 42,
                    background: last ? C.green : C.white,
                    border: `4px solid ${C.green}`,
                    color: last ? C.white : C.green,
                    fontSize: 40,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontSize: 56, fontWeight: 700, color: C.ink }}>{s}</div>
              </div>
            </FadeUp>
          );
        })}
      </div>
      <FadeUp delay={100} style={{ marginTop: footTop, fontSize: 44, color: C.gray, lineHeight: 1.5 }}>
        진행 중인 공고는 프로필 링크에서
        <div style={{ color: C.green, fontWeight: 900 }}>@bigmovesolution</div>
      </FadeUp>
    </Page>
  );
};

// ── 효과음 (make_sfx.py로 합성, 저작권 없음) ──
// [프레임, 파일, 볼륨] 장면 시작: 질문 0 / 생동성 90 / 임상1상 330 / 정리 570 / 순서 780
const SFX: [number, string, number][] = [
  [8, 'pop', 0.5],
  [86, 'whoosh', 0.45],
  [120, 'pop', 0.5], // 캡슐 두 개
  [132, 'pop', 0.5],
  [165, 'tick-1', 0.4], // 곡선 그리기 시작
  [195, 'tick-3', 0.4],
  [326, 'whoosh', 0.45],
  [360, 'pop', 0.5], // 새 약
  [400, 'tick-1', 0.45], // 막대 5개 올라감
  [414, 'tick-2', 0.45],
  [428, 'tick-3', 0.45],
  [442, 'tick-4', 0.45],
  [456, 'tick-5', 0.45],
  [566, 'whoosh', 0.45],
  [600, 'pop', 0.5], // 카드 두 장
  [620, 'pop', 0.5],
  [776, 'whoosh', 0.45],
  [810, 'tick-1', 0.45], // 신청 순서 5단계
  [822, 'tick-2', 0.45],
  [834, 'tick-3', 0.45],
  [846, 'tick-4', 0.45],
  [858, 'tick-5', 0.45],
  [880, 'chime', 0.45],
];

export const BeVsPhase1: React.FC = () => {
  const scenes: [number, React.ReactNode, string][] = [
    [S.intro, <Intro />, '1 질문'],
    [S.be, <BE />, '2 생동성'],
    [S.p1, <Phase1 />, '3 임상1상'],
    [S.sum, <Summary />, '4 한 줄 정리'],
    [S.end, <End />, '5 신청 순서'],
  ];
  let t = 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {scenes.map(([len, el, name]) => {
        const from = t;
        t += len;
        return (
          <Sequence key={name} from={from} durationInFrames={len} name={name}>
            {el}
          </Sequence>
        );
      })}
      {SFX.map(([from, file, volume], i) => (
        <Sequence key={`sfx-${i}`} from={from} name={`효과음 ${file}`} layout="none">
          <Html5Audio src={staticFile(`sfx/${file}.wav`)} volume={volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
