import { useState, useRef, useEffect } from "react";
import { Camera, RotateCw, Sparkles, AlertCircle, Info, CheckCircle } from "lucide-react";
import { AIChatbot } from "../components/ai-chatbot";
import {
  hairstyleRecommendations,
  type FaceShape,
  type HairstyleRecommendation,
} from "../data/marketplace-data";

type ScanStage = "idle" | "camera-ready" | "scanning" | "analyzing" | "complete";
type PermissionState = "prompt" | "granted" | "denied" | "unknown";

export function AIConsultant() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<ScanStage>("idle");
  const [progress, setProgress] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [showChatbot, setShowChatbot] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    faceShape: FaceShape;
    recommendations: HairstyleRecommendation[];
  } | null>(null);

  // Check camera permission status on mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const checkCameraPermission = async () => {
    try {
      // Check if Permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: "camera" as PermissionName });
        setPermissionState(result.state as PermissionState);
        
        // Listen for permission changes
        result.addEventListener("change", () => {
          setPermissionState(result.state as PermissionState);
        });
      }
    } catch (err) {
      // Permissions API not supported, will check during camera access
      setPermissionState("unknown");
    }
  };

  const startCamera = async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setStage("camera-ready");
        setPermissionState("granted");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Camera error:", error);
      
      // Provide specific error messages based on error type
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setError("permission-denied");
        setPermissionState("denied");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setError("no-camera");
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        setError("camera-in-use");
      } else {
        setError("generic");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startScan = () => {
    setStage("scanning");
    setProgress(0);

    // Simulate face detection progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStage("analyzing");
          performAnalysis();
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const performAnalysis = () => {
    // Simulate AI analysis with delay
    setTimeout(() => {
      // Randomly select a face shape for demo
      const faceShapes: FaceShape[] = ["oval", "square", "round", "heart", "diamond", "oblong"];
      const randomShape = faceShapes[Math.floor(Math.random() * faceShapes.length)];
      
      // Get recommendations for this face shape
      const recommendations = hairstyleRecommendations.filter((style) =>
        style.faceShapes.includes(randomShape)
      );

      setAnalysisResult({
        faceShape: randomShape,
        recommendations: recommendations.slice(0, 4), // Top 4 recommendations
      });

      setStage("complete");
      
      // Show chatbot after brief delay
      setTimeout(() => {
        stopCamera();
        setShowChatbot(true);
      }, 1000);
    }, 2000);
  };

  const reset = () => {
    stopCamera();
    setStage("idle");
    setProgress(0);
    setShowChatbot(false);
    setAnalysisResult(null);
    setError("");
  };

  // Draw face mesh overlay
  useEffect(() => {
    if (stage === "scanning" || stage === "analyzing") {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const drawOverlay = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Face oval outline
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radiusX = canvas.width * 0.25;
        const radiusY = canvas.height * 0.35;

        ctx.strokeStyle = "#C8963E";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();

        // Detection points (animated)
        const points = [
          { x: centerX, y: centerY - radiusY }, // Top
          { x: centerX - radiusX, y: centerY }, // Left
          { x: centerX + radiusX, y: centerY }, // Right
          { x: centerX, y: centerY + radiusY }, // Bottom
          { x: centerX - radiusX * 0.7, y: centerY - radiusY * 0.5 }, // Top-left
          { x: centerX + radiusX * 0.7, y: centerY - radiusY * 0.5 }, // Top-right
          { x: centerX - radiusX * 0.7, y: centerY + radiusY * 0.5 }, // Bottom-left
          { x: centerX + radiusX * 0.7, y: centerY + radiusY * 0.5 }, // Bottom-right
        ];

        points.forEach((point, index) => {
          const phase = (progress / 100) * Math.PI * 2 + (index * Math.PI / 4);
          const pulse = Math.sin(phase) * 0.5 + 0.5;
          const radius = 4 + pulse * 3;

          ctx.fillStyle = `rgba(200, 150, 62, ${0.6 + pulse * 0.4})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Scan lines
        const scanY = (progress / 100) * canvas.height;
        ctx.strokeStyle = `rgba(200, 150, 62, 0.3)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - radiusX, scanY);
        ctx.lineTo(centerX + radiusX, scanY);
        ctx.stroke();
      };

      const animationFrame = requestAnimationFrame(function animate() {
        drawOverlay();
        if (stage === "scanning" || stage === "analyzing") {
          requestAnimationFrame(animate);
        }
      });

      return () => cancelAnimationFrame(animationFrame);
    }
  }, [stage, progress]);

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-bold text-4xl text-foreground mb-3">
            AI Visual Consultant
          </h1>
          <p className="text-muted-foreground font-light text-lg leading-relaxed max-w-2xl mx-auto">
            Let our AI analyze your facial structure to recommend the perfect hairstyles tailored just for you
          </p>
        </div>

        {/* Main Interface */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Camera View */}
          <div className="relative aspect-[4/3] bg-background overflow-hidden">
            {stage === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <h2 className="font-bold text-2xl text-card-foreground mb-3">
                  Ready to Get Started?
                </h2>
                <p className="text-muted-foreground font-light mb-8 max-w-md leading-relaxed">
                  Position your face in the frame. Our AI will analyze your facial structure to recommend personalized hairstyles.
                </p>
                
                {/* Permission Status Indicator */}
                {permissionState !== "unknown" && permissionState !== "denied" && (
                  <div className="mb-4 flex items-center gap-2 text-sm">
                    {permissionState === "granted" && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-muted-foreground font-light">Camera access granted</span>
                      </>
                    )}
                    {permissionState === "prompt" && (
                      <>
                        <Info className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground font-light">You'll be asked for camera permission</span>
                      </>
                    )}
                  </div>
                )}

                <button
                  onClick={startCamera}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Enable Camera
                </button>
                {/* Error Messages with Help */}
                {error && (
                  <div className="mt-6 w-full max-w-md">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-bold text-destructive mb-2">
                            {error === "permission-denied" && "Camera Permission Denied"}
                            {error === "no-camera" && "No Camera Found"}
                            {error === "camera-in-use" && "Camera In Use"}
                            {error === "generic" && "Camera Access Error"}
                          </h4>
                          <p className="text-sm text-destructive/90 font-light mb-3 leading-relaxed">
                            {error === "permission-denied" && 
                              "You've blocked camera access for this website. To use the AI face scanner, you need to grant camera permissions."}
                            {error === "no-camera" && 
                              "We couldn't detect a camera on your device. Please make sure a camera is connected and try again."}
                            {error === "camera-in-use" && 
                              "Your camera is currently being used by another application. Please close other apps using the camera."}
                            {error === "generic" && 
                              "We're having trouble accessing your camera. Please check your browser settings and try again."}
                          </p>
                          
                          {error === "permission-denied" && (
                            <div className="bg-card rounded-lg p-3 border border-border">
                              <h5 className="font-bold text-card-foreground text-xs mb-2 flex items-center gap-2">
                                <Info className="w-4 h-4 text-primary" />
                                How to Fix This:
                              </h5>
                              <ol className="text-xs text-muted-foreground font-light space-y-1.5 list-decimal list-inside leading-relaxed">
                                <li>Look for the camera icon in your browser's address bar</li>
                                <li>Click the icon and select "Allow" or "Always allow"</li>
                                <li>Refresh this page and click "Enable Camera" again</li>
                                <li>If still blocked, check your browser settings under Privacy & Security</li>
                              </ol>
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground font-light">
                                  <span className="font-bold">Browser Shortcuts:</span><br />
                                  <span className="text-primary">Chrome/Edge:</span> Settings → Privacy → Camera<br />
                                  <span className="text-primary">Firefox:</span> Preferences → Privacy → Permissions<br />
                                  <span className="text-primary">Safari:</span> Preferences → Websites → Camera
                                </p>
                              </div>
                            </div>
                          )}

                          {error === "camera-in-use" && (
                            <div className="bg-card rounded-lg p-3 border border-border">
                              <h5 className="font-bold text-card-foreground text-xs mb-2 flex items-center gap-2">
                                <Info className="w-4 h-4 text-primary" />
                                Troubleshooting Steps:
                              </h5>
                              <ul className="text-xs text-muted-foreground font-light space-y-1.5 list-disc list-inside leading-relaxed">
                                <li>Close other tabs or apps using your camera (Zoom, Teams, etc.)</li>
                                <li>Make sure no other browser windows are accessing the camera</li>
                                <li>Restart your browser if the issue persists</li>
                                <li>Check if another app has exclusive camera access</li>
                              </ul>
                            </div>
                          )}

                          {error === "no-camera" && (
                            <div className="bg-card rounded-lg p-3 border border-border">
                              <h5 className="font-bold text-card-foreground text-xs mb-2 flex items-center gap-2">
                                <Info className="w-4 h-4 text-primary" />
                                Possible Solutions:
                              </h5>
                              <ul className="text-xs text-muted-foreground font-light space-y-1.5 list-disc list-inside leading-relaxed">
                                <li>Check if your webcam is properly connected</li>
                                <li>Try using a different USB port (for external cameras)</li>
                                <li>Enable camera in Device Manager (Windows) or System Preferences (Mac)</li>
                                <li>Make sure camera drivers are up to date</li>
                              </ul>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              setError("");
                              startCamera();
                            }}
                            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                          >
                            <RotateCw className="w-4 h-4" />
                            Try Again
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                stage === "idle" ? "hidden" : "block"
              }`}
            />

            {/* Canvas Overlay for Face Mesh */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full ${
                stage === "scanning" || stage === "analyzing" ? "block" : "hidden"
              }`}
            />

            {/* Progress Overlay */}
            {(stage === "scanning" || stage === "analyzing") && (
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent flex flex-col items-center justify-end p-8">
                <div className="w-full max-w-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-primary font-bold">
                      {stage === "scanning" ? "Scanning Face..." : "Analyzing Structure..."}
                    </span>
                    <span className="text-primary font-bold">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Complete State */}
            {stage === "complete" && analysisResult && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center mb-6 animate-pulse">
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="font-bold text-3xl text-foreground mb-3">
                  Analysis Complete!
                </h2>
                <p className="text-muted-foreground font-light text-lg mb-2">
                  Face Shape: <span className="text-primary font-bold capitalize">{analysisResult.faceShape}</span>
                </p>
                <p className="text-muted-foreground font-light">
                  Opening your personalized recommendations...
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          {stage === "camera-ready" && (
            <div className="p-6 border-t border-border">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={startScan}
                  className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Start Face Scan
                </button>
                <button
                  onClick={reset}
                  className="px-6 py-4 border border-border text-card-foreground rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-5 h-5" />
                  Reset
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4 font-light">
                Make sure your face is well-lit and centered in the frame for best results
              </p>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto mb-3 font-bold text-xl">
              1
            </div>
            <h3 className="font-bold text-foreground mb-2">Face Scan</h3>
            <p className="text-muted-foreground font-light text-sm leading-relaxed">
              Our AI analyzes your facial structure and proportions
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto mb-3 font-bold text-xl">
              2
            </div>
            <h3 className="font-bold text-foreground mb-2">Smart Match</h3>
            <p className="text-muted-foreground font-light text-sm leading-relaxed">
              Get personalized hairstyle recommendations
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto mb-3 font-bold text-xl">
              3
            </div>
            <h3 className="font-bold text-foreground mb-2">Find Barbers</h3>
            <p className="text-muted-foreground font-light text-sm leading-relaxed">
              Discover barbershops that specialize in your style
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-8 bg-muted rounded-xl p-6 border border-border">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-foreground mb-1">Privacy & Security</h4>
              <p className="text-muted-foreground font-light text-sm leading-relaxed">
                Your photos are processed locally in your browser and are never stored or uploaded to our servers. 
                All analysis happens in real-time on your device.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      {showChatbot && analysisResult && (
        <AIChatbot
          faceShape={analysisResult.faceShape}
          recommendations={analysisResult.recommendations}
          onClose={reset}
        />
      )}
    </div>
  );
}