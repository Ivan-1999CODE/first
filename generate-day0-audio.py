"""Generate only the authored Japanese lesson text; never student answers."""
import asyncio
import hashlib
import json
import pathlib
import sys
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / 'assets' / 'day0-audio'

async def main():
    texts = json.loads((OUT / 'texts.json').read_text(encoding='utf-8'))
    semaphore = asyncio.Semaphore(3)
    async def generate(text):
        name = hashlib.sha256(text.encode()).hexdigest()[:20] + '.mp3'
        target = OUT / name
        async with semaphore:
            if not target.exists() or target.stat().st_size < 1000:
                await edge_tts.Communicate(text, 'ja-JP-NanamiNeural', rate='-10%').save(str(target))
        return text, name
    result = dict(await asyncio.gather(*(generate(text) for text in texts)))
    (OUT / 'manifest.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Generated {len(result)} Japanese clips.')

if __name__ == '__main__':
    asyncio.run(main())
