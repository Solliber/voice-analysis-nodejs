class VoiceProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 512;
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;
    }

    process(inputs, outputs) {
        const input = inputs[0];
        const output = outputs[0];

        // Copy input to output
        for (let channel = 0; channel < input.length; channel++) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];
            
            for (let i = 0; i < inputChannel.length; i++) {
                outputChannel[i] = inputChannel[i];
                
                // Fill our analysis buffer
                if (this.bufferIndex < this.bufferSize) {
                    this.buffer[this.bufferIndex++] = inputChannel[i];
                }
            }
        }

        // If buffer is full, process it
        if (this.bufferIndex >= this.bufferSize) {
            this.processBuffer();
            this.bufferIndex = 0;
        }

        return true;
    }

    processBuffer() {
        // Here we could add additional processing if needed
        // Currently, Meyda handles the main audio analysis
    }
}

registerProcessor('voice-processor', VoiceProcessor);