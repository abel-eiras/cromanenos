# Xera os vídeos de exemplo dos trucos: formas sintéticas, sen persoas.
import math, subprocess, sys
from PIL import Image, ImageDraw

W, H, FPS, N = 640, 360, 30, 120
OUT = sys.argv[1]

def room(d):
    d.rectangle([0, 0, W, H], fill=(243, 217, 164))
    d.rectangle([0, 250, W, H], fill=(181, 131, 90))
    d.rectangle([0, 244, W, 252], fill=(140, 96, 62))
    # fiestra
    d.rectangle([270, 50, 370, 150], fill=(255, 255, 255))
    d.rectangle([278, 58, 362, 142], fill=(150, 205, 240))
    d.line([320, 58, 320, 142], fill=(255, 255, 255), width=6)
    d.line([278, 100, 362, 100], fill=(255, 255, 255), width=6)
    # cadro e alfombra
    d.rectangle([40, 40, 110, 95], fill=(120, 80, 50))
    d.rectangle([47, 47, 103, 88], fill=(240, 120, 90))
    d.ellipse([230, 285, 410, 335], fill=(200, 70, 70))

def landscape(d):
    for y in range(H):
        t = y / H
        d.line([0, y, W, y], fill=(int(120 + 80 * t), int(190 + 40 * t), 255))
    d.ellipse([500, 30, 570, 100], fill=(255, 220, 60))
    d.ellipse([-120, 200, 300, 520], fill=(90, 170, 80))
    d.ellipse([200, 230, 760, 560], fill=(70, 150, 70))
    for x, y in [(90, 232), (130, 240), (430, 258), (470, 250), (520, 262)]:
        d.rectangle([x, y, x + 22, y + 18], fill=(250, 240, 225))
        d.polygon([(x - 4, y), (x + 11, y - 13), (x + 26, y)], fill=(200, 70, 60))
    for x, y in [(250, 262), (350, 276), (60, 262)]:
        d.rectangle([x + 5, y, x + 9, y + 14], fill=(110, 75, 45))
        d.ellipse([x - 4, y - 16, x + 18, y + 4], fill=(40, 120, 50))

def monster(d, cx, cy, i, s=1.0):
    bob = math.sin(i / FPS * 2 * math.pi * 1.2) * 8 * s
    cy += bob
    r = 55 * s
    d.ellipse([cx - r * 0.75, cy + r * 0.85, cx - r * 0.15, cy + r * 1.15], fill=(90, 50, 170))
    d.ellipse([cx + r * 0.15, cy + r * 0.85, cx + r * 0.75, cy + r * 1.15], fill=(90, 50, 170))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(123, 75, 214))
    wave = math.sin(i / FPS * 2 * math.pi * 2) * 14 * s
    d.line([cx + r * 0.8, cy, cx + r * 1.5, cy - r * 0.6 + wave], fill=(123, 75, 214), width=int(14 * s))
    d.line([cx - r * 0.8, cy, cx - r * 1.4, cy + r * 0.4], fill=(123, 75, 214), width=int(14 * s))
    for ex in (-0.38, 0.38):
        d.ellipse([cx + (ex - 0.24) * r, cy - 0.5 * r, cx + (ex + 0.24) * r, cy - 0.02 * r], fill=(255, 255, 255))
        look = math.sin(i / FPS * 2 * math.pi * 0.5) * 0.08 * r
        d.ellipse([cx + (ex - 0.1) * r + look, cy - 0.36 * r, cx + (ex + 0.1) * r + look, cy - 0.16 * r], fill=(20, 20, 30))
    d.arc([cx - 0.4 * r, cy + 0.05 * r, cx + 0.4 * r, cy + 0.55 * r], 20, 160, fill=(40, 20, 80), width=int(5 * s))

def sock(d, i):
    t = i / FPS
    x = 320 + math.sin(t * 2 * math.pi * 0.5) * 130
    y = 190 + math.cos(t * 2 * math.pi * 1.0) * 35
    d.rounded_rectangle([x - 26, y, x + 26, H + 30], radius=24, fill=(32, 192, 48))
    d.ellipse([x - 34, y - 14, x + 34, y + 46], fill=(32, 192, 48))
    d.ellipse([x - 30, y - 66, x + 30, y - 6], fill=(255, 205, 40))
    d.ellipse([x - 16, y - 54, x - 2, y - 40], fill=(255, 240, 170))

def video(name, paint):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                          '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24',
                          '-pix_fmt', 'yuv420p', '-g', '15', '-movflags', '+faststart', f'{OUT}/{name}'],
                         stdin=subprocess.PIPE)
    for i in range(N):
        im = Image.new('RGB', (W, H))
        paint(ImageDraw.Draw(im), i)
        p.stdin.write(im.tobytes())
    p.stdin.close()
    p.wait()

def green(d):
    d.rectangle([0, 0, W, H], fill=(32, 192, 48))

video('ex-sitio.mp4', lambda d, i: room(d))
video('ex-monstro-esquerda.mp4', lambda d, i: (room(d), monster(d, 160, 215, i)))
video('ex-monstro-dereita.mp4', lambda d, i: (room(d), monster(d, 480, 215, i + 20)))
video('ex-calcetin.mp4', lambda d, i: (room(d), sock(d, i)))
video('ex-verde.mp4', lambda d, i: (green(d), monster(d, 320 + math.sin(i / FPS * 2 * math.pi * 0.25) * 60, 185, i, 1.5)))
im = Image.new('RGB', (W, H))
landscape(ImageDraw.Draw(im))
im.save(f'{OUT}/ex-paisaxe.png', optimize=True)
