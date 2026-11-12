"""효과음 합성 (저작권 없음). 실행: python make_sfx.py → public/sfx/*.wav

whoosh  장면 전환 (바람 소리)
pop     요소 등장 (톡)
tick-N  막대·순서 등장 (마림바 느낌, N이 클수록 높은 음)
chime   마무리 (두 음)
"""
import os
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "sfx")


def save(name, x, gain=0.8):
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    # 끝부분 클릭 방지
    fade = int(SR * 0.005)
    x[-fade:] *= np.linspace(1, 0, fade)
    data = (x * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def t(sec):
    return np.arange(int(SR * sec)) / SR


def whoosh():
    n = t(0.45)
    rng = np.random.default_rng(1)
    noise = rng.standard_normal(len(n))
    # 차단 주파수가 올라갔다 내려가는 저역 통과 필터
    cutoff = 300 + 2600 * np.sin(np.pi * n / n[-1]) ** 2
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(noise)
    prev = 0.0
    for i in range(len(noise)):
        prev = (1 - a[i]) * noise[i] + a[i] * prev
        y[i] = prev
    env = np.sin(np.pi * n / n[-1]) ** 1.5
    return y * env


def pop():
    n = t(0.12)
    freq = 900 * np.exp(-n * 25) + 380
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return np.sin(phase) * np.exp(-n * 38)


def marimba(f, dur=0.35):
    n = t(dur)
    return (
        np.sin(2 * np.pi * f * n) * np.exp(-n * 14)
        + 0.35 * np.sin(2 * np.pi * f * 4 * n) * np.exp(-n * 45)
        + 0.1 * np.sin(2 * np.pi * f * 10 * n) * np.exp(-n * 90)
    )


def chime():
    a = marimba(1046.5, 0.9)  # C6
    b = marimba(1568.0, 0.9)  # G6
    out = np.zeros(int(SR * 1.1))
    out[: len(a)] += a
    off = int(SR * 0.12)
    out[off : off + len(b)] += b
    return out


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    save("whoosh", whoosh(), 0.5)
    save("pop", pop(), 0.7)
    # 도 레 미 솔 라 (오음음계라 이어 들어도 어색하지 않음)
    for i, f in enumerate([523.3, 587.3, 659.3, 784.0, 880.0]):
        save(f"tick-{i + 1}", marimba(f), 0.6)
    save("chime", chime(), 0.6)
    print("saved to", OUT)
