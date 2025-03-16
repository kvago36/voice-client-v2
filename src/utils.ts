export function sliceAudioBuffer(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number
) {
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const frameCount = endSample - startSample;

  const newBuffer = new AudioBuffer({
    length: frameCount,
    numberOfChannels: audioBuffer.numberOfChannels,
    sampleRate: sampleRate,
  });

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const oldData = audioBuffer.getChannelData(channel);
    const newData = newBuffer.getChannelData(channel);
    newData.set(oldData.subarray(startSample, endSample));
  }

  return newBuffer;
}

// Convert AudioBuffer to Linear16 PCM
export async function convertToLinear16(
  audioBuffer: AudioBuffer,
  targetSampleRate: number,
  targetChannels: number
) {
  // Create an offline audio context with the target sample rate
  const offlineCtx = new OfflineAudioContext(
    targetChannels,
    audioBuffer.duration * targetSampleRate,
    targetSampleRate
  );

  // Create a buffer source
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start();

  // Render the audio
  const renderedBuffer = await offlineCtx.startRendering();

  // Convert Float32Array to Int16Array (Linear16 PCM)
  const numChannels = renderedBuffer.numberOfChannels;
  const length = renderedBuffer.length;
  const result = new Int16Array(length * targetChannels);

  // Process each channel
  for (let i = 0; i < numChannels; i++) {
    const channelData = renderedBuffer.getChannelData(i);

    // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
    // and interleave channels if stereo
    for (let j = 0; j < length; j++) {
      // Clipping prevention
      let sample = Math.max(-1, Math.min(1, channelData[j]));

      // Convert to 16-bit PCM
      sample = Math.floor(sample * 32767);

      // Set in the correct position based on channel interleaving
      result[j * targetChannels + i] = sample;
    }
  }

  return result.buffer;
}
