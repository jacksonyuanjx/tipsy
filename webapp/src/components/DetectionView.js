import React, { useEffect, useState, useCallback, useRef } from 'react';
import MediaCapturer from 'react-multimedia-capture';

export default function DetectionView() {

  const [recording, setRecording] = useState(false);

  const videoRef = useRef();

  const setStreamToVideo = useCallback((stream) => {
    videoRef.current.srcObject = stream;
  }, []);

  const releaseStreamFromVideo = useCallback(() => {
    videoRef.current.src = '';
  }, []);

  const handleStart = useCallback(stream => {
    setRecording(true);
    setStreamToVideo(stream)
  }, [setStreamToVideo]);

  const handleStop = useCallback(() => {
    setRecording(false);
    releaseStreamFromVideo();
  }, [releaseStreamFromVideo]);

  return (
    <div>
      {recording && <span>Recording video</span>}
      <MediaCapturer
        constraints={{ audio: false, video: true }}
        timeSlice={10}
        onStart={handleStart}
        onStop={handleStop}
        // onPause={this.handlePause}
        // onResume={this.handleResume}
        // onError={this.handleError}
        // onStreamClosed={this.handleStreamClose}
        render={({ request, start, stop, pause, resume }) =>
          <div>
            <video ref={videoRef} autoPlay></video>
            <hr />
            <button onClick={start}>Start</button>
            <button onClick={stop}>Stop</button>
          </div>
        } />
    </div>
  )
}