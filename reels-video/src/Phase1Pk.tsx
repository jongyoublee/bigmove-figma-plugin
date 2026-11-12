// 약이 몸속에서 움직이는 과정 → 생동성(혈중 농도 곡선) → 임상1상(약동학) → 빅무브
// 1080x1920, 30fps, 약 39초, 음악 없음. 스토리보드: 11/10 대화 (5장면)
// 사실 확인: 약은 위에서 녹고 주로 장에서 흡수된다. 화면 문구에 판단 표현("안전") 금지.
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  Sequence,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  getStaticFiles,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { C, Caption, Chip, Draw, End as Steps, FONT, FadeUp, GH, GW, Intro, Page, SAFE_TOP, SIDE, Title, curve, useIn } from './BeVsPhase1';

// 11/12 BeVsPhase1의 1번(질문)·5번(신청 순서) 장면을 앞뒤에 붙임
// 11/12 40초 이내로: 장면 안 간격을 당기고 마지막 빅무브 장면은 뺌 (신청 순서와 프로필 링크 문구 중복)
const S = { intro: 75, body: 300, be: 260, pk: 390, steps: 165 };
export const PK_TOTAL = S.intro + S.body + S.be + S.pk + S.steps; // 1190 = 39.7초 (11/12 chime 끝이 잘리지 않게 마지막 0.5초 늘림)

type P = [number, number];
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = { ...clamp, easing: Easing.inOut(Easing.cubic) };
const TUBE = '#EDE9DF';

// 꺾은선 위 t(0~1) 지점의 좌표와 방향
const pointAt = (pts: P[], t: number): { x: number; y: number; a: number } => {
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(l);
    total += l;
  }
  let d = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? d / seg[i] : 0;
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, a: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI };
    }
    d -= seg[i];
  }
  return { x: pts[0][0], y: pts[0][1], a: 0 };
};
const poly = (pts: P[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');

// 관(식도·장·혈관): 바깥 선 + 안쪽 색
const Tube: React.FC<{ pts: P[]; outer?: string; inner?: string; w?: number; t?: number; p?: number; cap?: 'round' | 'butt' }> = ({
  pts,
  outer = C.ink,
  inner = TUBE,
  w = 30,
  t = 5,
  p = 1,
  cap = 'round',
}) => (
  <g strokeLinecap={cap} strokeLinejoin="round" fill="none">
    <path d={poly(pts)} stroke={outer} strokeWidth={w + t * 2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    <path d={poly(pts)} stroke={inner} strokeWidth={w} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
  </g>
);

// 세로 연결관: 벽 두 줄만 그린다 (안쪽을 배경색으로 덮지 않아 끝에 가는 선이 비치지 않음).
// 굵기는 위·장 아이콘의 입구·출구 벽과 같게 (안쪽 폭 36, 벽 15, 렌더링 화면에서 잼)
const Pipe: React.FC<{ x: number; y0: number; y1: number; p?: number; w?: number; t?: number }> = ({ x, y0, y1, p = 1, w = 36, t = 15 }) => {
  const y = y0 + (y1 - y0) * p;
  return (
    <g stroke={C.ink} strokeWidth={t} strokeLinecap="butt">
      <line x1={x - w / 2 - t / 2} y1={y0} x2={x - w / 2 - t / 2} y2={y} />
      <line x1={x + w / 2 + t / 2} y1={y0} x2={x + w / 2 + t / 2} y2={y} />
    </g>
  );
};

// 캡슐 반쪽 (길이 64 x 높이 26)
const Half: React.FC<{ side: -1 | 1; fill: string }> = ({ side, fill }) => (
  <path
    d={side < 0 ? 'M0 -13 L-19 -13 A13 13 0 0 0 -19 13 L0 13 Z' : 'M0 -13 L19 -13 A13 13 0 0 1 19 13 L0 13 Z'}
    fill={fill}
    stroke={C.ink}
    strokeWidth={3}
  />
);

// ── 장면 1~2: 약을 삼킴 → 위에서 녹음 → 장에서 흡수 → 혈액 ──
// 11/12 사람·위·장을 모두 직접 그린 선으로 바꿈 (아이콘 확대 시 벽 굵기·연결 부분이 어긋나서).
// 사람 윤곽은 참고 그림의 선을 따지 않고 비율만 참고 (어깨 폭 ≈ 머리 폭의 3배, 짧은 목, 팔 구분선).
// 옆얼굴(오른쪽을 봄) + 정면 몸통. 두 선 모두 정수리(540,470)에서 시작해 그려진다
const BACK =
  'M540 470 C470 470 425 520 425 590 C425 650 445 700 470 725 C485 740 488 760 488 780 L488 820 ' +
  'C460 860 300 860 230 900 C175 935 160 995 160 1070 L156 1760';
const FRONT =
  'M540 470 C600 470 640 510 648 560 L668 612 L650 632 L654 660 L644 668 L654 678 ' +
  'C654 705 632 730 612 735 C600 740 594 750 592 770 L592 820 ' +
  'C620 860 780 860 850 900 C905 935 920 995 920 1070 L924 1760';
// 11/12 팔 경계선은 삭제 (사용자 결정)
const MOUTH: P = [645, 668];
const WALL = 15; // 식도·위·장 벽 굵기
const LUMEN = 36; // 식도·장 안쪽 폭

// 위 (J자 모양, 보는 사람 기준 오른쪽으로 불룩하고 아래에서 왼쪽으로 퍼짐). 닫힌 선이고, 입구·출구는 배경색 사각형으로 연다
const IN_TOP = 1030; // 위 입구(식도 끝) 높이
const OUT_Y = 1290; // 위 출구(유문) 높이
const OUT_X = 370; // 위 출구 가운데
// 바깥(큰 굽이): 입구 오른쪽 → 위로 불룩(위저부) → 오른쪽 아래 → 바닥 → 왼쪽 출구. 안쪽(작은 굽이): 출구 → 완만한 C자 → 입구 왼쪽
const STOMACH =
  `M565.5 ${IN_TOP} C580 985 680 965 735 1010 C790 1055 790 1190 745 1270 C700 1345 580 1370 480 1350 ` +
  `C420 1338 ${OUT_X + 25} 1315 ${OUT_X + 25.5} ${OUT_Y} L${OUT_X - 25.5} ${OUT_Y} ` +
  `C${OUT_X - 25.5} 1245 380 1218 430 1218 C512 1218 520 1150 516 1100 C515 1075 514.5 1055 514.5 ${IN_TOP} Z`;

// 반원·4분원을 꺾은선 점으로 (관과 알갱이 경로가 같은 선을 쓰도록)
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 24): P[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as P;
  });
// 장 (11/12 옆으로 넓게: 가운데선 x 400~690, 4줄). 위 출구에서 시작해 혈관(VY)으로 들어간다
const ROWS = [1420, 1500, 1580, 1660];
const R = 40;
const VY = 1750;
const GUT_OUT_X = 490;
const GUT: P[] = [
  [OUT_X, OUT_Y],
  [OUT_X, ROWS[0] - R],
  ...arc(OUT_X + R, ROWS[0] - R, R, 180, 90),
  [690, ROWS[0]],
  ...arc(690, ROWS[0] + R, R, -90, 90),
  [400, ROWS[1]],
  ...arc(400, ROWS[1] + R, R, -90, -270),
  [690, ROWS[2]],
  ...arc(690, ROWS[2] + R, R, -90, 90),
  [GUT_OUT_X + R, ROWS[3]],
  ...arc(GUT_OUT_X + R, ROWS[3] + R, R, -90, -180),
  [GUT_OUT_X, VY],
];

const ESO: P[] = [[540, 770], [540, IN_TOP + 8]]; // 목 가운데 (입 뒤에서 시작)
const PILL: P[] = [[MOUTH[0] + 170, MOUTH[1] - 10], MOUTH, [570, 730], [540, 770], [540, 1050], [600, 1095], [655, 1165]];
const DOT_C: P = [650, 1185];
const OUT: P[] = [[640, 1265], [540, 1295], [440, 1285], [390, 1270], [OUT_X, 1290], ...GUT, [1150, VY]];
const DOTS = Array.from({ length: 14 }, (_, i) => {
  const ang = i * 2.4;
  const r = 0.4 + (i % 4) * 0.2;
  return { x: DOT_C[0] + Math.cos(ang) * r * 70, y: DOT_C[1] + Math.sin(ang) * r * 50 };
});

// 카메라 3단계: 처음(몸 전체, 1.25배) → 위 확대(위가 화면 가운데) → 아래로 이동(위~혈관 전체)
const CAM0 = { s: 1.25, fy: 960, py: 947.5 };
const CAM_A = { s: 1.8, fy: 1347, py: 1150 };
const CAM_B = { s: 1.55, fy: 1550, py: 1200 };
const TEXT_BOTTOM = 470; // 제목 아래 끝(화면 y). 확대 화면에서는 이 위쪽 그림을 지운다

const BodyJourney: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [0, 40], [0, 1], ease);
  const zA = interpolate(f, [130, 170], [0, 1], ease);
  const zB = interpolate(f, [185, 225], [0, 1], ease);
  const mix = (k: 's' | 'fy' | 'py') => CAM0[k] + (CAM_A[k] - CAM0[k]) * zA + (CAM_B[k] - CAM_A[k]) * zB;
  const s = mix('s');
  const fy = mix('fy');
  const py = mix('py');
  const cam = `translate(540 ${py}) scale(${s}) translate(-540 ${-fy})`;
  // 화면 y → 몸 좌표 y (몸 그림은 translate(0 180) 안에 있음)
  const toBody = (sy: number) => (sy - py) / s + fy - 180;
  // 두 번째 제목(138프레임)이 나오기 전에 머리·목을 지운다
  const hide = interpolate(f, [126, 140], [0, 1], ease);
  const fadeTop = toBody(interpolate(hide, [0, 1], [-800, TEXT_BOTTOM]));
  const fadeEnd = toBody(interpolate(hide, [0, 1], [-700, TEXT_BOTTOM + 60]));

  const pillIn = spring({ frame: f - 40, fps: 30, config: { damping: 12 } });
  const pos = pointAt(PILL, interpolate(f, [60, 130], [0, 1], ease));
  const split = interpolate(f, [175, 200], [0, 1], clamp);
  const gutP = interpolate(f, [190, 225], [0, 1], ease);
  const vesselP = interpolate(f, [215, 235], [0, 1], ease);
  const t1 = interpolate(f, [0, 10, 120, 140], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          {/* 확대 화면에서 제목 뒤쪽(머리·목)을 부드럽게 지운다 */}
          <linearGradient id="topFade" gradientUnits="userSpaceOnUse" x1={0} y1={fadeTop} x2={0} y2={fadeEnd}>
            <stop offset="0" stopColor="#000" />
            <stop offset="1" stopColor="#fff" />
          </linearGradient>
          <mask id="belowText" maskUnits="userSpaceOnUse" x={-2000} y={-4000} width={6000} height={10000}>
            <rect x={-2000} y={-4000} width={6000} height={10000} fill="url(#topFade)" />
          </mask>
        </defs>
        <g transform={cam}>
          <g transform="translate(0 180)" fill="none" stroke={C.ink} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" mask="url(#belowText)">
            {[BACK, FRONT].map((d) => (
              // 위~혈관 전체를 보여 줄 때는 몸 윤곽을 지워 위·장만 남긴다
              <path key={d} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} opacity={1 - zB} />
            ))}
            {/* 식도: 벽 두 줄 */}
            <g stroke={C.ink} strokeWidth={WALL} strokeLinecap="butt">
              {[-1, 1].map((k) => (
                <line key={k} x1={540 + k * (LUMEN / 2 + WALL / 2)} y1={ESO[0][1]} x2={540 + k * (LUMEN / 2 + WALL / 2)} y2={ESO[0][1] + (ESO[1][1] - ESO[0][1]) * draw} />
              ))}
            </g>
            {/* 위 */}
            <path d={STOMACH} fill={C.bg} stroke={C.ink} strokeWidth={WALL} opacity={draw} />
            {/* 장 (위 출구에서 혈관까지 한 줄 관) */}
            <Tube pts={GUT} w={LUMEN} t={WALL} inner={C.bg} p={gutP} cap="butt" />
            {/* 입구·출구를 연다 (벽 사이 위 선을 배경색으로 덮음) */}
            <rect x={540 - LUMEN / 2} y={IN_TOP - 12} width={LUMEN} height={24} fill={C.bg} stroke="none" opacity={draw} />
            <rect x={OUT_X - LUMEN / 2} y={OUT_Y - 12} width={LUMEN} height={24} fill={C.bg} stroke="none" />
            {/* 혈관: 화면 양쪽 끝까지 이어지는 일자 (11/12, 왼쪽 둥근 끝 제거) */}
            <Tube pts={[[-400, VY], [1500, VY]]} outer={C.green} inner={C.lime} w={30} t={9} p={vesselP} cap="butt" />
            {/* 캡슐 */}
            {f < 200 && (
              <g transform={`translate(${pos.x} ${pos.y}) rotate(${f < 60 ? 0 : pos.a}) scale(${pillIn})`} opacity={1 - split}>
                <g transform={`translate(${-split * 30} ${-split * 12}) rotate(${-split * 25})`}>
                  <Half side={-1} fill={C.green} />
                </g>
                <g transform={`translate(${split * 30} ${split * 12}) rotate(${split * 25})`}>
                  <Half side={1} fill={C.white} />
                </g>
              </g>
            )}
            {/* 녹은 가루 → 장 → 혈액 */}
            {DOTS.map((d, i) => {
              const spread = interpolate(f, [178, 212], [0, 1], ease);
              const start = 215 + i * 2;
              const flow = interpolate(f, [start, start + 50], [0, 1], ease);
              const into = pointAt([[d.x, d.y], ...OUT], flow);
              const x = flow > 0 ? into.x : DOT_C[0] + (d.x - DOT_C[0]) * spread;
              const y = flow > 0 ? into.y : DOT_C[1] + (d.y - DOT_C[1]) * spread;
              const op = interpolate(f, [178, 186], [0, 1], clamp);
              return <circle key={i} cx={x} cy={y} r={8} fill={C.green} stroke="none" opacity={op} />;
            })}
          </g>
        </g>
      </svg>
      {/* 글자 */}
      <div style={{ position: 'absolute', top: SAFE_TOP + 40, left: SIDE, right: SIDE, opacity: t1 }}>
        <Title lines={['약을 먹으면 몸에서', '무슨 일이 생길까요?']} size={84} />
      </div>
      {/* 첫 제목이 사라지는 140프레임에 바로 이어서 나옴. 11/12 흰 카드 없이 첫 제목과 같은 자리·빈 배경 */}
      <Sequence from={138} layout="none">
        <div style={{ position: 'absolute', top: SAFE_TOP + 40, left: SIDE, right: SIDE }}>
          <Title lines={['위에서 녹고 장에서 흡수돼', '혈액으로 들어가요']} size={70} />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

// ── 장면 3: 생동성 = 혈중 약물 농도 곡선 비교 ──
const peak = (() => {
  const t = Math.log(1.6 / 0.35) / (1.6 - 0.35);
  const v = 1.6 * (Math.exp(-0.35 * t) - Math.exp(-1.6 * t));
  return { x: (t / 12) * GW, y: GH - v * GH * 0.9 };
})();

// 11/12 아래가 비어 보여 항목 간격을 넓힘 (Page gap 44 → 70)
const BeGraph: React.FC = () => {
  const f = useCurrentFrame();
  const dot = spring({ frame: f - 115, fps: 30, config: { damping: 10 } });
  const area = interpolate(f, [140, 170], [0, 0.45], clamp);
  const areaLabel = interpolate(f, [150, 170], [0, 1], clamp);
  const legend = interpolate(f, [95, 115], [0, 1], clamp);
  return (
    <Page gap={70}>
      <Chip text="생동성시험" />
      <Title lines={['이미 나온 약과', '같은지 확인']} delay={6} />
      <FadeUp delay={20}>
        <svg width={888} height={640} viewBox="-24 -60 888 640" style={{ overflow: 'visible' }}>
          <path d={`${curve(1, 0)} L${GW} ${GH} L0 ${GH} Z`} fill={C.lime} opacity={area} />
          <line x1={0} y1={GH} x2={GW} y2={GH} stroke={C.ink} strokeWidth={4} />
          <line x1={0} y1={-20} x2={0} y2={GH} stroke={C.ink} strokeWidth={4} />
          <text x={GW} y={570} textAnchor="end" fontSize={34} fill={C.gray} fontFamily={FONT}>시간</text>
          <text x={20} y={-30} fontSize={34} fill={C.gray} fontFamily={FONT}>혈액 속 약 농도</text>
          <Draw id="b1" d={curve(1, 0)} color={C.ink} start={30} />
          <Draw id="b2" d={curve(0.97, 0.15)} color={C.green} start={60} dash="2 18" width={12} />
          <g transform={`translate(${peak.x} ${peak.y}) scale(${dot})`}>
            <circle r={18} fill={C.green} stroke={C.white} strokeWidth={5} />
          </g>
          <text x={peak.x + 40} y={peak.y - 10} fontSize={36} fontWeight={700} fill={C.green} fontFamily={FONT} opacity={dot > 0.1 ? 1 : 0}>
            가장 높은 농도
          </text>
          {/* 11/12: 다음 장면 "양을 늘릴수록 곡선이 높아져요"와 같은 오른쪽 위 자리(두 줄)에 두고,
              점선 화살표로 왼쪽 아래 넓이 안쪽을 가리킨다. 범례는 그 아래(곡선 꼬리 위 빈 곳)로 내림 */}
          <g opacity={areaLabel}>
            <text x={500} y={118} fontSize={36} fontWeight={700} fill={C.ink} fontFamily={FONT}>
              <tspan x={500}>몸에 들어간</tspan>
              <tspan x={500} dy={46}>전체 양</tspan>
            </text>
            <line x1={485} y1={150} x2={285} y2={440} stroke={C.gray} strokeWidth={4} strokeDasharray="10 10" />
            <path d="M286 410 L282 444 L312 428" fill="none" stroke={C.gray} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g opacity={legend}>
            <rect x={500} y={230} width={320} height={130} rx={18} fill={C.white} stroke={C.line} strokeWidth={3} />
            <line x1={525} y1={275} x2={580} y2={275} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
            <text x={600} y={287} fontSize={32} fill={C.ink} fontFamily={FONT}>이미 나온 약</text>
            <line x1={525} y1={325} x2={580} y2={325} stroke={C.green} strokeWidth={12} strokeDasharray="2 18" strokeLinecap="round" />
            <text x={600} y={337} fontSize={32} fill={C.ink} fontFamily={FONT}>같은 성분 약</text>
          </g>
        </svg>
      </FadeUp>
      <Caption lines={['두 약의 곡선이', '같은 모양인지 비교해요']} delay={175} />
    </Page>
  );
};

// ── 장면 4: 임상1상 (11/12 그래프·아이콘 흐름을 빼고 글자로. 사용자 승인 문구) ──
// "효과"는 쓰지 않는다 (1상은 주로 혈액 속 약 농도를 봄, 이득으로 읽힐 수 있음)
const PK_A = 150; // 화면 1(정의) 길이, 이후 화면 2(종류)
const PK_TYPES: [string, string[]][] = [
  ['용량 증량', ['적은 양부터 단계적으로 늘려요']],
  ['음식 영향', ['공복과 식사 후를 비교해요']],
  ['복합제', ['2~3가지 성분을 합친 한 알과', '따로 먹을 때를 비교해요']],
  ['약물 상호작용', ['두 약을 함께 먹을 때를 비교해요']],
];

const PkScene: React.FC = () => {
  const f = useCurrentFrame();
  const aOp = interpolate(f, [PK_A - 12, PK_A], [1, 0], clamp);
  return (
    <Page>
      <Chip text="임상1상" />
      <div style={{ position: 'relative', height: 1300 }}>
        {/* 화면 1: 정의 */}
        <div style={{ position: 'absolute', inset: 0, paddingTop: 60, opacity: aOp }}>
          {/* 11/12 제목 위치는 다른 화면과 같게, 아래에 짧은 추가 설명 카드 */}
          <Title lines={['약이 몸에서', '어떻게 달라지는지 확인']} delay={6} size={80} />
          <div style={{ height: 70 }} />
          <Caption lines={['먹는 양, 음식, 함께 먹는 약에 따라', '혈액 속 약 농도가 어떻게', '달라지는지 살펴요']} delay={30} />
          <FadeUp
            delay={60}
            style={{
              marginTop: 90,
              padding: '30px 36px',
              borderRadius: 28,
              background: C.white,
              border: `3px solid ${C.line}`,
              borderLeft: `12px solid ${C.green}`,
              fontSize: 42,
              lineHeight: 1.5,
              color: C.ink,
            }}
          >
            정해진 시간마다 채혈해서
            <br />약 농도를 재요
          </FadeUp>
        </div>
        {/* 화면 2: 종류 */}
        <Sequence from={PK_A} layout="none">
          <div style={{ position: 'absolute', inset: 0, paddingTop: 60 }}>
            <Title lines={['이런 시험들이 있어요']} delay={2} size={80} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 58, marginTop: 80 }}>
              {PK_TYPES.map(([name, desc], i) => (
                <FadeUp key={name} delay={20 + i * 25}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28 }}>
                    <span
                      style={{
                        flexShrink: 0,
                        width: 270,
                        textAlign: 'center',
                        padding: '8px 0',
                        borderRadius: 999,
                        border: `3px solid ${C.green}`,
                        color: C.green,
                        background: C.white,
                        fontSize: 34,
                        fontWeight: 900,
                      }}
                    >
                      {name}
                    </span>
                    <div style={{ fontSize: 38, lineHeight: 1.45, color: C.ink, paddingTop: 6 }}>
                      {desc.map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
            <FadeUp delay={140} style={{ marginTop: 100, fontSize: 40, lineHeight: 1.5, color: C.gray }}>
              <div>이 밖에도 여러 종류가 있어요</div>
              <div>궁금한 점은 카카오톡 상담으로 물어보세요</div>
            </FadeUp>
          </div>
        </Sequence>
      </div>
    </Page>
  );
};

// ── 장면 5: 빅무브 ──
// 11/12 40초 이내로 줄이며 장면 목록에서 뺌 (다시 쓰려면 장면 목록과 S에 end: 180 추가)
const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: f - 30, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, alignItems: 'center', justifyContent: 'center', paddingBottom: 200 }}>
      <FadeUp delay={4} style={{ fontSize: 84, fontWeight: 900, color: C.ink, letterSpacing: -2 }}>
        더 자세히 알고 싶다면?
      </FadeUp>
      <div style={{ fontSize: 220, fontWeight: 900, color: C.green, letterSpacing: -8, marginTop: 40, transform: `scale(${logo})` }}>
        빅무브
      </div>
      <FadeUp delay={60} style={{ fontSize: 44, color: C.gray, marginTop: 50, textAlign: 'center', lineHeight: 1.5 }}>
        진행 중인 공고는 프로필 링크에서
        <div style={{ color: C.green, fontWeight: 900, fontSize: 52 }}>@bigmovesolution</div>
      </FadeUp>
    </AbsoluteFill>
  );
};

// 효과음 [프레임, 파일, 볼륨]. 장면 시작: 몸속 0 / 생동성 330 / 임상1상 630 / 마무리 990
// 효과음: [장면, 장면 시작 기준 프레임, 파일, 볼륨] (11/12 장면 길이 변경에 맞춰 상대 시점으로 다시 씀)
const AT = {
  intro: 0,
  body: S.intro,
  be: S.intro + S.body,
  pk: S.intro + S.body + S.be,
  steps: S.intro + S.body + S.be + S.pk,
};
// 11/12 의미 있는 순간에만 8번 (전에는 27번이라 같은 소리가 겹쳐 산만했음). 항목마다 울리던 tick은 뺌
// swallow·dissolve는 cut_sfx.py로 잘라 낸 public/sfx/cut/*.wav
const SFX_REL: [keyof typeof AT, number, string, number][] = [
  ['body', -4, 'whoosh', 0.3], // 질문 → 몸
  ['body', 72, 'swallow', 0.9], // 캡슐이 목으로 넘어갈 때
  ['body', 172, 'dissolve', 0.7], // 캡슐이 위에서 갈라지며 녹음
  ['be', -4, 'whoosh', 0.3], // → 생동성
  ['be', 115, 'pop', 0.5], // 두 곡선이 겹친 뒤 가장 높은 농도
  ['pk', -4, 'whoosh', 0.3], // → 임상1상
  ['steps', -4, 'whoosh', 0.3], // → 신청 순서
  ['steps', 85, 'chime', 0.45], // 마지막
];
const SFX_ALL: [number, string, number][] = SFX_REL.map(([sc, d, file, v]) => [AT[sc] + d, file, v]);

// 효과음 파일 선택 (11/12 Pixabay 후보). 키: pop / whoosh / tick / chime. 비우면 직접 합성한 wav를 쓴다
export type SfxPick = { pop?: string; whoosh?: string; tick?: string; chime?: string };
export const SFX_PICK: SfxPick = {
  pop: 'dragon-studio-clean-minimal-pop-467466.mp3',
  whoosh: 'dragon-studio-simple-whoosh-382724.mp3',
  tick: 'dragon-studio-spacebar-tap-376870.mp3',
  chime: 'freesound_community-ding-101492.mp3',
};
const CUT = ['swallow', 'dissolve'];
// 11/12 Pixabay 파일이 없는 PC(배포 저장소)에서도 멈추지 않게: 고른 mp3가 없으면 합성 wav, 잘라 낸 소리가 없으면 그 소리만 뺌
const sfxSrc = (name: string, pick: SfxPick): string | null => {
  const have = new Set(getStaticFiles().map((f) => f.name));
  const ok = (path: string) => (have.has(path) ? staticFile(path) : null);
  if (CUT.includes(name)) return ok(`sfx/cut/${name}.wav`);
  const key = name.startsWith('tick') ? 'tick' : (name as keyof SfxPick);
  const file = pick[key];
  return (file && ok(`sfx/${file}`)) || ok(`sfx/${name}.wav`);
};

export const Phase1Pk: React.FC<{ sfx?: SfxPick }> = ({ sfx = SFX_PICK }) => {
  const scenes: [number, React.ReactNode, string][] = [
    [S.intro, <Intro />, '0 질문'],
    [S.body, <BodyJourney />, '1-2 삼킴과 흡수'],
    [S.be, <BeGraph />, '3 생동성'],
    [S.pk, <PkScene />, '4 임상1상'],
    [S.steps, <Steps pageGap={60} listTop={50} stepGap={40} footTop={90} />, '5 신청 순서'],
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
      {SFX_ALL.map(([from, file, volume], i) => {
        const src = sfxSrc(file, sfx);
        return src ? (
          <Sequence key={`sfx-${i}`} from={from} name={`효과음 ${file}`} layout="none">
            <Html5Audio src={src} volume={volume} />
          </Sequence>
        ) : null;
      })}
    </AbsoluteFill>
  );
};

// useIn은 다른 장면 확장용으로 남겨 둔다
void useIn;
