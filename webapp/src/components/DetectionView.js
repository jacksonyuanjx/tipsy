import React, { useState, useCallback, useRef } from 'react';
import MediaCapturer from 'react-multimedia-capture';

var pc = null;

function sdpFilterCodec(kind, codec, realSdp) {
  var allowed = []
  var rtxRegex = new RegExp('a=fmtp:(\\d+) apt=(\\d+)\r$');
  var codecRegex = new RegExp('a=rtpmap:([0-9]+) ' + escapeRegExp(codec))
  var videoRegex = new RegExp('(m=' + kind + ' .*?)( ([0-9]+))*\\s*$')

  var lines = realSdp.split('\n');

  var isKind = false;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('m=' + kind + ' ')) {
      isKind = true;
    } else if (lines[i].startsWith('m=')) {
      isKind = false;
    }

    if (isKind) {
      var match = lines[i].match(codecRegex);
      if (match) {
        allowed.push(parseInt(match[1]));
      }

      match = lines[i].match(rtxRegex);
      if (match && allowed.includes(parseInt(match[2]))) {
        allowed.push(parseInt(match[1]));
      }
    }
  }

  var skipRegex = 'a=(fmtp|rtcp-fb|rtpmap):([0-9]+)';
  var sdp = '';

  isKind = false;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('m=' + kind + ' ')) {
      isKind = true;
    } else if (lines[i].startsWith('m=')) {
      isKind = false;
    }

    if (isKind) {
      var skipMatch = lines[i].match(skipRegex);
      if (skipMatch && !allowed.includes(parseInt(skipMatch[2]))) {
        continue;
      } else if (lines[i].match(videoRegex)) {
        sdp += lines[i].replace(videoRegex, '$1 ' + allowed.join(' ')) + '\n';
      } else {
        sdp += lines[i] + '\n';
      }
    } else {
      sdp += lines[i] + '\n';
    }
  }

  return sdp;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export default function DetectionView() {
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

      return fetch('http://localhost:8080/offer', {
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
            <h6>Original</h6>
            <video ref={videoRef} autoPlay></video>
            <h6>Received</h6>
            <video ref={receivedVideoRef} autoPlay></video>
            <hr />
            <button onClick={start}>Start</button>
            <button onClick={stop}>Stop</button>
          </div>
        } />
    </div>
  )
}