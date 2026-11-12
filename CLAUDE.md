# 빅무브 카드뉴스·릴스 도구 (Claude Code 지침)

- 답변은 한국어로 한다. 사용자는 개발자가 아닐 수 있으니 명령은 Claude가 실행하고 결과만 쉽게 알린다.
- 이 저장소는 배포용 사본이다. 코드·디자인을 고치면 다음 배포 때 덮어써지므로, 고칠 점은 사용자에게 "빅무브 담당자에게 전달"하도록 안내한다. 영상 장면·문구·스토리보드 JSON은 이 PC에서 자유롭게 만든다.

## 처음 열었을 때 준비 확인
`README.md`의 "설치할 것"을 차례로 확인한다: `git --version`, `python --version`, `node --version`, 글꼴(NanumSquare Neo 정적 5개, Noto Sans KR) 설치 여부(`C:\Windows\Fonts`, `%LOCALAPPDATA%\Microsoft\Windows\Fonts`).
- 없는 것은 받는 곳 링크와 함께 알려 준다. 사용자 동의가 있으면 `winget install`(Git.Git, Python.Python.3.12, OpenJS.NodeJS.LTS)로 설치해도 된다.
- `reels-video`에 `node_modules`가 없으면 `npm install`.
- Figma 사본·플러그인 등록은 사용자가 직접 해야 한다 (README "Figma 준비" 안내).

## 카드뉴스 만들기
1. 주제를 받아 장별 CSV와 캡션을 쓴다. 형식은 `figma-carousel/README.md` "CSV 형식", 예시는 `figma-carousel/example-0*.csv`.
2. 파일로 저장하고 플러그인에 미리 넣는다:
   `python figma-carousel/make_preset.py --post 05 --csv 경로/붙여넣기.txt [--images "경로/0*.png"]`
3. 사용자에게: Figma에서 플러그인을 다시 열고(Ctrl+Alt+P) 맨 위 초록 칸 **준비된 게시물 만들기**를 누르라고 안내.
4. 끝나면 `python figma-carousel/make_preset.py --clear` (이미지가 `ui.html`에 들어가 커지고, 그대로 두면 `git pull`이 막힘).

## 릴스 스토리보드 만들기
1. 영상 코드: `reels-video/src/<ID>.tsx`, 등록은 `src/Root.tsx`의 `<Composition id="<ID>" ...>` (1080×1920, 30fps). 기존 `Phase1Pk.tsx`·`BeVsPhase1.tsx`를 참고해 같은 색·글꼴·여백을 쓴다.
2. 장면마다 정지 화면을 뽑는다 (`reels-video`에서):
   `npx remotion still src/index.ts <ID> storyboard/<ID>/01.png --frame=<장면이 다 보이는 프레임>`
   뽑은 PNG는 Read로 열어 글자 겹침·잘림을 직접 확인한다.
3. `reels-video/storyboard/<ID>.json`을 쓴다:
   `{"title": "릴스 스토리보드: 제목 (<ID>, N초)", "note": "전체 설명", "scenes": [{"name": "1 질문", "note": "장면 설명", "image": "<ID>/01.png"}]}`
4. `python figma-carousel/make_preset.py --storyboard` (파일 생략하면 `storyboard/*.json` 전부) → 사용자가 플러그인에서 **스토리보드 만들기** → Figma `릴스 스토리보드` 페이지에 놓인다 (같은 제목은 그 자리에서 바뀜). 끝나면 `--clear`.

## 영상 미리보기·뽑기
- 보여 줄 때: `bash reels-video/open_studio.sh <ID>` (이미 Studio 탭이 열려 있으면 새 창을 열지 않고, 코드를 고치면 그 탭이 저절로 새로고침된다).
- mp4: `cd reels-video && npx remotion render <ID> out/<ID>.mp4` (효과음 파일이 없으면 `--muted`). 인스타 커버는 제목이 다 보이는 프레임을 `npx remotion still`로 뽑아 PNG로 준다 (첫 프레임은 비어 있을 수 있음).
- 릴스 길이는 40초 이내를 목표로 한다.
- 효과음 파일은 저장소에 없다. README "효과음" 참고.

## 문구 원칙
- 빅무브는 생동성·임상시험 참여자 모집 업체다. 의학적 판단·효과·안전 보장으로 읽히는 말은 쓰지 않는다.
- 개별 공고(과제명·일정·조건)는 카드뉴스·릴스에 넣지 않는다.
- 참여는 본인의 자발적 결정이다. 재촉·강요로 읽히는 표현은 쓰지 않는다.
- 그 밖의 금지어·해시태그 기준은 빅무브 담당자에게 받은 기준을 따르고, 애매하면 사용자에게 묻는다.
