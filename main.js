import Meyda from 'meyda';

class VoiceAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyzer = null;
        this.microphone = null;
        this.isAnalyzing = false;
        this.workletNode = null;

        this.startButton = document.getElementById('startButton');
        this.stopButton = document.getElementById('stopButton');

        this.startButton.addEventListener('click', () => this.start());
        this.stopButton.addEventListener('click', () => this.stop());
    }

    async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new AudioContext();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            // Load and initialize the AudioWorklet
            await this.audioContext.audioWorklet.addModule('voice-processor.js');
            this.workletNode = new AudioWorkletNode(this.audioContext, 'voice-processor');
            
            this.microphone.connect(this.workletNode);
            this.workletNode.connect(this.audioContext.destination);
            
            // Create Meyda analyzer
            this.analyzer = Meyda.createMeydaAnalyzer({
                audioContext: this.audioContext,
                source: this.microphone,
                bufferSize: 512,
                featureExtractors: [
                    'rms',
                    'zcr',
                    'spectralCentroid',
                    'spectralRolloff',
                    'loudness',
                    'perceptualSpread',
                    'perceptualSharpness'
                ],
                callback: features => this.processAudioFeatures(features)
            });

            this.analyzer.start();
            this.isAnalyzing = true;
            
            this.startButton.disabled = true;
            this.stopButton.disabled = false;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
        }
    }

    stop() {
        if (this.analyzer) {
            this.analyzer.stop();
        }
        if (this.workletNode) {
            this.workletNode.disconnect();
            this.workletNode = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.isAnalyzing = false;
        this.startButton.disabled = false;
        this.stopButton.disabled = true;
    }

    processAudioFeatures(features) {
        if (!features) return;

        // Update breathing analysis
        this.updateBreathingMetrics(features);

        // Update phonation metrics
        this.updatePhonationMetrics(features);

        // Update articulation and intonation
        this.updateArticulationMetrics(features);

        // Update voice register
        this.updateVoiceRegister(features);
    }

    updateBreathingMetrics(features) {
        // Calculate breath support based on RMS (volume stability)
        const breathSupport = Math.min(features.rms * 200, 100);
        document.querySelector('.breath-support-indicator').style.width = `${breathSupport}%`;

        // Calculate breath control based on spectral stability
        const breathControl = Math.min(features.spectralRolloff / 50, 100);
        document.querySelector('.breath-control-indicator').style.width = `${breathControl}%`;
    }

    updatePhonationMetrics(features) {
        // Update pitch (using spectral centroid as an approximation)
        const pitch = Math.round(features.spectralCentroid);
        document.getElementById('pitch').textContent = `${pitch} Hz`;

        // Update volume
        const volume = Math.round(features.loudness.total * 100) / 100;
        document.getElementById('volume').textContent = `${volume} dB`;

        // Update resonance (using perceptual spread)
        const resonance = Math.round(features.perceptualSpread * 100) / 100;
        document.getElementById('resonance').textContent = resonance.toFixed(2);
    }

    updateArticulationMetrics(features) {
        // Calculate clarity based on spectral sharpness
        const clarity = Math.min(features.perceptualSharpness * 100, 100);
        document.querySelector('.clarity-indicator').style.width = `${clarity}%`;

        // Calculate pitch accuracy (using zero-crossing rate stability)
        const pitchAccuracy = Math.min(features.zcr / 50, 100);
        document.querySelector('.pitch-accuracy-indicator').style.width = `${pitchAccuracy}%`;
    }

    updateVoiceRegister(features) {
        // Determine voice register based on spectral centroid
        let register;
        const centroid = features.spectralCentroid;
        
        if (centroid < 2000) {
            register = 'Chest Voice';
        } else if (centroid < 3000) {
            register = 'Mix Voice';
        } else if (centroid < 4000) {
            register = 'Head Voice';
        } else {
            register = 'Falsetto';
        }
        
        document.getElementById('voiceRegister').textContent = register;
    }
}

// Initialize the voice analyzer
new VoiceAnalyzer();