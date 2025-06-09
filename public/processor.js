class MicProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.offset = 0;
    this.ready = false;
    this.main_input = options.processorOptions.main_input;
    this.secondary_input = options.processorOptions.secondary_input;
    this.len = options.processorOptions.len;
    this.buffer = options.processorOptions.buffer;
    this.main = new Float32Array(
      this.buffer,
      this.main_input,
      this.len
    );
    this.secondary = new Float32Array(
      this.buffer,
      this.secondary_input,
      this.len
    );
  }

  process(inputs) {
    const input = inputs[0][0];

    if (!input) return true;

    if (this.offset === this.main.length) {
      this.port.postMessage({ ready: this.ready });
      this.offset = 0;
      this.ready = !this.ready;
    }

    if (!this.ready) {
      this.main.set(input, this.offset);
    } else {
      this.secondary.set(input, this.offset);
    }

    this.offset += input.length;

    return true;
  }
}

registerProcessor("mic-processor", MicProcessor);
