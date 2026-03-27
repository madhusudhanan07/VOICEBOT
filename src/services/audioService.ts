/**
 * Service to handle audio recording and playback for the Gemini Live API.
 */
export class AudioService {
  private recordingContext: AudioContext | null = null;
  private playbackContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private input: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private stream: MediaStream | null = null;
  private nextStartTime: number = 0;
  private currentSensitivity: number = 1.0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private playbackQueue: Promise<void> = Promise.resolve();

  setSensitivity(value: number) {
    this.currentSensitivity = value;
    if (this.gainNode && this.recordingContext) {
      this.gainNode.gain.setTargetAtTime(value, this.recordingContext.currentTime, 0.1);
    }
  }

  async startRecording(onAudioData: (base64Data: string) => void) {
    try {
      // Create context with 16kHz for Gemini
      if (!this.recordingContext || this.recordingContext.state === 'closed') {
        this.recordingContext = new AudioContext({ sampleRate: 16000 });
      }
      
      if (this.recordingContext.state === 'suspended') {
        await this.recordingContext.resume();
      }

      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        } 
      });
      
      this.input = this.recordingContext.createMediaStreamSource(this.stream);
      this.gainNode = this.recordingContext.createGain();
      this.gainNode.gain.value = this.currentSensitivity;
      
      this.processor = this.recordingContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
        }
        
        const bytes = new Uint8Array(pcmData.buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);
        onAudioData(base64Data);
      };

      this.input.connect(this.gainNode);
      this.gainNode.connect(this.processor);
      this.processor.connect(this.recordingContext.destination);
    } catch (error) {
      console.error("Error starting recording:", error);
      throw error;
    }
  }

  stopRecording() {
    this.processor?.disconnect();
    this.gainNode?.disconnect();
    this.input?.disconnect();
    this.stream?.getTracks().forEach(track => track.stop());
    this.clearPlaybackQueue();
    
    this.recordingContext?.close();
    this.playbackContext?.close();
    
    this.processor = null;
    this.input = null;
    this.stream = null;
    this.recordingContext = null;
    this.playbackContext = null;
  }

  async playAudioChunk(base64Data: string) {
    this.playbackQueue = this.playbackQueue.then(async () => {
      try {
        if (!this.playbackContext || this.playbackContext.state === 'closed') {
          this.playbackContext = new AudioContext({ sampleRate: 24000 });
        }
        
        if (this.playbackContext.state === 'suspended') {
          await this.playbackContext.resume();
        }

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const pcmData = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          float32Data[i] = pcmData[i] / 0x7fff;
        }

        const buffer = this.playbackContext.createBuffer(1, float32Data.length, 24000);
        buffer.getChannelData(0).set(float32Data);

        const source = this.playbackContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.playbackContext.destination);

        const currentTime = this.playbackContext.currentTime;
        if (this.nextStartTime < currentTime) {
          this.nextStartTime = currentTime;
        }

        source.onended = () => {
          this.activeSources.delete(source);
        };

        this.activeSources.add(source);
        source.start(this.nextStartTime);
        this.nextStartTime += buffer.duration;
      } catch (error) {
        console.error("Error playing audio chunk:", error);
      }
    });
    
    return this.playbackQueue;
  }

  clearPlaybackQueue() {
    this.activeSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Source might have already stopped
      }
    });
    this.activeSources.clear();
    this.nextStartTime = 0;
    this.playbackQueue = Promise.resolve();
  }
}
