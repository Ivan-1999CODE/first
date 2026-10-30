# 第 0 天韓文音檔

音檔只包含編寫好的教材句子、單字與數字，不包含學生作答。

- 合成聲音：Microsoft Edge TTS `ko-KR-SunHiNeural`，語速 `-10%`。
- 製作工具：`edge-tts`。執行 `generate-day0-audio.py --korean` 時需要連線。
- `texts.json`：由韓文課程資料產生的音檔文字清單。
- `manifest.json`：韓文文字與 MP3 檔名對照。
- `timings.json`：同一次合成產生的詞段時間、文字位置及音檔 SHA-256。
- 建置後音檔與時間資料都內嵌至 HTML；播放、慢速及點詞段重播不需連線。

修改實用章節或字音前導後，先用 `node --preserve-symlinks --preserve-symlinks-main prepare-day0-practical-audio.cjs` 更新兩語清單，再以 Python 執行 `generate-day0-audio.py --korean --deps-dir tmp/korean-audio-deps`，最後執行同一準備腳本的 `--check`。Python 加上 `-X utf8` 可避免終端的韓文編碼問題。

準備腳本保留全部既有文字及音檔，並依前導項目的 `speakText || text` 取得實際播放內容。合成腳本重用 SHA 相符的已完成音檔；所有新增音檔及時間資料成功後才更新正式清單。時間資料是服務提供的詞段邊界，不是每個韓文字母的音素時間。
