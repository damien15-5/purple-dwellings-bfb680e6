import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, Loader2, Volume2 } from 'lucide-react';
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

// Simple canvas-based face detection using skin-color heuristic
function detectFaceInCanvas(video: HTMLVideoElement, canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || video.readyState < 2) return false;

  const w = 160;
  const h = 120;
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(video, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Check the center oval region for skin-tone pixels
  const cx = w / 2;
  const cy = h / 2;
  const rx = w * 0.25;
  const ry = h * 0.35;

  let skinPixels = 0;
  let totalChecked = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Check if pixel is inside the oval
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;

      totalChecked++;
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Skin color detection in RGB space
      // Works across multiple skin tones
      if (
        r > 60 && g > 40 && b > 20 &&
        r > g && r > b &&
        Math.abs(r - g) > 10 &&
        r - b > 15 &&
        // Not too bright (avoid white backgrounds)
        r < 250 && g < 250
      ) {
        skinPixels++;
      }
    }
  }

  // Need at least 20% skin pixels in the oval region
  return totalChecked > 0 && (skinPixels / totalChecked) > 0.2;
}

// Motion detection between frames - uses center region for better sensitivity
function detectMotion(prev: ImageData | null, current: ImageData): number {
  if (!prev || prev.data.length !== current.data.length) return 0;
  
  const w = current.width;
  const h = current.height;
  let changedPixels = 0;
  let totalChecked = 0;
  
  // Only check center 60% of frame where the face is
  const startX = Math.floor(w * 0.2);
  const endX = Math.floor(w * 0.8);
  const startY = Math.floor(h * 0.1);
  const endY = Math.floor(h * 0.9);
  
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const i = (y * w + x) * 4;
      totalChecked++;
      const diff = Math.abs(current.data[i] - prev.data[i]) +
                   Math.abs(current.data[i + 1] - prev.data[i + 1]) +
                   Math.abs(current.data[i + 2] - prev.data[i + 2]);
      // Lower threshold (15) to catch subtle movements like blinks
      if (diff > 15) changedPixels++;
    }
  }
  
  return totalChecked > 0 ? changedPixels / totalChecked : 0;
}

export const KYCSelfieUpload = ({ onComplete, onBack }: Props) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);

  const [phase, setPhase] = useState<Phase>('intro');
  const [challenges] = useState(() => pickRandomChallenges(2));
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [challengeTimer, setChallengeTimer] = useState(0);
  const [challengesPassed, setChallengesPassed] = useState<boolean[]>([]);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [motionDetected, setMotionDetected] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const animFrameRef = useRef<number>();
  const motionAccRef = useRef<number>(0);

  const showVideo = phase === 'camera' || phase === 'challenge' || phase === 'capturing';

  // Attach stream to video element whenever video mounts and stream exists
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (showVideo && video && stream && !video.srcObject) {
      video.srcObject = stream;
      video.play().then(() => {
        setCameraReady(true);
      }).catch(console.error);
    }
  }, [showVideo, phase]);

  // Start camera - called directly from button click
  const startCamera = useCallback(async () => {
    try {
      // getUserMedia called directly in click handler
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      // Set phase to render video element, the useEffect above will attach the stream
      setPhase('camera');
    } catch (err) {
      console.error('Camera error:', err);
      toast({ title: 'Camera Error', description: 'Unable to access camera. Please allow camera permissions.', variant: 'destructive' });
    }
  }, [toast]);

  // Face detection loop using canvas analysis
  useEffect(() => {
    if (!showVideo || !cameraReady) return;

    let running = true;
    const detect = () => {
      if (!running) return;
      
      const video = videoRef.current;
      const canvas = detectionCanvasRef.current;
      
      if (video && canvas && video.readyState >= 2) {
        const hasFace = detectFaceInCanvas(video, canvas);
        setFaceDetected(hasFace);
        
        // Motion detection for challenge verification
        if (phase === 'challenge') {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const motion = detectMotion(prevFrameRef.current, currentFrame);
            motionAccRef.current = Math.max(motionAccRef.current, motion); // keep peak motion
            setMotionDetected(motion > 0.005); // 0.5% = very sensitive to any movement
            prevFrameRef.current = currentFrame;
          }
        }
      }
      
      animFrameRef.current = requestAnimationFrame(detect);
    };
    
    animFrameRef.current = requestAnimationFrame(detect);
    
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [showVideo, cameraReady, phase]);

  // Stop camera
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Start challenge sequence
  const startChallenges = useCallback(() => {
    setCurrentChallenge(0);
    setChallengesPassed([]);
    prevFrameRef.current = null;
    motionAccRef.current = 0;
    setPhase('challenge');
    const challenge = challenges[0];
    speakInstruction(challenge.voice);
  }, [challenges]);

  // Challenge timer with motion-based verification
  useEffect(() => {
    if (phase !== 'challenge') return;
    const challenge = challenges[currentChallenge];
    if (!challenge) return;

    setChallengeTimer(0);
    let motionFrames = 0;
    const totalSteps = challenge.duration / 100;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setChallengeTimer((step / totalSteps) * 100);
      
      // Count frames where any motion was detected (very low threshold)
      if (motionAccRef.current > 0.005) {
        motionFrames++;
        // Reset peak so we measure ongoing motion
        motionAccRef.current = 0;
      }

      if (step >= totalSteps) {
        clearInterval(interval);
        // Pass if motion was detected in at least 15% of frames (very lenient)
        const passed = motionFrames > (totalSteps * 0.15);
        console.log(`Challenge "${challenge.id}": motionFrames=${motionFrames}/${totalSteps}, passed=${passed}`);

        if (!passed) {
          speakInstruction('Action not detected. Please try again.');
          // Reset and re-run by bumping a retry counter
          setTimeout(() => {
            prevFrameRef.current = null;
            motionAccRef.current = 0;
            // Force re-trigger useEffect by toggling challenge index
            setCurrentChallenge(-1);
            setTimeout(() => {
              setCurrentChallenge(currentChallenge);
              speakInstruction(challenge.voice);
            }, 100);
          }, 2000);
          return;
        }

        const newPassed = [...challengesPassed, true];
        setChallengesPassed(newPassed);

        if (currentChallenge + 1 < challenges.length) {
          const nextIdx = currentChallenge + 1;
          prevFrameRef.current = null;
          motionAccRef.current = 0;
          setCurrentChallenge(nextIdx);
          setTimeout(() => {
            speakInstruction(challenges[nextIdx].voice);
          }, 500);
        } else {
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
    setFaceDetected(false);
    setMotionDetected(false);
    prevFrameRef.current = null;
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
                  <li>Your face must be detected in the frame</li>
                  <li>Motion detection verifies your actions</li>
                  <li>Ensure good lighting and remove glasses/hats</li>
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

          {/* VIDEO ELEMENT - always mounted when needed so ref is available */}
          {showVideo && (
            <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3] max-w-sm mx-auto">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {/* Face oval overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-48 h-60 rounded-[50%] border-4 transition-colors duration-300 ${
                  faceDetected ? 'border-green-400' : 'border-red-400 animate-pulse'
                }`} />
              </div>
              {/* Face status badge */}
              <div className="absolute bottom-2 left-2 right-2 text-center">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  faceDetected ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                }`}>
                  {faceDetected ? '✓ Face detected' : '✗ Position your face in the oval'}
                </span>
              </div>

              {/* Capturing overlay */}
              {phase === 'capturing' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
                    <p className="text-white text-sm font-medium">Capturing your photo...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CAMERA CONTROLS (pre-challenge) */}
          {phase === 'camera' && (
            <div className="space-y-2">
              <Button variant="hero" className="w-full" onClick={startChallenges} disabled={!faceDetected}>
                Begin Challenges
              </Button>
              {!faceDetected && (
                <p className="text-xs text-center text-muted-foreground">
                  Position your face inside the oval to continue
                </p>
              )}
            </div>
          )}

          {/* CHALLENGE INFO */}
          {phase === 'challenge' && (
            <div className="space-y-3">
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Challenge {currentChallenge + 1} of {challenges.length}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {challenges[currentChallenge]?.instruction}
                </p>
                <Progress value={challengeTimer} className="h-2" />
                {motionDetected && (
                  <p className="text-xs text-green-500 font-medium">✓ Motion detected</p>
                )}
              </div>

              <div className="flex gap-2 justify-center">
                {challenges.map((_, i) => (
                  <div key={i} className={`h-3 w-3 rounded-full transition-colors ${
                    i < challengesPassed.length ? (challengesPassed[i] ? 'bg-green-500' : 'bg-red-500') :
                    i === currentChallenge ? 'bg-accent-purple animate-pulse' : 'bg-muted'
                  }`} />
                ))}
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

          {/* Hidden canvases for processing */}
          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={detectionCanvasRef} className="hidden" />
        </CardContent>
      </Card>

      {phase === 'intro' && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
        </div>
      )}
    </div>
  );
};
