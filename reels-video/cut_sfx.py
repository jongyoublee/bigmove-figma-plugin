"""받아 온 긴 효과음에서 필요한 부분만 잘라 public/sfx/cut/ 에 wav로 저장한다 (11/12).

Remotion에 들어 있는 ffmpeg는 분석·자르기 필터가 빠져 있어서, ffmpeg로는 소리를 풀기만 하고
자르기·페이드·볼륨 측정은 이 스크립트가 한다. 외부 라이브러리 필요 없음.

  python cut_sfx.py env 파일.mp3 ...        # 0.25초 단위 소리 크기(dB) 보기
  python cut_sfx.py                          # CUTS 표대로 잘라서 저장
"""
import array
import math
import os
import subprocess
import sys
import wave

HERE = os.path.dirname(os.path.abspath(__file__))
FF = os.path.join(HERE, 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe')
SRC = os.path.join(HERE, 'public', 'sfx')
OUT = os.path.join(SRC, 'cut')
SR = 44100

# [저장 이름, 원본 파일, 시작(초), 길이(초), 페이드 인(초), 페이드 아웃(초)]
# 잘라 낸 뒤 가장 큰 소리가 -3 dBFS가 되도록 키운다 (원본마다 크기가 달라서). 영상 안 크기는 Phase1Pk.tsx 볼륨으로 맞춘다
CUTS = [
    ['swallow', 'freesound_community-swallowing-104582.mp3', 0.2, 0.8, 0.02, 0.2],  # 꿀꺽 한 번
    ['dissolve', 'freesound_community-aspirin-in-water-16738.mp3', 0.15, 3.05, 0.01, 1.2],  # 퐁 + 녹는 소리
]
PEAK_DB = -3


def load(name):
    """원본을 임시 wav로 푼 뒤 모노 16비트로 읽는다 (이 ffmpeg는 raw 출력·리샘플이 안 되고 wav 출력만 됨)."""
    global SR
    tmp = os.path.join(OUT, '_tmp.wav')
    os.makedirs(OUT, exist_ok=True)
    subprocess.run([FF, '-v', 'error', '-y', '-i', os.path.join(SRC, name), tmp], check=True)
    with wave.open(tmp, 'rb') as w:
        ch, sw, SR = w.getnchannels(), w.getsampwidth(), w.getframerate()
        raw = w.readframes(w.getnframes())
    os.remove(tmp)
    if sw != 2:
        raise SystemExit(f'{name}: 16비트가 아님 ({sw * 8}비트)')
    a = array.array('h')
    a.frombytes(raw)
    if ch > 1:
        a = array.array('h', (int(sum(a[i:i + ch]) / ch) for i in range(0, len(a), ch)))
    return a


def db(seg):
    r = math.sqrt(sum(x * x for x in seg) / max(len(seg), 1)) or 1e-9
    return round(20 * math.log10(r / 32768))


def env(names):
    for name in names:
        a = load(name)
        step = SR // 4
        vals = [db(a[i:i + step]) for i in range(0, len(a), step)]
        print(f'{name} ({len(a) / SR:.1f}s, 0.25초 단위 dB)')
        for i in range(0, len(vals), 20):
            print(f'  {i / 4:5.1f}s: ' + ' '.join(f'{v:4d}' for v in vals[i:i + 20]))


def cut():
    os.makedirs(OUT, exist_ok=True)
    for out, src, start, length, fin, fout in CUTS:
        a = load(src)
        s, n = int(start * SR), int(length * SR)
        seg = a[s:s + n]
        fi, fo = int(fin * SR), int(fout * SR)
        peak = max(abs(x) for x in seg) or 1
        gain = 32767 * 10 ** (PEAK_DB / 20) / peak
        res = array.array('h')
        for i, x in enumerate(seg):
            g = 1.0
            if i < fi:
                g = i / fi
            if i > len(seg) - fo:
                g = min(g, (len(seg) - i) / fo)
            res.append(max(-32768, min(32767, int(x * g * gain))))
        path = os.path.join(OUT, out + '.wav')
        with wave.open(path, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(res.tobytes())
        print(f'{out}.wav  <- {src} {start}~{start + length:.2f}s  (x{gain:.1f}, {db(res)} dB)')


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'env':
        env(sys.argv[2:])
    else:
        cut()
