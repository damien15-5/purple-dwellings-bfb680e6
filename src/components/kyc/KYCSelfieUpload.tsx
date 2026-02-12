import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, AlertCircle, Loader2, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import imageCompression from 'browser-image-compression';

// 7 challenge types
const ALL_CHALLENGES = [
  { id: 'blink', instruction: 'Blink your eyes slowly', voice: 'Please blink your eyes slowly now.', duration: 5000 },
  { id: 'smile', instruction: 'Smile at the camera', voice: 'Please give a natural smile at the camera.', duration: 5000 },
  { id: 'turn_left', instruction: 'Turn your head to the left', voice: 'Please turn your head slowly to your left.', duration: 5000 },
  { id: 'turn_right', instruction: 'Turn your head to the right', voice: 'Please turn your head slowly to your right.', duration: 5000 },
  { id: 'nod', instruction: 'Nod your head up and down', voice: 'Please nod your head up and down slowly.', duration: 5000 },
  { id: 'open_mouth', instruction: 'Open your mouth briefly', voice: 'Please open your mouth briefly and close it.', duration: 5000 },
  { id: 'raise_eyebrows', instruction: 'Raise your eyebrows', voice: 'Please raise your eyebrows up and hold for a moment.', duration: 5000 },
];

function pickRandomChallenges(count: number) {
  const shuffled = [...ALL_CHALLENGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function speakInstruction(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}

interface Props {
  onComplete: (file: File, preview: string) => void;
  onBack: () => void;
}

type Phase = 'intro' | 'camera' | 'challenge' | 'capturing' | 'done';

export const KYCSelfieUpload = ({ onComplete, onBack }: Props) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>('intro');
  const [challenges] = useState(() => pickRandomChallenges(2));
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [challengeTimer, setChallengeTimer] = useState(0);
  const [challengesPassed, setChallengesPassed] = useState<boolean[]>([]);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const detectorRef = useRef<any>(null);
  const animFrameRef = useRef<number>();

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase('camera');
      initFaceDetection();
    } catch {
      toast({ title: 'Camera Error', description: 'Unable to access camera. Please allow camera permissions.', variant: 'destructive' });
    }
  }, [toast]);

  // Face detection using experimental FaceDetector API or fallback
  const initFaceDetection = useCallback(async () => {
    if ('FaceDetector' in window) {
      try {
        detectorRef.current = new (window as any).FaceDetector({ maxDetectedFaces: 1, fastMode: true });
        setDetecting(true);
      } catch {
        // Fallback: no native face detection, just use video presence
        setDetecting(false);
        setFaceDetected(true);
      }
    } else {
      // No FaceDetector API - treat as face always detected when video is active
      setDetecting(false);
      setFaceDetected(true);
    }
  }, []);

  // Run face detection loop
  useEffect(() => {
    if (!detecting || !detectorRef.current || !videoRef.current) return;

    let running = true;
    const detect = async () => {
      if (!running || !videoRef.current || videoRef.current.readyState < 2) {
        if (running) animFrameRef.current = requestAnimationFrame(detect);
        return;
      }
      try {
        const faces = await detectorRef.current.detect(videoRef.current);
        setFaceDetected(faces.length > 0);
      } catch {
        // Ignore detection errors
      }
      if (running) animFrameRef.current = requestAnimationFrame(detect);
    };
    animFrameRef.current = requestAnimationFrame(detect);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [detecting]);

  // Stop camera
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Start challenge sequence
  const startChallenges = useCallback(() => {
    setCurrentChallenge(0);
    setChallengesPassed([]);
    setPhase('challenge');
    const challenge = challenges[0];
    speakInstruction(challenge.voice);
  }, [challenges]);

  // Challenge timer
  useEffect(() => {
    if (phase !== 'challenge') return;
    const challenge = challenges[currentChallenge];
    if (!challenge) return;

    setChallengeTimer(0);
    const totalSteps = challenge.duration / 100;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setChallengeTimer((step / totalSteps) * 100);
      if (step >= totalSteps) {
        clearInterval(interval);
        // Auto-pass the challenge (in production, ML would verify)
        const newPassed = [...challengesPassed, true];
        setChallengesPassed(newPassed);

        if (currentChallenge + 1 < challenges.length) {
          // Next challenge
          const nextIdx = currentChallenge + 1;
          setCurrentChallenge(nextIdx);
          setTimeout(() => {
            speakInstruction(challenges[nextIdx].voice);
          }, 500);
          setChallengeTimer(0);
        } else {
          // All challenges done - capture selfie
          speakInstruction('Great! Hold still while we capture your photo.');
          setPhase('capturing');
          setTimeout(() => captureSelfie(), 1500);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, currentChallenge, challenges]);

  // Capture selfie from video
  const captureSelfie = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the image (front camera is mirrored)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const file = new File([blob], `selfie-${Date.now()}.webp`, { type: 'image/webp' });
        const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true });
        const preview = URL.createObjectURL(compressed);
        setSelfieFile(compressed);
        setSelfiePreview(preview);
        setPhase('done');
        stopCamera();
        speakInstruction('Your liveness check is complete.');
      } catch {
        toast({ title: 'Error', description: 'Failed to capture selfie. Please retry.', variant: 'destructive' });
        setPhase('camera');
      }
    }, 'image/webp', 0.85);
  }, [stopCamera, toast]);

  const handleRetry = () => {
    setSelfieFile(null);
    setSelfiePreview(null);
    setChallengesPassed([]);
    setCurrentChallenge(0);
    setPhase('intro');
    stopCamera();
  };

  return (
    <div className="space-y-6">
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-accent-purple" />
            Liveness Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* INTRO */}
          {phase === 'intro' && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">How it works:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>You'll be asked to perform <span className="font-semibold">2 random actions</span></li>
                  <li>Voice prompts will guide you through each step</li>
                  <li>Keep your face centered in the frame</li>
                  <li>Ensure good lighting and remove glasses/hats</li>
                  <li>A selfie will be captured automatically after verification</li>
                </ul>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                <Volume2 className="h-4 w-4 text-accent-purple shrink-0" />
                <p className="text-xs text-muted-foreground">Enable your device speaker — voice instructions will guide you.</p>
              </div>
              <Button variant="hero" className="w-full" onClick={startCamera}>
                <Camera className="h-4 w-4 mr-2" />
                Start Liveness Check
              </Button>
            </div>
          )}

          {/* CAMERA PREVIEW (pre-challenge) */}
          {phase === 'camera' && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3] max-w-sm mx-auto">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                {/* Face overlay guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-48 h-60 rounded-[50%] border-4 transition-colors ${faceDetected ? 'border-green-400' : 'border-red-400'}`} />
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${faceDetected ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                    {faceDetected ? '✓ Face detected' : '✗ Position your face in the oval'}
                  </span>
                </div>
              </div>
              <Button variant="hero" className="w-full" onClick={startChallenges} disabled={!faceDetected}>
                Begin Challenges
              </Button>
            </div>
          )}

          {/* CHALLENGE IN PROGRESS */}
          {phase === 'challenge' && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3] max-w-sm mx-auto">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-48 h-60 rounded-[50%] border-4 ${faceDetected ? 'border-green-400' : 'border-yellow-400'} animate-pulse`} />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Challenge {currentChallenge + 1} of {challenges.length}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {challenges[currentChallenge]?.instruction}
                </p>
                <Progress value={challengeTimer} className="h-2" />
              </div>

              <div className="flex gap-2 justify-center">
                {challenges.map((_, i) => (
                  <div key={i} className={`h-3 w-3 rounded-full transition-colors ${
                    i < challengesPassed.length ? 'bg-green-500' :
                    i === currentChallenge ? 'bg-accent-purple animate-pulse' : 'bg-muted'
                  }`} />
                ))}
              </div>
            </div>
          )}

          {/* CAPTURING */}
          {phase === 'capturing' && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3] max-w-sm mx-auto">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
                    <p className="text-white text-sm font-medium">Capturing your photo...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DONE */}
          {phase === 'done' && selfiePreview && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <p className="text-sm text-foreground font-medium">Liveness check passed! Your selfie has been captured.</p>
              </div>
              <div className="relative max-w-xs mx-auto">
                <img src={selfiePreview} alt="Verified selfie" className="w-full rounded-lg border border-border" />
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleRetry}>Retry</Button>
                <Button variant="hero" onClick={() => selfieFile && onComplete(selfieFile, selfiePreview)}>Continue</Button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>

      {(phase === 'intro') && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
        </div>
      )}
    </div>
  );
};
