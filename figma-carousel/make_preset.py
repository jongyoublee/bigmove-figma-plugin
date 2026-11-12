"""Claude가 만든 카드뉴스 CSV·캡션·이미지를 플러그인 ui.html에 미리 넣는다.

사용자는 Figma에서 플러그인을 열고 "준비된 게시물 만들기"만 누르면 된다 (붙여 넣기·이미지 고르기 없음).
Figma MCP를 쓰지 않으므로 무료 플랜 한도와 상관없다. 기존 붙여 넣기 방식도 그대로 쓸 수 있다.

예)
  python make_preset.py --post 03 --csv "../../docs/7-인스타그램/게시물-03/붙여넣기.txt" \
      --images "../../docs/7-인스타그램/게시물-03/0*.png"
  python make_preset.py --clear          # 준비된 게시물 지우기
  python make_preset.py --storyboard     # 릴스 스토리보드 전부 ('릴스 스토리보드' 페이지 한 곳, 같은 제목은 바꿈)
  python make_preset.py --sync           # push 뒤: 이 PC의 Figma가 읽는 폴더를 main 최신으로 (어느 PC든 같은 명령)

스토리보드 JSON: {"title": ..., "note": ..., "scenes": [{"name": ..., "note": ..., "image": "JSON 기준 상대 경로"}]}

--csv 파일: 플러그인 CSV 칸에 붙여 넣던 내용 그대로. "[캡션]" 줄 아래는 캡션으로 쓴다.
--images: image=1인 장에 파일 이름 순서대로(숫자 순) 들어간다. 여러 개·와일드카드 가능.
"""
import argparse
import base64
import csv
import datetime
import glob
import io
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
UI = os.path.join(HERE, 'ui.html')
START, END = '<!--PRESET START-->', '<!--PRESET END-->'
IMG_EXT = ('.png', '.jpg', '.jpeg', '.gif')


def natural_key(path):
    name = os.path.basename(path)
    return [int(t) if t.isdigit() else t for t in re.split(r'(\d+)', name)]


def split_caption(text):
    """ui.html과 같은 규칙: [캡션] 줄 아래는 캡션, 맨 앞 '[... CSV]' 줄은 버린다."""
    text = text.lstrip('﻿')
    m = re.search(r'^\s*\[캡션\]\s*$', text, re.M)
    caption = ''
    if m:
        caption = text[m.end():].strip()
        text = text[:m.start()]
    text = re.sub(r'^\s*\[[^\]\n]*CSV\]\s*\n', '', text.strip())
    return text.strip(), caption


def write_block(block):
    with open(UI, encoding='utf-8') as f:
        html = f.read()
    s, e = html.find(START), html.find(END)
    if s < 0 or e < 0:
        sys.exit('ui.html에 PRESET 표시가 없습니다.')
    html = html[:s + len(START)] + block + html[e:]
    with open(UI, 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)


def figma_folder():
    """이 PC의 Figma에 등록된 플러그인 폴더 (APPDATA/Figma/settings.json의 manifestPath). 없으면 None."""
    try:
        with open(os.path.join(os.environ.get('APPDATA', ''), 'Figma', 'settings.json'), encoding='utf-8') as f:
            exts = json.load(f).get('localFileExtensions', [])
    except (OSError, ValueError):
        return None
    for e in exts:
        mp = e.get('manifestPath', '')
        if e.get('lastKnownPluginId') == 'bigmove-carousel-local' or mp.replace(chr(92), '/').endswith('figma-carousel/manifest.json'):
            return os.path.dirname(mp)
    return None


def sync():
    """Figma가 읽는 폴더가 이 폴더와 다르면(작업 폴더가 따로 있는 경우) 그 폴더를 main 최신으로 받는다."""
    reg = figma_folder()
    if not reg:
        print('이 PC의 Figma에 플러그인이 등록돼 있지 않음 → README "처음 한 번 등록" 참고')
        return 1
    if os.path.normcase(os.path.abspath(reg)) == os.path.normcase(HERE):
        print('Figma가 이 폴더를 읽음 → 받을 것 없음')
        return 0
    print('Figma가 읽는 폴더: ' + reg)
    r = subprocess.run(['git', '-C', reg, 'pull', '--ff-only', 'origin', 'main'])
    if r.returncode:
        print('받기 실패 → 그 폴더에 고친 파일이 남아 있는지 확인 (git -C "%s" status)' % reg)
    return r.returncode


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--post', help='게시물 번호 (예: 03)')
    ap.add_argument('--csv', help='CSV(+[캡션]) 파일')
    ap.add_argument('--caption', help='캡션 파일 (CSV 파일 안 [캡션] 대신 쓸 때)')
    ap.add_argument('--images', nargs='*', default=[], help='이미지 파일 또는 와일드카드')
    ap.add_argument('--story', action='store_true', help='스토리 크기(1080x1920)')
    ap.add_argument('--no-bumin', action='store_true', help='부민 스타일 끄기 (기본은 켬)')
    ap.add_argument('--clear', action='store_true', help='준비된 게시물 지우기')
    ap.add_argument('--sync', action='store_true', help='push 뒤: Figma가 읽는 폴더를 main 최신으로 받기')
    ap.add_argument('--storyboard', nargs='*', help='릴스 스토리보드 JSON. 파일을 안 적으면 reels-video/storyboard/*.json 전부 (모두 "릴스 스토리보드" 페이지 한 곳에)')
    a = ap.parse_args()
    if a.sync:
        sys.exit(sync())

    if a.storyboard is not None:
        sb_dir = os.path.join(HERE, '..', 'reels-video', 'storyboard')
        files = a.storyboard or sorted(glob.glob(os.path.join(sb_dir, '*.json')))
        boards = []
        for fp in files:
            with open(fp, encoding='utf-8-sig') as f:
                sb = json.load(f)
            base = os.path.dirname(os.path.abspath(fp))
            scenes = []
            for sc in sb['scenes']:
                path = os.path.join(base, sc['image'])
                with open(path, 'rb') as f:
                    scenes.append({'name': sc['name'], 'note': sc.get('note', ''),
                                   'image': {'name': os.path.basename(path), 'b64': base64.b64encode(f.read()).decode()}})
            boards.append({'id': os.path.splitext(os.path.basename(fp))[0], 'title': sb['title'],
                           'note': sb.get('note', ''), 'scenes': scenes})
        preset = {'kind': 'storyboard', 'boards': boards, 'made': datetime.datetime.now().strftime('%m/%d %H:%M')}
        write_block('<script>window.PRESET = ' + json.dumps(preset, ensure_ascii=False).replace('</', '<\\/') + ';</script>')
        print('준비 완료: 스토리보드 %d개 (%s)' % (len(boards), ', '.join(b['id'] for b in boards)))
        print('Figma에서 플러그인을 다시 열고(Ctrl+Alt+P) "스토리보드 만들기"를 누르세요.')
        return

    if a.clear:
        write_block('')
        print('준비된 게시물을 지웠습니다.')
        return
    if not a.post or not a.csv:
        ap.error('--post와 --csv가 필요합니다 (지우려면 --clear).')

    with open(a.csv, encoding='utf-8-sig') as f:
        csv_text, caption = split_caption(f.read())
    if a.caption:
        with open(a.caption, encoding='utf-8-sig') as f:
            caption = f.read().strip()

    rows = list(csv.DictReader(io.StringIO(csv_text)))
    if not rows or 'title' not in rows[0]:
        sys.exit('CSV 머리글(page,label,topic,title,sub,action,type,image)을 확인해 주세요.')
    slots = sum(1 for r in rows if (r.get('image') or '').strip() == '1')

    paths = []
    for pat in a.images:
        hit = glob.glob(pat) or ([pat] if os.path.exists(pat) else [])
        if not hit:
            sys.exit('이미지를 찾지 못했습니다: ' + pat)
        paths += [p for p in hit if p.lower().endswith(IMG_EXT)]
    paths = sorted(set(paths), key=natural_key)
    images = []
    for p in paths:
        with open(p, 'rb') as f:
            images.append({'name': os.path.basename(p), 'b64': base64.b64encode(f.read()).decode()})

    preset = {
        'post': a.post, 'csv': csv_text, 'caption': caption, 'slides': len(rows),
        'story': a.story, 'bumin': not a.no_bumin, 'images': images,
        'made': datetime.datetime.now().strftime('%m/%d %H:%M'),
    }
    # </script> 조기 종료 방지
    payload = json.dumps(preset, ensure_ascii=False).replace('</', '<\\/')
    write_block('<script>window.PRESET = ' + payload + ';</script>')

    print('준비 완료: #%s %d장, 캡션 %d자, 이미지 %d개 (이미지 칸 %d개)' % (a.post, len(rows), len(caption), len(images), slots))
    for i, im in enumerate(images):
        print('  %d. %s' % (i + 1, im['name']))
    if images and len(images) != slots:
        print('주의: 이미지 수(%d)와 image=1인 장 수(%d)가 다릅니다.' % (len(images), slots))
    print('Figma에서 플러그인을 다시 열고(Ctrl+Alt+P) "준비된 게시물 만들기"를 누르세요.')


if __name__ == '__main__':
    main()
