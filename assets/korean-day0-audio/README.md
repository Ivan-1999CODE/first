# 第 0 天韓文音檔

音檔只包含編寫好的教材句子、單字與數字，不包含學生作答。

- 合成聲音：Microsoft Edge TTS `ko-KR-SunHiNeural`，語速 `-10%`。
- 製作工具：`edge-tts`。執行 `generate-day0-audio.py --korean` 時需要連線。
- `texts.json`：由韓文課程資料產生的音檔文字清單。
- `manifest.json`：韓文文字與 MP3 檔名對照。
- `timings.json`：同一次合成產生的詞段時間、文字位置及音檔 SHA-256。
- 建置後音檔與時間資料都內嵌至 HTML；播放、慢速及點詞段重播不需連線。

修改韓文課文後，先用 `node --preserve-symlinks --preserve-symlinks-main build-korean-day0.cjs --prepare-audio` 更新清單，再合成、建置並執行 `check-korean-day0.cjs`。時間資料是服務提供的詞段邊界，不是每個韓文字母的音素時間。
