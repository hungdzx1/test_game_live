"""Local file-to-WAV smoke utility. This does not connect to the game or Unity."""
import argparse
import importlib.metadata
import json
import math
from pathlib import Path
import site
import struct
import sys
import time
import wave


def main():
    root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Read a UTF-8 text file with the installed Vietnamese Piper voice.")
    parser.add_argument("--input", type=Path, default=root / "noi-dung-doc-thu.txt")
    parser.add_argument("--output", type=Path, default=root / "output" / "thien-dao-doc-thu.wav")
    parser.add_argument("--voice", choices=("male", "female"), help="Override the voice selected in voice-settings.json.")
    parser.add_argument("--verify-offline", action="store_true", help="Reject Python socket operations during synthesis.")
    args = parser.parse_args()
    selected = args.voice
    if selected is None:
        settings = json.loads((root / "voice-settings.json").read_text(encoding="utf-8-sig"))
        selected = settings.get("voice")
    models = {"male": root / "models" / "vi_VN-tramvang-medium" / "vi_VN-tramvang-medium.onnx",
              "female": root / "models" / "vi_VN-vais1000-medium.onnx"}
    if selected not in models:
        parser.error("voice-settings.json: voice must be male or female")
    model = models[selected]
    if not model.is_file() or not model.with_suffix(".onnx.json").is_file():
        parser.error(f"The selected voice is not installed: {model}")
    text = args.input.read_text(encoding="utf-8-sig").strip()
    if not text or len(text) > 2000:
        parser.error("The text file must contain between 1 and 2000 characters.")
    blocked_network_calls = []
    if args.verify_offline:
        def audit(event, values):
            if event in {"socket.connect", "socket.connect_ex", "socket.getaddrinfo", "socket.gethostbyname", "socket.sendto"}:
                blocked_network_calls.append(event)
                raise RuntimeError("Network access is disabled for this offline speech check")
        sys.addaudithook(audit)
    from piper import PiperVoice
    start = time.perf_counter()
    voice = PiperVoice.load(str(model), use_cuda=False)
    missing_phonemes = sorted({phone for sentence in voice.phonemize(text)
                               for phone in sentence if phone not in voice.config.phoneme_id_map})
    if missing_phonemes:
        raise RuntimeError(f"The voice cannot represent these phonemes: {missing_phonemes}. No speech was generated.")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(args.output), "wb") as output:
        voice.synthesize_wav(text, output)
    elapsed = time.perf_counter() - start
    with wave.open(str(args.output), "rb") as audio:
        channels, width, rate, frames = audio.getnchannels(), audio.getsampwidth(), audio.getframerate(), audio.getnframes()
        samples = audio.readframes(frames)
    if width != 2 or frames == 0:
        raise RuntimeError("Expected nonempty 16-bit PCM WAV output")
    values = struct.unpack(f"<{len(samples) // 2}h", samples)
    peak = max(abs(value) for value in values)
    rms = math.sqrt(sum(value * value for value in values) / len(values))
    if not peak or not rms:
        raise RuntimeError("Speech output is silent")
    if blocked_network_calls:
        raise RuntimeError("The offline check detected an attempted network operation")
    report = {"result": "PASS", "piper": importlib.metadata.version("piper-tts"),
              "python": sys.version.split()[0], "pythonExecutable": sys.executable,
              "isolated": bool(sys.flags.isolated), "userSiteEnabled": site.ENABLE_USER_SITE,
              "voice": model.stem, "selection": selected, "model": str(model), "provider": "CPU", "missingPhonemes": missing_phonemes,
              "input": str(args.input.resolve()), "output": str(args.output.resolve()),
              "characters": len(text), "seconds": frames / rate, "generationSeconds": elapsed,
              "sampleRate": rate, "channels": channels, "sampleWidth": width, "peak": peak, "rms": rms,
              "pythonNetworkDenied": args.verify_offline, "networkAttempts": len(blocked_network_calls),
              "listening": "CHUA KIEM CHUNG: WAV generation does not confirm listening quality",
              "unity": "NOT INTEGRATED: installation and offline file generation only"}
    args.output.with_suffix(".report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
