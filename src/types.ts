export interface Text {
  created_at: string,
  content: string,
}

export interface Pointers {
  input_ptr_1: number;
  input_ptr_2: number;
  output_ptr: number;
}

export type ProcessAudioFn = (a: number, b: number, c: number) => void;

export type WasmExports = {
  memory: WebAssembly.Memory;

  alloc_f32: (len: number) => number;
  alloc_i16: (len: number) => number;

  process_audio_simd: ProcessAudioFn;
};

export interface User {
  user_id: number,
  username: string,
  texts_count: number,
  created_at: string,
}