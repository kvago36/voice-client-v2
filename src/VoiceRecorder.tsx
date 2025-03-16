import { useState, useRef, useEffect } from "react";

import { WS_HOST } from "./constants";

import { sliceAudioBuffer, convertToLinear16 } from "./utils";

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

  const startRecording = async () => {
    setMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = async (event) => {
        audioChunks.push(event.data);

        try {
          const arrayBuffer = await new Blob(audioChunks, {
            type: "audio/webm",
          }).arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          const lastSample = sliceAudioBuffer(
            audioBuffer,
            audioContext.currentTime - 0.2,
            audioContext.currentTime
          );
          const linear16Data = await convertToLinear16(lastSample, 8000, 1);

          wsRef.current?.send(linear16Data);

          // setTimeout(() => wsRef.current?.send("end"), 10);
        } catch (error: unknown) {
          console.log(error);
        }
      };

      recorder.onstop = () => {
        setTimeout(() => wsRef.current?.send("end"), 100);
      };

      recorder.start(200);
      mediaRecorder.current = recorder;
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
