class MicProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.offset = 0;
    this.output = new Int16Array(options.processorOptions.output)
    this.input = new Float32Array(options.processorOptions.input);
  }

  process(inputs) {
    const input = inputs[0][0];

    if (!input) return true;

    this.offset += input.length;

    console.log(this.offset, this.input.length)

    if (this.offset === this.input.length) {
      this.port.postMessage({ done: true });
      this.offset = 0;
      return false
    }

    this.input.set(input, this.offset); 

    return true;
  }
}

registerProcessor('mic-processor', MicProcessor);

