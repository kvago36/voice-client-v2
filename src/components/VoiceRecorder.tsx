import { useState, useRef, useEffect } from "react";

import { WS_HOST } from "../constants";

import { Pointers, WasmExports, ProcessAudioFn } from "../types";

interface VoiceRecorderProps {
  onSave: (message: string) => void;
}

const SAMPLES_COUNT = 16384;

export default function VoiceRecorder({ onSave }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [message, setMessage] = useState("");
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const AudioNodeRef = useRef<AudioWorkletNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<number[]>([]);
  const memoryRef = useRef<WebAssembly.Memory>(null);
  const pointerRef = useRef<Pointers>(null);
  const processAudio = useRef<ProcessAudioFn | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_HOST);

    const memory = new WebAssembly.Memory({
      initial: 32,
      maximum: 64,
      shared: true,
    });

    const importObject = {
      env: {
        memory,
        console_log: (arg: string) => {
          console.log(arg);
        },
      },
    };

    WebAssembly.instantiateStreaming(
      fetch("native_webaudio_rust.wasm"),
      importObject
    ).then((module) => {
      const exports = module.instance.exports as unknown as WasmExports;

      const { alloc_f32, alloc_i16, process_audio_simd } = exports;

      const input_ptr_1 = alloc_f32(SAMPLES_COUNT);
      const input_ptr_2 = alloc_f32(SAMPLES_COUNT);
      const output_ptr = alloc_i16(SAMPLES_COUNT);

      processAudio.current = process_audio_simd;
      memoryRef.current = memory;
      pointerRef.current = {
        input_ptr_1,
        input_ptr_2,
        output_ptr,
      };
    });

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

  const startRecording = async () => {
    setMessage("");

    setIsReady(false);
    bufferRef.current = [];

    try {
      audioCtxRef.current = new AudioContext();
      await audioCtxRef.current.audioWorklet.addModule("processor.js");
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mediaSourceRef.current = audioCtxRef.current.createMediaStreamSource(
        mediaStreamRef.current
      );

      AudioNodeRef.current = new AudioWorkletNode(
        audioCtxRef.current,
        "mic-processor",
        {
          processorOptions: {
            main_input: pointerRef.current!.input_ptr_1,
            secondary_input: pointerRef.current!.input_ptr_2,
            buffer: memoryRef.current!.buffer,
            len: SAMPLES_COUNT,
          },
        }
      );

      AudioNodeRef.current.port.onmessage = (e) => {
        const process_audio_simd = processAudio.current!;

        process_audio_simd(
          e.data.ready
            ? pointerRef.current!.input_ptr_2
            : pointerRef.current!.input_ptr_1,
          pointerRef.current!.output_ptr,
          SAMPLES_COUNT
        );

        const copy = new Int16Array(
          memoryRef.current!.buffer,
          pointerRef.current!.output_ptr,
          SAMPLES_COUNT
        );

        bufferRef.current.push(...copy);

        wsRef.current?.send(new Int16Array(copy).buffer);
      };

      // Соединяем источник с обработчиком
      mediaSourceRef.current
        .connect(AudioNodeRef.current)
        .connect(audioCtxRef.current.destination);

      setIsRecording(true);
    } catch (error) {
      console.error("Ошибка доступа к микрофону:", error);
    }
  };

  const stopRecording = () => {
    wsRef.current?.send("end");

    // 1. Отключаем worklet
    if (AudioNodeRef.current) {
      console.info("Отключаем worklet");
      AudioNodeRef.current.disconnect();
      AudioNodeRef.current = null;
    }

    // 2. Отключаем source
    if (mediaSourceRef.current) {
      console.info("Отключаем source");
      mediaSourceRef.current.disconnect();
      mediaSourceRef.current = null;
    }

    // 3. Останавливаем медиа-поток
    if (mediaStreamRef.current) {
      console.info("Останавливаем медиа-поток");
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }

    // 4. Закрываем AudioContext
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      console.info("Закрываем AudioContext");
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    setIsReady(true);
    setIsRecording(false);

    console.log("Запись остановлена");
  };

  const testRecord = async () => {
    const int16 = bufferRef.current;
    const audioContext = new AudioContext();

    // Важно! Разрешить воспроизведение
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    // Нормализуем в Float32
    const float32Array = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32Array[i] = int16[i] / 32768;
    }

    const audioBuffer = audioContext.createBuffer(
      1,
      float32Array.length,
      44100
    );
    audioBuffer.copyToChannel(float32Array, 0);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();

    console.log("Воспроизводим:", int16.length, "сэмплов");
  };

  return (
    <>
      <button
        disabled={!isConnected}
        className={`my-4 py-2 text-white rounded cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed ${
          isRecording ? "bg-red-500" : "bg-green-500"
        } ${isRecording ? "px-6" : "pl-2 pr-6"}`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? "Остановить" : "🎙 Начать запись"}
      </button>

      <button
        disabled={!isReady}
        className={`my-4 ml-2 pl-2 pr-6 py-2 text-white rounded bg-purple-400 disabled:bg-gray-400 disabled:cursor-not-allowed`}
        onClick={testRecord}
      >
        🔊 Воспроизвести
      </button>

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
