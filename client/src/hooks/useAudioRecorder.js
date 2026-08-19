import { useState, useRef } from 'react';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      clearInterval(timerRef.current);

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop all tracks
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setRecordingDuration(0);
        resolve({ blob: audioBlob, duration: recordingDuration });
      };

      mediaRecorderRef.current.stop();
    });
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      clearInterval(timerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setRecordingDuration(0);
      audioChunksRef.current = [];
    }
  };

  return { isRecording, recordingDuration, startRecording, stopRecording, cancelRecording };
};
