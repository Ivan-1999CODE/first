"""Generate only the authored Japanese lesson text; never student answers."""
import asyncio
import hashlib
import json
import pathlib
import sys
import re
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / 'assets' / 'day0-audio'

async def main():
    texts = json.loads((OUT / 'texts.json').read_text(encoding='utf-8'))
    timing_file = OUT / 'timings.json'
    timings = json.loads(timing_file.read_text(encoding='utf-8')) if timing_file.exists() else {}
    staging = ROOT / 'tmp' / 'day0-audio-sync'
    staging.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(3)
    async def generate(text):
        name = hashlib.sha256(text.encode()).hexdigest()[:20] + '.mp3'
        target = OUT / name
        async with semaphore:
            prior = timings.get(text, {})
            if target.exists() and prior.get('sha256') == hashlib.sha256(target.read_bytes()).hexdigest():
                return text, name, prior, None
            cached_audio, cached_timing = staging / name, staging / (name + '.json')
            if cached_audio.exists() and cached_timing.exists():
                cached = json.loads(cached_timing.read_text(encoding='utf-8'))
                if cached.get('sha256') == hashlib.sha256(cached_audio.read_bytes()).hexdigest():
                    return text, name, cached, cached_audio
            data, cues, cursor = bytearray(), [], 0
            async for chunk in edge_tts.Communicate(text, 'ja-JP-NanamiNeural', rate='-10%', boundary='WordBoundary').stream():
                if chunk['type'] == 'audio':
                    data.extend(chunk['data'])
                elif chunk['type'] == 'WordBoundary':
                    word = chunk['text']
                    begin = text.find(word, cursor)
                    if begin < 0 or re.search(r'[^\s。、！？,.!?]', text[cursor:begin]):
                        raise ValueError(f'Cannot align boundary: {text!r} / {word!r}')
                    cursor = begin + len(word)
                    cues.append({'text': word, 'from': begin, 'to': cursor,
                                 'start': round(chunk['offset'] / 10_000_000, 6),
                                 'end': round((chunk['offset'] + chunk['duration']) / 10_000_000, 6)})
            if not cues or len(data) < 1000 or re.search(r'[^\s。、！？,.!?]', text[cursor:]):
                raise ValueError(f'Incomplete audio or boundaries: {text!r}')
            result = {'sha256': hashlib.sha256(data).hexdigest(), 'cues': cues}
            cached_audio.write_bytes(data)
            cached_timing.write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
            print(f'Aligned {len(cues)} words: {text}', flush=True)
            return text, name, result, cached_audio
    generated = await asyncio.gather(*(generate(text) for text in texts))
    # Publish matching audio and timing only after every clip has succeeded.
    for text, name, timing, staged in generated:
        if staged is not None:
            (OUT / name).write_bytes(staged.read_bytes())
    result = {text: name for text, name, _, _ in generated}
    timing_file.write_text(json.dumps({text: timing for text, _, timing, _ in generated}, ensure_ascii=False, indent=2), encoding='utf-8')
    (OUT / 'manifest.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Generated {len(result)} Japanese clips with matching word timings.')

if __name__ == '__main__':
    asyncio.run(main())
