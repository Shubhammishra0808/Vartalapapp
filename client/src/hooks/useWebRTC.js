import { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useWebRTC = (currentUser) => {
  const { socket } = useSocket();
  const [activeCall, setActiveCall] = useState(null); // { callId, peerUser, type, status, isCaller }
  const [incomingCall, setIncomingCall] = useState(null); // { callId, caller, type, offer }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnectionRef = useRef(null);
  const durationTimerRef = useRef(null);

  const cleanupCall = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    setRemoteStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setCallDuration(0);

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, [localStream]);

  // Create peer connection and bind events
  const createPeerConnection = useCallback((targetUserId, callId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice_candidate', {
          callId,
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanupCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, cleanupCall]);

  // Listen to socket calling events
  useEffect(() => {
    if (!socket) return;

    // Incoming Call
    socket.on('call:incoming', ({ callId, caller, type, offer }) => {
      setIncomingCall({ callId, caller, type, offer });
    });

    // Call Accepted
    socket.on('call:accepted', async ({ callId, answer }) => {
      if (peerConnectionRef.current && answer) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setActiveCall((prev) => prev ? { ...prev, status: 'connected' } : null);

        // Start call duration timer
        durationTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
    });

    // Call Rejected
    socket.on('call:rejected', ({ reason }) => {
      alert(`Call declined: ${reason}`);
      cleanupCall();
    });

    // ICE Candidate
    socket.on('call:ice_candidate', async ({ candidate }) => {
      try {
        if (peerConnectionRef.current && candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        console.error('Error adding received ice candidate', e);
      }
    });

    // Call Ended by Remote
    socket.on('call:ended', () => {
      cleanupCall();
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:ice_candidate');
      socket.off('call:ended');
    };
  }, [socket, cleanupCall]);

  // Start outgoing call
  const startCall = async (recipient, type = 'voice') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });

      setLocalStream(stream);

      const pc = createPeerConnection(recipient._id, 'pending');
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call:initiate', {
        recipientId: recipient._id,
        type,
        offer,
      });

      setActiveCall({
        peerUser: recipient,
        type,
        status: 'calling',
        isCaller: true,
      });
    } catch (err) {
      console.error('Could not access media devices', err);
      alert('Unable to access camera or microphone.');
    }
  };

  // Answer incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.type === 'video',
      });

      setLocalStream(stream);

      const pc = createPeerConnection(incomingCall.caller._id, incomingCall.callId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:accept', {
        callId: incomingCall.callId,
        callerId: incomingCall.caller._id,
        answer,
      });

      setActiveCall({
        callId: incomingCall.callId,
        peerUser: incomingCall.caller,
        type: incomingCall.type,
        status: 'connected',
        isCaller: false,
      });

      setIncomingCall(null);

      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error answering call', err);
      rejectCall();
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit('call:reject', {
        callId: incomingCall.callId,
        callerId: incomingCall.caller._id,
      });
    }
    setIncomingCall(null);
  };

  // Hangup call
  const endCall = () => {
    if (activeCall && socket) {
      socket.emit('call:end', {
        callId: activeCall.callId,
        targetUserId: activeCall.peerUser?._id,
        duration: callDuration,
      });
    }
    cleanupCall();
  };

  // Toggle microphone
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle camera
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find((s) => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (e) {
        console.error('Error sharing screen', e);
      }
    } else {
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (peerConnectionRef.current && videoTrack) {
          const sender = peerConnectionRef.current.getSenders().find((s) => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
      }
      setIsScreenSharing(false);
    }
  };

  return {
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    callDuration,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  };
};
