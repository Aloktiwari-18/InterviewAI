import React, { useRef, useEffect, useState } from 'react';

export function FaceDetectionMonitor({ onViolation }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [violationMessage, setViolationMessage] = useState('');
  const [detectionStarted, setDetectionStarted] = useState(false);
  const detectionIntervalRef = useRef(null);
  const modelsLoadedRef = useRef(false);
  const faceapiRef = useRef(null);
  const lastViolationRef = useRef(null);
  const violationTimeoutRef = useRef(null);

  // Load face detection libraries from CDN
  useEffect(() => {
    const loadFaceDetection = async () => {
      try {
        // Check if already loaded
        if (window.tf && window.cocoSsd) {
          faceapiRef.current = { tf: window.tf, cocoSsd: window.cocoSsd };
          modelsLoadedRef.current = true;
          setLoading(false);
          return;
        }

        // Load TensorFlow.js first
        const tfScript = document.createElement('script');
        tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0';
        tfScript.async = true;

        tfScript.onload = async () => {
          console.log('✅ TensorFlow.js loaded');

          // Load COCO-SSD for object detection (includes person/face detection)
          const cocoScript = document.createElement('script');
          cocoScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3';
          cocoScript.async = true;

          cocoScript.onload = async () => {
            console.log('✅ COCO-SSD loaded');
            
            try {
              if (!window.cocoSsd) {
                throw new Error('cocoSsd not available on window');
              }

              // Load the model
              console.log('📥 Loading COCO-SSD model...');
              const model = await window.cocoSsd.load();
              console.log('✅ COCO-SSD model loaded successfully');
              
              faceapiRef.current = { 
                tf: window.tf, 
                cocoSsd: window.cocoSsd,
                model: model
              };
              modelsLoadedRef.current = true;
              setLoading(false);
            } catch (err) {
              console.error('❌ Model loading error:', err);
              setError(`Model loading failed: ${err.message}`);
              setLoading(false);
            }
          };

          cocoScript.onerror = () => {
            console.error('❌ Failed to load COCO-SSD');
            setError('Failed to load face detection model');
            setLoading(false);
          };

          document.head.appendChild(cocoScript);
        };

        tfScript.onerror = () => {
          console.error('❌ Failed to load TensorFlow.js');
          setError('Failed to load TensorFlow library');
          setLoading(false);
        };

        document.head.appendChild(tfScript);
      } catch (err) {
        console.error('❌ Face detection init error:', err);
        setError('Face detection unavailable');
        setLoading(false);
      }
    };

    loadFaceDetection();
  }, []);

  // Initialize video stream
  useEffect(() => {
    const initializeVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, min: 320 },
            height: { ideal: 480, min: 240 },
            facingMode: 'user'
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          
          // ✅ Ensure video plays
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                playPromise.catch(err => {
                  console.warn('Video autoplay failed:', err);
                  // Retry with user gesture
                  setTimeout(() => {
                    videoRef.current?.play().catch(() => {
                      console.error('Video play failed');
                    });
                  }, 500);
                });
              }
            }
          };
        }

        setLoading(false);
        setError(null);
        console.log('✅ Video initialized');
      } catch (err) {
        console.error('Camera error:', err);
        setError(err.name === 'NotAllowedError' ? 'Camera permission denied' : 'Camera access failed');
        setLoading(false);
      }
    };

    initializeVideo();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start face detection when API is ready and video is loaded
  useEffect(() => {
    if (loading || !modelsLoadedRef.current || !faceapiRef.current) return;

    setDetectionStarted(true); // Mark detection as started
    let consecutiveNoFaceCount = 0; // Track consecutive frames without face

    const detectFaces = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      try {
        const { model } = faceapiRef.current;
        
        if (!model || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
          return;
        }

        // Set canvas dimensions to match video
        if (canvasRef.current.width !== videoRef.current.videoWidth) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }

        // Detect objects (persons) in video
        const predictions = await model.detect(videoRef.current);
        
        // Filter for 'person' class with moderate confidence (>40%)
        const personDetections = predictions.filter(p => p.class === 'person' && p.score > 0.4);

        // Get video dimensions for coverage calculation
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        const videoArea = videoWidth * videoHeight;

        // Check face coverage - face should cover at least 3% of screen
        const faceWithGoodCoverage = personDetections.filter(p => {
          const [x, y, width, height] = p.bbox;
          const faceArea = width * height;
          const coverage = (faceArea / videoArea) * 100;
          console.log(`📊 Detection: ${(coverage).toFixed(1)}% coverage, confidence: ${(p.score * 100).toFixed(1)}%`);
          return coverage > 3; // At least 3% of screen
        });

        // Clear canvas
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Violation detection with better logic
        if (faceWithGoodCoverage.length === 0) {
          consecutiveNoFaceCount++;
          
          // Trigger violation only after 2 consecutive frames without face (1 second)
          if (consecutiveNoFaceCount >= 2) {
            setFaceDetected(false);
            setViolationMessage('❌ Face Not Detected');
            
            const now = Date.now();
            if (!lastViolationRef.current || now - lastViolationRef.current > 3000) {
              console.log('❌ Violation: Face not detected');
              if (onViolation) {
                onViolation({
                  type: 'NO_FACE',
                  severity: 'major',
                  message: 'Face not detected - please look at camera'
                });
              }
              lastViolationRef.current = now;
            }

            // Draw warning box
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(10, 10, videoWidth - 20, videoHeight - 20);
            ctx.setLineDash([]);

            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 18px Arial';
            ctx.fillText('', videoWidth / 2 - 100, videoHeight / 2);
          }
        } else if (faceWithGoodCoverage.length === 1) {
          consecutiveNoFaceCount = 0; // Reset counter
          setFaceDetected(true);
          setViolationMessage(''); // Clear violation message
          lastViolationRef.current = null; // Clear violation tracker

          // Draw green box around detected face
          const [x, y, width, height] = faceWithGoodCoverage[0].bbox;
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);
          
          ctx.fillStyle = '#00ff00';
          ctx.font = 'bold 14px Arial';
          ctx.fillText(
            `✅ Face Detected (${(faceWithGoodCoverage[0].score * 100).toFixed(1)}%)`,
            x,
            y > 20 ? y - 10 : y + height + 20
          );
        } else if (faceWithGoodCoverage.length > 1) {
          consecutiveNoFaceCount = 0;
          setFaceDetected(false);
          setViolationMessage(`⚠️ Multiple People (${faceWithGoodCoverage.length})`);
          
          const now = Date.now();
          if (!lastViolationRef.current || now - lastViolationRef.current > 3000) {
            console.log(`❌ Violation: ${faceWithGoodCoverage.length} people detected`);
            if (onViolation) {
              onViolation({
                type: 'MULTIPLE_FACES',
                severity: 'critical',
                message: `Multiple people detected (${faceWithGoodCoverage.length})`
              });
            }
            lastViolationRef.current = now;
          }

          // Draw all detected faces with red boxes
          faceWithGoodCoverage.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(
              `Person (${(prediction.score * 100).toFixed(1)}%)`,
              x,
              y > 20 ? y - 10 : y + height + 20
            );
          });

          // Draw warning in center
          ctx.fillStyle = '#ff0000';
          ctx.font = 'bold 18px Arial';
          ctx.fillText(`⚠️ ${faceWithGoodCoverage.length} PEOPLE DETECTED`, videoWidth / 2 - 120, videoHeight / 2);
        }

      } catch (err) {
        console.error('Detection error:', err);
      }
    };

    // Run detection every 500ms
    detectionIntervalRef.current = setInterval(detectFaces, 500);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current);
      }
    };
  }, [loading, onViolation]);

  if (loading) {
    return <div className="p-4 text-center">🔄 Initializing camera...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">❌ {error}</div>;
  }

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: 'block' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />
      {/* Status indicator */}
      <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-2 rounded-lg text-white text-sm font-semibold">
        {violationMessage ? (
          <span style={{ color: violationMessage.includes('Not Detected') ? '#ef4444' : '#fbbf24' }}>
            {violationMessage}
          </span>
        ) : detectionStarted ? (
          faceDetected ? (
            <span style={{ color: '#10b981' }}></span>
          ) : (
            <span style={{ color: '#ef4444' }}></span>
          )
        ) : (
          <span style={{ color: '#9ca3af' }}>🔄 Loading...</span>
        )}
      </div>
    </div>
  );
}
