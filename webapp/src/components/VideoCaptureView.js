import React, { useState, useCallback, useRef } from 'react';
import MediaCapturer from 'react-multimedia-capture';
import styled from 'styled-components';
import { PushSpinner } from "react-spinners-kit";

var pc = null;

const Styles = styled.div`
position: relative;
height: 100%;
> * {
  height: 100%;
}
.video-wrapper {
  height: 100%;
  background: #000;
  .spinner {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%);
    z-index: 0;
  }
  .raw-video {
    position: absolute;
    left: 1rem;
    bottom: 1rem;
    width: 20%;
    z-index: 3;
  }
  .processed-video {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
  }
  .status-label {
    position: absolute;
    right: 1rem;
    top: 1rem;
    color: #000;
    background: rgba(255, 255, 255, 0.7);
    border-color: #000;
    border-width: 1px;
    border-style: solid;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    border-radius: 0.3rem;
    z-index: 3;
  }
}
`;

export default function VideoCaptureView() {
  const [recording, setRecording] = useState(false);

  const videoRef = useRef();
  const receivedVideoRef = useRef();

  const setStreamToVideo = useCallback((stream) => {
    videoRef.current.srcObject = stream;
  }, []);

  const releaseStreamFromVideo = useCallback(() => {
    videoRef.current.src = '';
  }, []);

  const createPeerConnection = useCallback(() => {
    var config = {
      sdpSemantics: 'unified-plan'
    };

    const _pc = new RTCPeerConnection(config);

    // register some listeners to help debugging
    _pc.addEventListener('icegatheringstatechange', function () {
      console.log('icegatheringstatechange', _pc.iceGatheringState);
    }, false);

    _pc.addEventListener('iceconnectionstatechange', function () {
      console.log('iceconnectionstatechange', _pc.iceConnectionState);
    }, false);

    _pc.addEventListener('signalingstatechange', function () {
      console.log('signalingstatechange', _pc.signalingState);
    }, false);

    // connect audio / video
    _pc.addEventListener('track', function (evt) {
      if (evt.track.kind === 'video')
        receivedVideoRef.current.srcObject = evt.streams[0];
      else
        receivedVideoRef.current.srcObject = evt.streams[0];
    });

    return _pc;
  }, []);

  const negotiate = useCallback(() => {
    return pc.createOffer().then(function (offer) {
      return pc.setLocalDescription(offer);
    }).then(function () {
      // wait for ICE gathering to complete
      return new Promise(function (resolve) {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          function checkState() {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          }
          pc.addEventListener('icegatheringstatechange', checkState);
        }
      });
    }).then(function () {
      var offer = pc.localDescription;

      return fetch('http://34.83.245.238:8080/offer', {
        body: JSON.stringify({
          sdp: offer.sdp,
          type: offer.type,
          video_transform: 'edges'
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      });
    }).then(function (response) {
      return response.json();
    }).then(function (answer) {
      return pc.setRemoteDescription(answer);
    }).catch(function (e) {
      console.error(e);
    });
  }, []);

  const handleStart = useCallback(stream => {
    setRecording(true);
    setStreamToVideo(stream);
    pc = createPeerConnection();
    stream.getTracks().forEach(function (track) {
      pc.addTrack(track, stream);
    });
    return negotiate();
  }, [setStreamToVideo, createPeerConnection, negotiate]);

  const handleStop = useCallback(() => {
    setRecording(false);
    releaseStreamFromVideo();
  }, [releaseStreamFromVideo]);

  return (
    <Styles>
      <MediaCapturer
        constraints={{ audio: false, video: true }}
        timeSlice={10}
        onStart={handleStart}
        onStop={handleStop}
        render={({ start }) => {
          if (!recording) {
            start();
          }
          return (
            <div className='video-wrapper'>
              {recording && <span className='status-label'>Recording video</span>}
              <div className='spinner'>
                <PushSpinner size={30} />
              </div>
              <video className='raw-video' ref={videoRef} autoPlay></video>
              <video className='processed-video' ref={receivedVideoRef} autoPlay></video>
            </div>
          )
        }} />
    </Styles>
  )
}