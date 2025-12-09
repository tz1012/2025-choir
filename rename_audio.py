#!/usr/bin/env python3
"""
rename_audio.py
Finds original audio files (Korean names) in the given folder and copies them
to normalized filenames used by the site (1:1 mapping). Optionally commits and
pushes the added files to git.

Usage:
  python rename_audio.py --source audio --gitcommit

This script is conservative: it copies files (does not delete originals) and
prints a summary. If a target file already exists it will not overwrite unless
--overwrite is passed.
"""
import argparse
import os
import shutil
import subprocess
from pathlib import Path


MAPPING = {
    # song 1
    '1. 장 라신의의 찬가(베이스).m4a': '01_bass.m4a',
    '1. 장 라신의의 찬가(소).m4a': '01_soprano.m4a',
    '1. 장 라신의의 찬가(알토).m4a': '01_alto.m4a',
    '1. 장 라신의의 찬가(테너).m4a': '01_tenor.m4a',
    # song 2
    '2. 성탄의 기적(베이스1).m4a': '02_bass1.m4a',
    '2. 성탄의 기적(베이스2).m4a': '02_bass2.m4a',
    '2. 성탄의 기적(소1).m4a': '02_soprano1.m4a',
    '2. 성탄의 기적(소2).m4a': '02_soprano2.m4a',
    '2. 성탄의 기적(알토1).m4a': '02_alto1.m4a',
    '2. 성탄의 기적(알토2).m4a': '02_alto2.m4a',
    '2. 성탄의 기적(테너).m4a': '02_tenor.m4a',
    # song 3
    '3. 하늘의 찬송(S.A.T.B).m4a': '03_full.m4a',
    # song 5
    '5. 천사 찬송하기를(베이스).m4a': '05_bass.m4a',
    '5. 천사 찬송하기를(소1).m4a': '05_soprano1.m4a',
    '5. 천사 찬송하기를(소2).m4a': '05_soprano2.m4a',
    '5. 천사 찬송하기를(알토).m4a': '05_alto.m4a',
    '5. 천사 찬송하기를(테너).m4a': '05_tenor.m4a',
    # song 6
    '6. Laudate Dominum 여호와를 찬양할지어다(베이스).m4a': '06_bass.m4a',
    '6. Laudate Dominum 여호와를 찬양할지어다(소).m4a': '06_soprano.m4a',
    '6. Laudate Dominum 여호와를 찬양할지어다(알토).m4a': '06_alto.m4a',
    '6. Laudate Dominum 여호와를 찬양할지어다(테너).m4a': '06_tenor.m4a',
    # song 7
    '7. Gloria(베이스1).m4a': '07_bass1.m4a',
    '7. Gloria(베이스2).m4a': '07_bass2.m4a',
    '7. Gloria(소1).m4a': '07_soprano1.m4a',
    '7. Gloria(소2).m4a': '07_soprano2.m4a',
    '7. Gloria(알토1).m4a': '07_alto1.m4a',
    '7. Gloria(알토2).m4a': '07_alto2.m4a',
    '7. Gloria(테너1).m4a': '07_tenor1.m4a',
    '7. Gloria(테너2).m4a': '07_tenor2.m4a',
    # song 8
    '8. 우리는 주의 영광을 보았네.m4a': '08_full.m4a',
    '8. 우리는 주의 영광을 보았네(베이스1).m4a': '08_bass1.m4a',
    '8. 우리는 주의 영광을 보았네(베이스2).m4a': '08_bass2.m4a',
    '8. 우리는 주의 영광을 보았네(소1).m4a': '08_soprano1.m4a',
    '8. 우리는 주의 영광을 보았네(소2).m4a': '08_soprano2.m4a',
    '8. 우리는 주의 영광을 보았네(알토).m4a': '08_alto.m4a',
    # song 9
    '9. 주의 기도(베이스).m4a': '09_bass.m4a',
    '9. 주의 기도(소).m4a': '09_soprano.m4a',
    '9. 주의 기도(알토).m4a': '09_alto.m4a',
    '9. 주의 기도(테너).m4a': '09_tenor.m4a',
    # song 10
    '10. I was glad(베이스1) 시편122편.m4a': '10_bass1.m4a',
    '10. I was glad(베이스2) 시편122편.m4a': '10_bass2.m4a',
    '10. I was glad(소1) 시편122편.m4a': '10_soprano1.m4a',
    '10. I was glad(소2) 시편122편.m4a': '10_soprano2.m4a',
    '10. I was glad(알토1) 시편122편.m4a': '10_alto1.m4a',
    '10. I was glad(알토2) 시편122편.m4a': '10_alto2.m4a',
    '10. I was glad(테너1) 시편122편.m4a': '10_tenor1.m4a',
    '10. I was glad(테너2) 시편122편.m4a': '10_tenor2.m4a',
}


def normalize(name: str) -> str:
    s = name.lower()
    for ch in [' ', '_', '-', '(', ')', '.', ',', '①', '②', '\u200b']:
        s = s.replace(ch, '')
    return s


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--source', default='audio')
    p.add_argument('--overwrite', action='store_true')
    p.add_argument('--gitcommit', action='store_true')
    args = p.parse_args()

    src = Path(args.source).resolve()
    if not src.exists() or not src.is_dir():
        print('Source folder not found:', src)
        return

    files = list(src.iterdir())
    name_map = {f.name: f for f in files}
    lowered = {normalize(f.name): f for f in files}

    results = []
    for orig, target in MAPPING.items():
        found = None
        # exact match
        if orig in name_map:
            found = name_map[orig]
        else:
            key = normalize(orig)
            if key in lowered:
                found = lowered[key]
            else:
                # try substring match
                for fn, path in name_map.items():
                    if normalize(fn).find(key) != -1 or key.find(normalize(fn)) != -1:
                        found = path
                        break

        target_path = src / target
        if found:
            if target_path.exists() and not args.overwrite:
                results.append((found.name, target, 'exists'))
            else:
                shutil.copy2(found, target_path)
                results.append((found.name, target, 'copied'))
        else:
            results.append((orig, target, 'missing'))

    # print summary
    print('\nSummary:')
    for r in results:
        print(f' - {r[0]} -> {r[1]} : {r[2]}')

    if args.gitcommit:
        print('\ngit add/commit/push audio/ ...')
        try:
            subprocess.check_call(['git', 'add', 'audio'])
            subprocess.check_call(['git', 'commit', '-m', 'feat: add normalized audio files'])
            subprocess.check_call(['git', 'push'])
            print('git push done')
        except subprocess.CalledProcessError as e:
            print('git error:', e)


if __name__ == '__main__':
    main()
#!/usr/bin/env python3
"""rename_audio.py
UTF-8 안전 스크립트: audio/ 폴더의 파일명을 패턴 기반으로 표준화합니다.

Usage:
  py -3 rename_audio.py

This script safely renames files in-place. It prints the planned renames and performs them.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
AUDIO = ROOT / 'audio'
if not AUDIO.exists():
    print('audio/ 폴더가 없습니다:', AUDIO)
    raise SystemExit(1)

files = list(AUDIO.iterdir())
if not files:
    print('audio/ 폴더에 파일이 없습니다.')
    raise SystemExit(0)

def detect_number(name):
    m = re.search(r"(\d{1,2})", name)
    return m.group(1) if m else None

def detect_role(name):
    n = name
    # lower-case English checks
    ln = n.lower()
    if 's.a.t.b' in ln or 'full' in ln or '전체' in n or '하늘의 찬송' in n:
        return 'full'
    # soprano variants
    if '소프라노' in n or re.search(r'\b소\b', n) or 'soprano' in ln:
        if re.search(r'소\s*1|소1|\(소1\)', n):
            return 'soprano1'
        if re.search(r'소\s*2|소2|\(소2\)', n):
            return 'soprano2'
        return 'soprano'
    if '알토' in n or 'alto' in ln:
        if '알토1' in n: return 'alto1'
        if '알토2' in n: return 'alto2'
        return 'alto'
    if '테너' in n or 'tenor' in ln:
        if '테너1' in n: return 'tenor1'
        if '테너2' in n: return 'tenor2'
        return 'tenor'
    if '베이스' in n or 'bass' in ln:
        if '베이스1' in n: return 'bass1'
        if '베이스2' in n: return 'bass2'
        return 'bass'
    if 'gloria' in ln:
        return 'gloria'
    if 'i was glad' in ln:
        return 'iwsg'
    return None

renames = []
for f in files:
    if not f.is_file():
        continue
    name = f.name
    num = detect_number(name)
    if not num:
        print('SKIP (no number):', name)
        continue
    role = detect_role(name)
    if not role:
        print('SKIP (no role):', name)
        continue
    ext = f.suffix.lower() if f.suffix else '.m4a'
    if ext not in ('.m4a', '.mp3', '.wav'):
        ext = '.m4a'
    base = f"{int(num):02d}_{role}"
    target = AUDIO / f"{base}{ext}"
    i = 1
    while target.exists():
        target = AUDIO / f"{base}_{i}{ext}"
        i += 1
    renames.append((f, target))

if not renames:
    print('변경할 파일이 없습니다.')
    raise SystemExit(0)

print('다음과 같이 파일명을 변경합니다:')
for src, dst in renames:
    print(f"  {src.name} -> {dst.name}")

confirm = input('계속하시겠습니까? (y/n) ') or 'n'
if confirm.lower().startswith('y'):
    for src, dst in renames:
        try:
            src.rename(dst)
        except Exception as e:
            print('실패:', src.name, e)
    print('이름 변경 완료.')
    gitq = input('변경을 Git에 커밋/푸시 하시겠습니까? (y/n) ') or 'n'
    if gitq.lower().startswith('y'):
        import subprocess
        subprocess.run(['C:\\Program Files\\Git\\cmd\\git.exe','add','audio'])
        subprocess.run(['C:\\Program Files\\Git\\cmd\\git.exe','commit','-m','feat: add/rename audio files'])
        subprocess.run(['C:\\Program Files\\Git\\cmd\\git.exe','push'])
else:
    print('취소됨.')
