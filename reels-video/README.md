# 빅무브 설명 릴스 (Remotion)

코드로 만드는 모션그래픽 릴스. 1080×1920, 30fps, mp4. 음악 없음.
Remotion은 개인과 직원 3명 이하 회사는 무료다 (그 이상은 회사 라이선스 필요: https://www.remotion.dev/license).

| ID | 파일 | 내용 |
|---|---|---|
| Phase1Pk | `src/Phase1Pk.tsx` | 약을 삼킴 → 위·장·혈액 → 생동성 곡선 → 임상1상 → 신청 순서 (39.7초) |
| BeVsPhase1 | `src/BeVsPhase1.tsx` | 생동성 vs 임상1상 (31초) |
| SfxTest | `src/SfxTest.tsx` | 효과음 후보 듣기용 (영상 아님, 후보 mp3가 있어야 소리 남) |

- 준비: `npm install` (Node.js 필요). 글꼴 Noto Sans KR 설치.
- 미리보기: `bash open_studio.sh <ID>` 또는 `npm run studio` → http://localhost:3000
- 정지 화면: `npx remotion still src/index.ts <ID> 파일.png --frame=N`
- mp4: `npx remotion render <ID> out/<ID>.mp4` (효과음 파일이 없으면 `--muted`)
- 스토리보드: `storyboard/<ID>.json` + `storyboard/<ID>/*.png` → `python ../figma-carousel/make_preset.py --storyboard`
- 아이콘 `public/icons/`: Health Icons (healthicons.org, CC0 1.0)
- 효과음: `public/sfx/*.wav`는 `make_sfx.py`로 합성한 것(저작권 없음). Pixabay mp3는 재배포 금지라 없음 → 저장소 맨 위 README "효과음". `cut_sfx.py`가 받은 mp3에서 필요한 부분을 잘라 `public/sfx/cut/`에 만든다.
