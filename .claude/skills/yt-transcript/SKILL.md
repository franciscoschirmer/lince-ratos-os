---
name: yt-transcript
description: "Extract transcripts from YouTube videos using yt-dlp. Triggers: YouTube URL with request for transcript, subtitles, captions, or 'transcrever', 'transcrição', 'legendas'."
allowed-tools: Bash,Read,Write
---

# YouTube Transcript (yt-dlp)

Fast transcript extraction from YouTube videos using yt-dlp. Uses VTT format directly (no ffmpeg needed).

## Step-by-step Workflow

1. **Extract video ID** from the URL (the 11-char ID after `v=` or after `youtu.be/`)

2. **Run yt-dlp** to fetch subtitles only (no video download):
   ```bash
   yt-dlp --write-auto-sub --write-sub --sub-lang "en,pt" --skip-download -o "/tmp/yt-%(id)s" "VIDEO_URL" 2>&1
   ```
   - `--write-sub` tries manual subs first (higher quality)
   - `--write-auto-sub` falls back to auto-generated
   - `--sub-lang "en,pt"` tries English first, then Portuguese
   - Do NOT use `--convert-subs srt` (requires ffmpeg). VTT works fine.

3. **Find the downloaded VTT file**:
   ```bash
   ls /tmp/yt-VIDEO_ID*.vtt
   ```

4. **Convert VTT to clean plain text** — strip headers, timestamps, position tags, inline tags, and deduplicate repeated lines:
   ```bash
   sed -E '/^WEBVTT/d; /^Kind:/d; /^Language:/d; /^[0-9]{2}:[0-9]{2}:[0-9]{2}/d; /align:/d; s/<[^>]*>//g; /^[[:space:]]*$/d' /tmp/yt-VIDEO_ID*.vtt | awk '!seen[$0]++' > /tmp/yt-VIDEO_ID-clean.txt
   ```

5. **Save the clean transcript** to the output file and **clean up** temp files:
   ```bash
   cp /tmp/yt-VIDEO_ID-clean.txt ./VIDEO_ID-transcript.txt
   rm /tmp/yt-VIDEO_ID*.vtt /tmp/yt-VIDEO_ID-clean.txt
   ```

## Output Rules

- CRITICAL: NEVER modify the transcript content (words, meaning)
- Clean up formatting: arrange into coherent paragraphs, fix line breaks that cut mid-sentence
- Default output filename: `{VIDEO_ID}-transcript.txt` in current working directory
- If user specifies a path, use that instead

## With Timestamps

If the user wants timestamps, skip the dedup/clean step. Instead parse the VTT and format as:
```
[MM:SS] text here
```

## Troubleshooting

- If a language gives HTTP 429, try another language (e.g. just `en` or just `pt`)
- If no subtitles found, the video may not have captions enabled
- If yt-dlp is not installed: `brew install yt-dlp`
- For age-restricted or region-locked videos, try adding `--cookies-from-browser chrome`
