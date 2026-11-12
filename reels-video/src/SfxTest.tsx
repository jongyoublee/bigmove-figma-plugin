// 효과음 후보 듣기 (11/12). Studio에서 재생하면 역할별 후보가 1.5초 간격으로 차례로 나온다.
// 영상에는 쓰지 않는 확인용 화면이다.
import React from 'react';
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT } from './BeVsPhase1';

export const SFX_CANDIDATES: [string, string[]][] = [
  ['pop (등장·갈라짐)', [
    'dragon-studio-clean-minimal-pop-467466.mp3',
    'dragon-studio-pop-402323.mp3',
    'freesound_community-pop-39222.mp3',
    'freesound_community-pop-91931.mp3',
    'universfield-bubble-pop-05-323639.mp3',
  ]],
  ['whoosh (장면 전환)', ['dragon-studio-simple-whoosh-382724.mp3']],
  ['tick (항목 하나씩)', [
    'audley_fergine-ui-mouse-click-366460.mp3',
    'dragon-studio-spacebar-tap-376870.mp3',
    'soundreality-pen-click-2-411631.mp3',
  ]],
  ['chime (마지막)', [
    'freesound_community-ding-101492.mp3',
    'freesound_community-microwave-ding-104123.mp3',
    'saboteurcomics-airplane-chime-466924.mp3',
  ]],
];
const GAP = 45; // 1.5초
const LIST = SFX_CANDIDATES.flatMap(([role, files]) => files.map((file, i) => ({ role, file, no: i + 1 })));
export const SFX_TEST_TOTAL = LIST.length * GAP + 30;

export const SfxTest: React.FC = () => {
  const f = useCurrentFrame();
  const cur = Math.min(Math.floor(f / GAP), LIST.length - 1);
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, padding: 96, color: C.ink }}>
      <div style={{ fontSize: 44, color: C.gray }}>효과음 후보 듣기</div>
      {LIST.map((it, i) => (
        <div
          key={it.file}
          style={{
            marginTop: i === 0 || LIST[i - 1].role !== it.role ? 36 : 6,
            fontSize: 34,
            fontWeight: i === cur ? 900 : 400,
            color: i === cur ? C.green : C.ink,
          }}
        >
          {i === 0 || LIST[i - 1].role !== it.role ? <div style={{ fontSize: 40, fontWeight: 900, color: C.ink }}>{it.role}</div> : null}
          {it.no}. {it.file.replace(/\.mp3$/, '')}
        </div>
      ))}
      {LIST.map((it, i) => (
        <Sequence key={it.file} from={i * GAP} durationInFrames={GAP} layout="none">
          <Html5Audio src={staticFile(`sfx/${it.file}`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
