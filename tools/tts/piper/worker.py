"""Persistent offline JSON-lines worker. stdout is reserved for protocol replies."""
import argparse
import io
import json
from pathlib import Path
import sys
import wave
import base64
import math
import struct


def reply(value):
    print(json.dumps(value, ensure_ascii=False), flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--voice', choices=('male', 'female'), required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    model = root / 'models' / ('vi_VN-tramvang-medium/vi_VN-tramvang-medium.onnx'
                               if args.voice == 'male' else 'vi_VN-vais1000-medium.onnx')
    # No network is needed or allowed in the synthesis process.
    def audit(event, values):
        if event in {'socket.connect', 'socket.connect_ex', 'socket.getaddrinfo',
                     'socket.gethostbyname', 'socket.sendto'}:
            raise RuntimeError('Offline voice worker rejects network access')
    sys.addaudithook(audit)
    from piper import PiperVoice
    voice = PiperVoice.load(str(model), use_cuda=False)
    reply({'ready': True})
    for line in sys.stdin:
        job = {}
        try:
            job = json.loads(line)
            text = job['text']
            if not isinstance(text, str) or not 1 <= len(text) <= 250:
                raise ValueError('Invalid text length')
            missing = {p for sentence in voice.phonemize(text) for p in sentence
                       if p not in voice.config.phoneme_id_map}
            if missing:
                raise ValueError('Unsupported phonemes')
            output = io.BytesIO()
            with wave.open(output, 'wb') as wav:
                voice.synthesize_wav(text, wav)
            # Conservative edge trim: retain 40ms of breath and 60ms pause.
            # Do not crossfade words or alter the voice's sample rate/speed.
            with wave.open(io.BytesIO(output.getvalue()), 'rb') as wav:
                rate, channels, width = wav.getframerate(), wav.getnchannels(), wav.getsampwidth()
                raw = wav.readframes(wav.getnframes())
            if (rate, channels, width) != (22050, 1, 2):
                raise ValueError('Expected mono PCM16 22050Hz')
            values = list(struct.unpack(f'<{len(raw)//2}h', raw))
            voiced = [i for i, value in enumerate(values) if abs(value) > 80]
            if not voiced:
                raise ValueError('Silent synthesis')
            values = values[max(0, voiced[0]-int(rate*.04)):min(len(values), voiced[-1]+int(rate*.06)+1)]
            peak = max(abs(value) for value in values)
            rms = math.sqrt(sum(v*v for v in values)/len(values))
            gain = min(1.5, 5000/max(1, rms), 28000/max(1, peak))
            values = [int(v*gain) for v in values]
            fade = min(110, len(values)//2)
            for i in range(fade):
                values[i] = int(values[i]*i/fade)
                values[-1-i] = int(values[-1-i]*i/fade)
            result = io.BytesIO()
            with wave.open(result, 'wb') as wav:
                wav.setnchannels(1)
                wav.setsampwidth(2)
                wav.setframerate(rate)
                wav.writeframes(struct.pack(f'<{len(values)}h', *values))
            reply({'id': job['id'], 'wav': base64.b64encode(result.getvalue()).decode('ascii')})
        except Exception as error:
            reply({'id': job.get('id'), 'error': type(error).__name__})


if __name__ == '__main__':
    main()
