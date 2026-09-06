import React, {
  useRef,
  useEffect,
  useState,
} from 'react';

export function FaceDetectionMonitor({ onViolation }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [faceDetected, setFaceDetected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [violationMessage, setViolationMessage] =
    useState('');
  const [detectionStarted, setDetectionStarted] =
    useState(false);

  const detectionIntervalRef = useRef(null);
  const modelsLoadedRef = useRef(false);
  const faceapiRef = useRef(null);
  const lastViolationRef = useRef(null);
  const violationTimeoutRef = useRef(null);

  // =====================================================
  // LOAD FACE DETECTION LIBRARIES
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const loadFaceDetection = async () => {
      try {
        // =================================================
        // CHECK IF LIBRARIES ARE ALREADY LOADED
        // =================================================

        if (window.tf && window.cocoSsd) {
          console.log(
            '✅ TensorFlow.js and COCO-SSD already loaded'
          );

          try {
            const model =
              await window.cocoSsd.load();

            if (!mounted) return;

            faceapiRef.current = {
              tf: window.tf,
              cocoSsd: window.cocoSsd,
              model,
            };

            modelsLoadedRef.current = true;

            setError(null);
            setLoading(false);

            console.log(
              '✅ COCO-SSD model loaded successfully'
            );
          } catch (err) {
            console.error(
              '❌ Model loading error:',
              err
            );

            if (!mounted) return;

            const message =
              err?.message ||
              'Model loading failed';

            setError(String(message));
            setLoading(false);
          }

          return;
        }

        // =================================================
        // LOAD TENSORFLOW.JS
        // =================================================

        const tfScript =
          document.createElement('script');

        tfScript.src =
          'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0';

        tfScript.async = true;

        tfScript.onload = () => {
          if (!mounted) return;

          console.log(
            '✅ TensorFlow.js loaded'
          );

          // ===============================================
          // LOAD COCO-SSD
          // ===============================================

          const cocoScript =
            document.createElement('script');

          cocoScript.src =
            'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3';

          cocoScript.async = true;

          cocoScript.onload = async () => {
            if (!mounted) return;

            console.log(
              '✅ COCO-SSD loaded'
            );

            try {
              if (!window.cocoSsd) {
                throw new Error(
                  'COCO-SSD is not available'
                );
              }

              console.log(
                '📥 Loading COCO-SSD model...'
              );

              const model =
                await window.cocoSsd.load();

              if (!mounted) return;

              console.log(
                '✅ COCO-SSD model loaded successfully'
              );

              faceapiRef.current = {
                tf: window.tf,
                cocoSsd: window.cocoSsd,
                model,
              };

              modelsLoadedRef.current = true;

              setError(null);
              setLoading(false);
            } catch (err) {
              console.error(
                '❌ Model loading error:',
                err
              );

              if (!mounted) return;

              const message =
                err?.message ||
                'Model loading failed';

              setError(String(message));
              setLoading(false);
            }
          };

          cocoScript.onerror = () => {
            console.error(
              '❌ Failed to load COCO-SSD'
            );

            if (!mounted) return;

            setError(
              'Failed to load face detection model'
            );

            setLoading(false);
          };

          document.head.appendChild(
            cocoScript
          );
        };

        tfScript.onerror = () => {
          console.error(
            '❌ Failed to load TensorFlow.js'
          );

          if (!mounted) return;

          setError(
            'Failed to load TensorFlow library'
          );

          setLoading(false);
        };

        document.head.appendChild(tfScript);
      } catch (err) {
        console.error(
          '❌ Face detection init error:',
          err
        );

        if (!mounted) return;

        const message =
          err?.message ||
          'Face detection unavailable';

        setError(String(message));
        setLoading(false);
      }
    };

    loadFaceDetection();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // INITIALIZE VIDEO STREAM
  // =====================================================

  useEffect(() => {
    let mounted = true;
    let stream = null;

    const initializeVideo = async () => {
      try {
        // Check browser support
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            'Camera access is not supported by this browser'
          );
        }

        console.log(
          '📷 Requesting camera permission...'
        );

        stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: {
                ideal: 640,
                min: 320,
              },
              height: {
                ideal: 480,
                min: 240,
              },
              facingMode: 'user',
            },
            audio: false,
          });

        if (!mounted) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          videoRef.current.muted = true;
          videoRef.current.playsInline = true;

          // ===============================================
          // ENSURE VIDEO PLAYS
          // ===============================================

          videoRef.current.onloadedmetadata =
            () => {
              if (!videoRef.current) return;

              const playPromise =
                videoRef.current.play();

              if (
                playPromise !== undefined
              ) {
                playPromise.catch(
                  (err) => {
                    console.warn(
                      'Video autoplay failed:',
                      err
                    );

                    // Retry
                    setTimeout(() => {
                      if (
                        videoRef.current
                      ) {
                        videoRef.current
                          .play()
                          .catch(
                            (playErr) => {
                              console.error(
                                'Video play failed:',
                                playErr
                              );
                            }
                          );
                      }
                    }, 500);
                  }
                );
              }
            };
        }

        setError(null);
        setLoading(false);

        console.log(
          '✅ Video initialized'
        );
      } catch (err) {
        console.error(
          '❌ Camera error:',
          err
        );

        if (!mounted) return;

        let message =
          'Camera access failed';

        if (
          err?.name ===
          'NotAllowedError'
        ) {
          message =
            'Camera permission denied';
        } else if (
          err?.name ===
          'NotFoundError'
        ) {
          message =
            'No camera found';
        } else if (
          err?.name ===
          'NotReadableError'
        ) {
          message =
            'Camera is already in use';
        } else if (err?.message) {
          message = err.message;
        }

        setError(String(message));
        setLoading(false);
      }
    };

    initializeVideo();

    // =====================================================
    // CLEANUP CAMERA
    // =====================================================

    return () => {
      mounted = false;

      if (stream) {
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }

      if (
        videoRef.current &&
        videoRef.current.srcObject
      ) {
        videoRef.current.srcObject
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        videoRef.current.srcObject =
          null;
      }
    };
  }, []);

  // =====================================================
  // FACE DETECTION
  // =====================================================

  useEffect(() => {
    if (
      loading ||
      !modelsLoadedRef.current ||
      !faceapiRef.current
    ) {
      return;
    }

    if (
      !videoRef.current ||
      !canvasRef.current
    ) {
      return;
    }

    setDetectionStarted(true);

    let consecutiveNoFaceCount = 0;
    let mounted = true;
    let detecting = false;

    // =====================================================
    // DETECT OBJECTS / PERSON
    // =====================================================

    const detectFaces = async () => {
      if (!mounted || detecting) {
        return;
      }

      if (
        !videoRef.current ||
        !canvasRef.current
      ) {
        return;
      }

      try {
        detecting = true;

        const model =
          faceapiRef.current?.model;

        if (!model) {
          return;
        }

        // Video should have enough data
        if (
          videoRef.current.readyState !==
          videoRef.current
            .HAVE_ENOUGH_DATA
        ) {
          return;
        }

        const videoWidth =
          videoRef.current.videoWidth;

        const videoHeight =
          videoRef.current.videoHeight;

        if (
          !videoWidth ||
          !videoHeight
        ) {
          return;
        }

        // =================================================
        // SET CANVAS SIZE
        // =================================================

        if (
          canvasRef.current.width !==
          videoWidth
        ) {
          canvasRef.current.width =
            videoWidth;

          canvasRef.current.height =
            videoHeight;
        }

        // =================================================
        // RUN DETECTION
        // =================================================

        const predictions =
          await model.detect(
            videoRef.current
          );

        if (!mounted) {
          return;
        }

        // =================================================
        // FILTER PERSON
        // =================================================

        const personDetections =
          Array.isArray(predictions)
            ? predictions.filter(
                (prediction) =>
                  prediction?.class ===
                    'person' &&
                  typeof prediction?.score ===
                    'number' &&
                  prediction.score > 0.4 &&
                  Array.isArray(
                    prediction?.bbox
                  ) &&
                  prediction.bbox.length >=
                    4
              )
            : [];

        const videoArea =
          videoWidth * videoHeight;

        if (videoArea <= 0) {
          return;
        }

        // =================================================
        // CHECK COVERAGE
        // =================================================

        const faceWithGoodCoverage =
          personDetections.filter(
            (prediction) => {
              const [
                x,
                y,
                width,
                height,
              ] = prediction.bbox;

              if (
                width <= 0 ||
                height <= 0
              ) {
                return false;
              }

              const faceArea =
                width * height;

              const coverage =
                (faceArea /
                  videoArea) *
                100;

              console.log(
                `📊 Detection: ${coverage.toFixed(
                  1
                )}% coverage, confidence: ${(
                  prediction.score * 100
                ).toFixed(1)}%`
              );

              return coverage > 3;
            }
          );

        // =================================================
        // CANVAS
        // =================================================

        const ctx =
          canvasRef.current.getContext(
            '2d'
          );

        if (!ctx) {
          return;
        }

        ctx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        // =================================================
        // NO FACE
        // =================================================

        if (
          faceWithGoodCoverage.length ===
          0
        ) {
          consecutiveNoFaceCount++;

          // Trigger only after 2 frames
          if (
            consecutiveNoFaceCount >= 2
          ) {
            setFaceDetected(false);

            setViolationMessage(
              '❌ Face Not Detected'
            );

            const now = Date.now();

            if (
              !lastViolationRef.current ||
              now -
                lastViolationRef.current >
                3000
            ) {
              console.log(
                '❌ Violation: Face not detected'
              );

              if (
                typeof onViolation ===
                'function'
              ) {
                onViolation({
                  type: 'NO_FACE',
                  severity: 'major',
                  message:
                    'Face not detected - please look at camera',
                });
              }

              lastViolationRef.current =
                now;
            }

            // Draw warning border
            ctx.strokeStyle =
              '#ff0000';

            ctx.lineWidth = 2;

            ctx.setLineDash([
              5,
              5,
            ]);

            ctx.strokeRect(
              10,
              10,
              Math.max(
                0,
                videoWidth - 20
              ),
              Math.max(
                0,
                videoHeight - 20
              )
            );

            ctx.setLineDash([]);

            ctx.fillStyle =
              '#ff0000';

            ctx.font =
              'bold 18px Arial';

            ctx.textAlign = 'center';

            ctx.fillText(
              'Face Not Detected',
              videoWidth / 2,
              videoHeight / 2
            );

            ctx.textAlign = 'start';
          }
        }

        // =================================================
        // ONE PERSON
        // =================================================

        else if (
          faceWithGoodCoverage.length ===
          1
        ) {
          consecutiveNoFaceCount = 0;

          setFaceDetected(true);
          setViolationMessage('');

          lastViolationRef.current =
            null;

          const [
            x,
            y,
            width,
            height,
          ] =
            faceWithGoodCoverage[0]
              .bbox;

          // Green detection box
          ctx.strokeStyle =
            '#00ff00';

          ctx.lineWidth = 3;

          ctx.strokeRect(
            x,
            y,
            width,
            height
          );

          ctx.fillStyle =
            '#00ff00';

          ctx.font =
            'bold 14px Arial';

          ctx.fillText(
            `✅ Face Detected (${(
              faceWithGoodCoverage[0]
                .score * 100
            ).toFixed(1)}%)`,
            x,
            y > 20
              ? y - 10
              : y + height + 20
          );
        }

        // =================================================
        // MULTIPLE PEOPLE
        // =================================================

        else if (
          faceWithGoodCoverage.length >
          1
        ) {
          consecutiveNoFaceCount = 0;

          setFaceDetected(false);

          setViolationMessage(
            `⚠️ Multiple People (${faceWithGoodCoverage.length})`
          );

          const now = Date.now();

          if (
            !lastViolationRef.current ||
            now -
              lastViolationRef.current >
              3000
          ) {
            console.log(
              `❌ Violation: ${faceWithGoodCoverage.length} people detected`
            );

            if (
              typeof onViolation ===
              'function'
            ) {
              onViolation({
                type: 'MULTIPLE_FACES',
                severity: 'critical',
                message: `Multiple people detected (${faceWithGoodCoverage.length})`,
              });
            }

            lastViolationRef.current =
              now;
          }

          // Draw boxes
          faceWithGoodCoverage.forEach(
            (prediction) => {
              const [
                x,
                y,
                width,
                height,
              ] = prediction.bbox;

              ctx.strokeStyle =
                '#ff0000';

              ctx.lineWidth = 3;

              ctx.strokeRect(
                x,
                y,
                width,
                height
              );

              ctx.fillStyle =
                '#ff0000';

              ctx.font =
                'bold 14px Arial';

              ctx.fillText(
                `Person (${(
                  prediction.score *
                  100
                ).toFixed(1)}%)`,
                x,
                y > 20
                  ? y - 10
                  : y + height + 20
              );
            }
          );

          // Warning text
          ctx.fillStyle =
            '#ff0000';

          ctx.font =
            'bold 18px Arial';

          ctx.textAlign = 'center';

          ctx.fillText(
            `⚠️ ${faceWithGoodCoverage.length} PEOPLE DETECTED`,
            videoWidth / 2,
            videoHeight / 2
          );

          ctx.textAlign = 'start';
        }
      } catch (err) {
        console.error(
          '❌ Detection error:',
          err
        );

        // Don't crash React if detection
        // library throws an Error object.
        if (
          mounted &&
          err?.message
        ) {
          console.warn(
            'Detection message:',
            String(err.message)
          );
        }
      } finally {
        detecting = false;
      }
    };

    // =====================================================
    // RUN EVERY 500ms
    // =====================================================

    detectionIntervalRef.current =
      setInterval(
        detectFaces,
        500
      );

    // Initial detection
    detectFaces();

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      mounted = false;

      if (
        detectionIntervalRef.current
      ) {
        clearInterval(
          detectionIntervalRef.current
        );

        detectionIntervalRef.current =
          null;
      }

      if (
        violationTimeoutRef.current
      ) {
        clearTimeout(
          violationTimeoutRef.current
        );

        violationTimeoutRef.current =
          null;
      }
    };
  }, [loading, onViolation]);

  // =====================================================
  // LOADING UI
  // =====================================================

  if (loading) {
    return (
      <div className="p-4 text-center">
        🔄 Initializing camera...
      </div>
    );
  }

  // =====================================================
  // ERROR UI
  // =====================================================

  if (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    return (
      <div className="p-4 text-center text-red-500">
        ❌ {errorMessage}
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          display: 'block',
        }}
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          display: 'block',
        }}
      />

      {/* STATUS INDICATOR */}

      <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-2 rounded-lg text-white text-sm font-semibold">
        {violationMessage ? (
          <span
            style={{
              color:
                violationMessage.includes(
                  'Not Detected'
                )
                  ? '#ef4444'
                  : '#fbbf24',
            }}
          >
            {String(violationMessage)}
          </span>
        ) : detectionStarted ? (
          faceDetected ? (
            <span
              style={{
                color: '#10b981',
              }}
            >
              ✅ Face Detected
            </span>
          ) : (
            <span
              style={{
                color: '#ef4444',
              }}
            >
              ⚠️ Face Not Detected
            </span>
          )
        ) : (
          <span
            style={{
              color: '#9ca3af',
            }}
          >
            🔄 Loading...
          </span>
        )}
      </div>
    </div>
  );
}

export default FaceDetectionMonitor;
