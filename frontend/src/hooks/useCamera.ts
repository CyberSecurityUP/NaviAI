'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  photoBlob: Blob | null;
  photoUrl: string | null;
  isActive: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  takePhoto: () => void;
  retake: () => void;
  stopCamera: () => void;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const streamRef = useRef<MediaStream | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up object URL when it changes
  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('camera_not_supported');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
    } catch (err) {
      const mediaError = err as DOMException;
      if (
        mediaError.name === 'NotAllowedError' ||
        mediaError.name === 'PermissionDeniedError'
      ) {
        setError('permission_denied');
      } else if (
        mediaError.name === 'NotFoundError' ||
        mediaError.name === 'DevicesNotFoundError'
      ) {
        setError('no_camera');
      } else {
        setError('camera_error');
      }
      setIsActive(false);
    }
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !isActive) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Revoke previous URL if any
          if (photoUrl) {
            URL.revokeObjectURL(photoUrl);
          }

          const url = URL.createObjectURL(blob);
          setPhotoBlob(blob);
          setPhotoUrl(url);
        }
      },
      'image/jpeg',
      0.85
    );
  }, [isActive, photoUrl]);

  const retake = useCallback(() => {
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }
    setPhotoBlob(null);
    setPhotoUrl(null);
  }, [photoUrl]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
  }, []);

  return {
    videoRef,
    photoBlob,
    photoUrl,
    isActive,
    error,
    startCamera,
    takePhoto,
    retake,
    stopCamera,
  };
}
