import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, Loader2, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import imageCompression from 'browser-image-compression';
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1/model/';

const ALL_CHALLENGES = [
  { id: 'blink', instruction: 'Blink your eyes slowly', voice: 'Please blink your eyes slowly now.', duration: 6000 },
  { id: 'turn_left', instruction: 'Turn your head to the left', voice: 'Please turn your head slowly to your left.', duration: 5000 },
  { id: 'turn_right', instruction: 'Turn your head to the right', voice: 'Please turn your head slowly to your right.', duration: 5000 },
  { id: 'nod', instruction: 'Nod your head up and down', voice: 'Please nod your head up and down slowly.', duration: 5000 },
  { id: 'smile', instruction: 'Smile at the camera', voice: 'Please give a natural smile at the camera.', duration: 5000 },
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

type Phase = 'loading_models' | 'intro' | 'camera' | 'challenge' | 'capturing' | 'done';

export const KYCSelfieUpload = ({ onComplete, onBack }: Props) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>('loading_models');
  const [challenges] = useState(() => pickRandomChallenges(2));
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [challengeTimer, setChallengeTimer] = useState(0);
  const [challengesPassed, setChallengesPassed] = useState<boolean[]>([]);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('Loading face detection models...');

  const animFrameRef = useRef<number>();
  const lastDetectionRef = useRef<any>(null);
  const challengeDataRef = useRef<{
    initialYaw: number | null;
    initialPitch: number | null;
    blinkDetected: boolean;
    headTurnDetected: boolean;
    nodDetected: boolean;
    smileDetected: boolean;
    mouthOpenDetected: boolean;
    eyebrowsDetected: boolean;
    actionDetected: boolean;
  }>({
    initialYaw: null, initialPitch: null,
    blinkDetected: false, headTurnDetected: false, nodDetected: false,
    smileDetected: false, mouthOpenDetected: false, eyebrowsDetected: false,
    actionDetected: false,
  });

  const showVideo = phase === 'camera' || phase === 'challenge' || phase === 'capturing';

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingProgress('Loading face detection model...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setLoadingProgress('Loading landmark model...');
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
        setLoadingProgress('Loading expression model...');
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        setPhase('intro');
      } catch (err) {
        console.error('Failed to load face models:', err);
        toast({ title: 'Model Load Error', description: 'Failed to load face detection. Please refresh and try again.', variant: 'destructive' });
      }
    };
    loadModels();
  }, []);

  // Attach stream to video
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (showVideo && video && stream && !video.srcObject) {
      video.srcObject = stream;
      video.play().then(() => setCameraReady(true)).catch(console.error);
    }
  }, [showVideo, phase]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      setPhase('camera');
    } catch (err) {
      console.error('Camera error:', err);
      toast({ title: 'Camera Error', description: 'Unable to access camera. Please allow camera permissions.', variant: 'destructive' });
    }
  }, [toast]);

  // Face detection loop using face-api.js
  useEffect(() => {
    if (!showVideo || !cameraReady || !modelsLoaded) return;

    let running = true;
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });

    const detect = async () => {
      if (!running) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const result = await faceapi
          .detectSingleFace(video, options)
          .withFaceLandmarks(true)
          .withFaceExpressions();

        if (result) {
          setFaceDetected(true);
          lastDetectionRef.current = result;

          // During challenge phase, check specific actions
          if (phase === 'challenge') {
            const challenge = challenges[currentChallenge];
            if (challenge) {
              checkChallengeAction(challenge.id, result);
            }
          }
        } else {
          setFaceDetected(false);
          lastDetectionRef.current = null;
        }
      } catch (e) {
        // Silently continue
      }

      if (running) {
        animFrameRef.current = requestAnimationFrame(detect);
      }
    };

    animFrameRef.current = requestAnimationFrame(detect);
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [showVideo, cameraReady, modelsLoaded, phase, currentChallenge]);

  // Check challenge-specific actions using landmarks and expressions
  const checkChallengeAction = (challengeId: string, detection: any) => {
    const landmarks = detection.landmarks;
    const expressions = detection.expressions;
    const data = challengeDataRef.current;

    // Get face angle from landmarks (approximate yaw & pitch)
    const nose = landmarks.getNose();
    const jaw = landmarks.getJawOutline();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // Yaw: nose tip relative to face center
    const faceLeft = jaw[0].x;
    const faceRight = jaw[jaw.length - 1].x;
    const faceCenter = (faceLeft + faceRight) / 2;
    const noseTip = nose[3]; // tip of nose
    const yaw = (noseTip.x - faceCenter) / (faceRight - faceLeft);

    // Pitch: nose tip Y relative to eye line Y  
    const eyeLineY = (leftEye[0].y + rightEye[0].y) / 2;
    const pitch = (noseTip.y - eyeLineY) / (jaw[8].y - eyeLineY);

    // Set initial values
    if (data.initialYaw === null) data.initialYaw = yaw;
    if (data.initialPitch === null) data.initialPitch = pitch;

    // Eye Aspect Ratio for blink detection
    const leftEAR = getEAR(leftEye);
    const rightEAR = getEAR(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2;

    // Mouth aspect ratio
    const mouth = landmarks.getMouth();
    const mouthOpen = getMouthAR(mouth);

    switch (challengeId) {
      case 'blink':
        if (avgEAR < 0.2) data.blinkDetected = true;
        data.actionDetected = data.blinkDetected;
        break;
      case 'turn_left':
        if (yaw < data.initialYaw! - 0.15) data.headTurnDetected = true;
        data.actionDetected = data.headTurnDetected;
        break;
      case 'turn_right':
        if (yaw > data.initialYaw! + 0.15) data.headTurnDetected = true;
        data.actionDetected = data.headTurnDetected;
        break;
      case 'nod':
        if (Math.abs(pitch - data.initialPitch!) > 0.15) data.nodDetected = true;
        data.actionDetected = data.nodDetected;
        break;
      case 'smile':
        if (expressions.happy > 0.5) data.smileDetected = true;
        data.actionDetected = data.smileDetected;
        break;
      case 'open_mouth':
        if (mouthOpen > 0.35) data.mouthOpenDetected = true;
        data.actionDetected = data.mouthOpenDetected;
        break;
      case 'raise_eyebrows':
        if (expressions.surprised > 0.3) data.eyebrowsDetected = true;
        data.actionDetected = data.eyebrowsDetected;
        break;
    }
  };

  // Eye Aspect Ratio calculation
  function getEAR(eye: faceapi.Point[]): number {
    if (eye.length < 6) return 0.3;
    const v1 = Math.abs(eye[1].y - eye[5].y);
    const v2 = Math.abs(eye[2].y - eye[4].y);
    const h = Math.abs(eye[0].x - eye[3].x);
    return h > 0 ? (v1 + v2) / (2 * h) : 0.3;
  }

  // Mouth Aspect Ratio
  function getMouthAR(mouth: faceapi.Point[]): number {
    if (mouth.length < 18) return 0;
    const v = Math.abs(mouth[14].y - mouth[18].y);
    const h = Math.abs(mouth[12].x - mouth[16].x);
    return h > 0 ? v / h : 0;
  }

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
    challengeDataRef.current = {
      initialYaw: null, initialPitch: null,
      blinkDetected: false, headTurnDetected: false, nodDetected: false,
      smileDetected: false, mouthOpenDetected: false, eyebrowsDetected: false,
      actionDetected: false,
    };
    setPhase('challenge');
    speakInstruction(challenges[0].voice);
  }, [challenges]);

  // Challenge timer with real face-api detection
  useEffect(() => {
    if (phase !== 'challenge') return;
    const challenge = challenges[currentChallenge];
    if (!challenge) return;

    setChallengeTimer(0);
    // Reset challenge data for new challenge
    challengeDataRef.current = {
      ...challengeDataRef.current,
      initialYaw: null, initialPitch: null,
      blinkDetected: false, headTurnDetected: false, nodDetected: false,
      smileDetected: false, mouthOpenDetected: false, eyebrowsDetected: false,
      actionDetected: false,
    };

    const totalSteps = challenge.duration / 100;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setChallengeTimer((step / totalSteps) * 100);

      // Check if action detected early - pass immediately
      if (challengeDataRef.current.actionDetected && step > 10) {
        clearInterval(interval);
        handleChallengePass();
        return;
      }

      if (step >= totalSteps) {
        clearInterval(interval);
        const passed = challengeDataRef.current.actionDetected;
        console.log(`Challenge "${challenge.id}": passed=${passed}`);

        if (!passed) {
          speakInstruction('Action not detected. Please try again.');
          setTimeout(() => {
            challengeDataRef.current = {
              ...challengeDataRef.current,
              initialYaw: null, initialPitch: null,
              blinkDetected: false, headTurnDetected: false, nodDetected: false,
              smileDetected: false, mouthOpenDetected: false, eyebrowsDetected: false,
              actionDetected: false,
            };
            setCurrentChallenge(-1);
            setTimeout(() => {
              setCurrentChallenge(currentChallenge);
              speakInstruction(challenge.voice);
            }, 100);
          }, 2000);
          return;
        }

        handleChallengePass();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, currentChallenge, challenges]);

  const handleChallengePass = useCallback(() => {
    const newPassed = [...challengesPassed, true];
    setChallengesPassed(newPassed);

    if (currentChallenge + 1 < challenges.length) {
      const nextIdx = currentChallenge + 1;
      setCurrentChallenge(nextIdx);
      setTimeout(() => speakInstruction(challenges[nextIdx].voice), 500);
    } else {
      speakInstruction('Great! Hold still for your portrait photo.');
      setPhase('capturing');
      setTimeout(() => captureSelfie(), 1500);
    }
  }, [currentChallenge, challenges, challengesPassed]);

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

          {/* LOADING MODELS */}
          {phase === 'loading_models' && (
            <div className="space-y-4 text-center py-8">
              <Loader2 className="h-10 w-10 animate-spin text-accent-purple mx-auto" />
              <p className="text-sm text-muted-foreground">{loadingProgress}</p>
            </div>
          )}

          {/* INTRO */}
          {phase === 'intro' && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">How it works:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>You'll be asked to perform <span className="font-semibold">2 random actions</span></li>
                  <li>AI detects your face, blinks, head turns, and expressions</li>
                  <li>Actions are verified instantly using face detection</li>
                  <li>Ensure good lighting and face the camera directly</li>
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

          {/* VIDEO ELEMENT */}
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
                    <p className="text-white text-sm font-medium">Capturing your portrait...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CAMERA CONTROLS */}
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
                {challengeDataRef.current.actionDetected && (
                  <p className="text-xs text-green-500 font-medium">✓ Action detected!</p>
                )}
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

          {/* DONE */}
          {phase === 'done' && selfiePreview && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <p className="text-sm text-foreground font-medium">Liveness check passed! Your portrait has been captured.</p>
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

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
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
