import { useState, useRef, useEffect } from "react";

import { WS_HOST } from "../constants";

// import { sliceAudioBuffer, convertToLinear16 } from "../utils";

import { process_audio, process_audio_simd, alloc_f32, alloc_i16 } from '../../pkg/webaudio.js'

interface VoiceRecorderProps {
  onSave: (message: string) => void;
}

export default function VoiceRecorder({ onSave }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState("");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_HOST);

    ws.onopen = () => {
      console.log("WebSocket подключен");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      console.log("Получено сообщение:", event.data);
      setMessage(event.data);
    };

    ws.onclose = () => {
      console.log("WebSocket отключен");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket ошибка:", error);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const handleSave = () => {
    onSave(message);
    setMessage("");
  };

  const test = () => {
    const samplesCount = 16384;
    const input = new SharedArrayBuffer(4 * samplesCount);
    const output = new SharedArrayBuffer(2 * samplesCount);
    const floatArray = new Float32Array(input);
    const intArray = new Int16Array(output);

    const input_ptr = alloc_f32(floatArray.byteLength);
    const output_ptr = alloc_i16(intArray.byteLength);

    // Fill with random numbers between 0 and 1
    for (let i = 0; i < floatArray.length; i++) {
      floatArray[i] = Math.random();
    }

    console.time('process_audio');
    const result1 = process_audio(input_ptr, output_ptr, samplesCount);
    console.timeEnd('process_audio');

    console.time('process_audio_simd');
    const result2 = process_audio_simd(input_ptr, output_ptr, samplesCount);
    console.timeEnd('process_audio_simd');

    console.time('js');
    for (let i = 0; i < floatArray.length; i++) {
      // Clamp value between -1.0 and 1.0
      const clamped = Math.max(-1.0, Math.min(1.0, floatArray[i]));
      // Scale to 16-bit range and convert
      intArray[i] = Math.round(clamped * 32767);
    }
    console.timeEnd('js');
  }


  const startRecording = async () => {
    setMessage("");

    try {
      // const buffer = new SharedArrayBuffer(16);

      const audioCtx = new AudioContext();

      // Загружаем worklet-файл
      await audioCtx.audioWorklet.addModule("processor.js");

      // Получаем доступ к микрофону
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioCtx.createMediaStreamSource(stream);

      const samplesCount = 16384;
      const input = new SharedArrayBuffer(4 * samplesCount);
      const output = new SharedArrayBuffer(2 * samplesCount);
      const shared_input = new Float32Array(input);
      const shared_output = new Int16Array(output);

      const input_ptr = alloc_f32(shared_input.byteLength);
      const output_ptr = alloc_i16(shared_output.byteLength);

      // Создаем ноду с нашим AudioWorkletProcessor
      const node = new AudioWorkletNode(audioCtx, "mic-processor", { processorOptions: { input, output } });
 
      // Получаем аудиоданные от worklet-а
      node.port.onmessage = (e) => {
        console.log("Audio frame:", e.data);

        if (e.data.done === true) {
          const result = process_audio(input_ptr, output_ptr, samplesCount);
          console.log("Result:", result);

          // wsRef.current?.send(linear16Data);
        }
      };

      // Соединяем источник с обработчиком
      source.connect(node).connect(audioCtx.destination);

      setIsRecording(true);
    } catch (error) {
      console.error("Ошибка доступа к микрофону:", error);
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  return (
    <>
      <button
        disabled={!isConnected}
        className={`my-4 px-6 py-2 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed ${
          isRecording ? "bg-red-500" : "bg-green-500"
        }`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? "⏹ Остановить" : "🎙 Начать запись"}
      </button>
      
      <button onClick={test}>123</button>

      <div className="flex items-center gap-4 p-3 my-3 shadow bg-white">
        <span className="text-gray-700 font-medium">Ваш запрос:</span>
        {message && (
          <>
            <span className="font-semibold">{message}</span>
            <div className="flex-row">
              {!isRecording && (
                <>
                  <div className="flex">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1 p-2 text-white rounded-lg"
                    >
                      ✅
                    </button>
                    <button
                      onClick={() => setMessage("")}
                      className="flex items-center gap-1 p-2 text-white rounded-lg"
                    >
                      ❌
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
