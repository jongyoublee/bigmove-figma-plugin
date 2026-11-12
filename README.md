# 빅무브 카드뉴스·릴스 도구

빅무브 인스타그램 카드뉴스(Figma 플러그인)와 설명 릴스(Remotion 영상), 릴스 스토리보드를 만드는 도구.
**Claude Code로 쓰는 것을 전제로 한다.** 이 폴더를 Claude Code로 열면 `CLAUDE.md`를 읽고 아래 준비를 대신 해 준다.

> 배포용 저장소다. 원본은 빅무브 작업 저장소에 있고 바뀌면 여기에 다시 올린다. 여기서 고친 내용은 다음 배포 때 덮어써진다. 고칠 점은 빅무브 담당자에게 알린다.

| 폴더 | 내용 |
|---|---|
| `figma-carousel/` | Figma 플러그인 (카드뉴스 만들기, 릴스 스토리보드 넣기). 자세한 사용법은 그 폴더 README |
| `reels-video/` | 설명 릴스 영상 코드 (Remotion). 스토리보드 정지 화면도 여기서 뽑는다 |

## 설치할 것 (Windows 기준, PC마다 한 번)
| 무엇 | 왜 | 받는 곳 |
|---|---|---|
| Figma 데스크톱 앱 | 개발 중 플러그인은 브라우저 Figma에서 실행되지 않음 | https://www.figma.com/downloads/ |
| Git | 이 저장소 받기·업데이트 | https://git-scm.com/download/win |
| Python 3 | 플러그인에 내용 미리 넣기(`make_preset.py`), 효과음 자르기 | https://www.python.org/downloads/ (설치 때 "Add python.exe to PATH" 체크) |
| Node.js LTS | 릴스 영상·스토리보드 정지 화면 만들기 | https://nodejs.org/ |
| 글꼴 NanumSquare Neo | 카드뉴스 글꼴. **`TTF` 폴더의 정적 글꼴 5개**를 설치 (`Variable`만 깔면 Figma가 못 찾음) | https://campaign.naver.com/nanumsquare_neo/ |
| 글꼴 Noto Sans KR | 지금 있는 릴스 2개의 글꼴 | https://fonts.google.com/noto/specimen/Noto+Sans+KR |

설치 뒤 Figma를 껐다 켠다. 그다음:
```
git clone https://github.com/jongyoublee/bigmove-figma-plugin.git
cd bigmove-figma-plugin/reels-video
npm install
```

## Figma 준비
1. 빅무브 담당자에게 받은 Figma 링크를 열고 파일 이름 옆 ▼ → **Duplicate to your drafts** (내 사본에서 작업, 원본은 안 바뀜).
2. Figma 데스크톱 앱에서 사본을 열고 메뉴 → Plugins → Development → **Import plugin from manifest...** → `figma-carousel/manifest.json`.
3. 실행: **Ctrl + /** → "빅무브" → Enter. 방금 쓴 플러그인은 **Ctrl + Alt + P**.

## 효과음 (영상에 소리를 넣을 때)
Pixabay 효과음은 파일을 다시 배포할 수 없어서 이 저장소에 없다. 직접 받아 `reels-video/public/sfx/`에 **같은 이름으로** 넣는다 (Pixabay에서 이름 끝 숫자로 검색, 무료·상업용 가능·출처 표기 불필요).
- 영상에 쓰는 것: `dragon-studio-clean-minimal-pop-467466.mp3`, `dragon-studio-simple-whoosh-382724.mp3`, `dragon-studio-spacebar-tap-376870.mp3`, `freesound_community-ding-101492.mp3`, `freesound_community-swallowing-104582.mp3`, `freesound_community-aspirin-in-water-16738.mp3`
- 넣은 뒤 `reels-video`에서 `python cut_sfx.py` (삼킴·녹는 소리를 잘라 `public/sfx/cut/`에 만든다)
- 파일이 없으면 Studio에서 소리만 빠지거나 렌더링이 멈춘다. 소리 없이 뽑으려면 `npx remotion render <ID> out/<ID>.mp4 --muted`

## 업데이트 받기
`git pull` → Figma 플러그인 다시 열고 **틀만 업데이트** (바뀐 카드뉴스 디자인이 내 파일에 반영됨) → 영상 코드가 바뀌었으면 `reels-video`에서 `npm install`.
