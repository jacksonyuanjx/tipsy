import argparse
import asyncio
import json
import logging
import os
import ssl
import uuid

import cv2
from aiohttp import web
import aiohttp_cors
from av import VideoFrame

from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaBlackhole, MediaPlayer, MediaRecorder

from labels import analyze_labels
from face import find_face
import time
# from pyimagesearch.motion_detection.singlemotiondetector import SingleMotionDetector
# import imutils

from google.cloud import storage


ROOT = os.path.dirname(__file__)

logger = logging.getLogger("pc")
pcs = set()

face_cascade = cv2.CascadeClassifier('./cascades/haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier('./cascades/haarcascade_eye.xml')
detector_params = cv2.SimpleBlobDetector_Params()
# detector_params.filterByArea = True
# detector_params.maxArea = 1500
# detector_params.filterByArea = False
# detector_params.filterByInertia = False
# detector_params.filterByConvexity = False
# detector_params.minInertiaRatio = 0.05
# detector_params.minConvexity = .60
detector_params.filterByArea = True;
detector_params.minArea = 10;
detector_params.maxArea = 300;
detector_params.filterByColor = True;
detector_params.blobColor = 0; # 0 for dark blobs & 255 for light blobs
detector = cv2.SimpleBlobDetector_create(detector_params)


from gcpBucketHelper import upload_blob


def detect_faces(img, cascade):
    gray_frame = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    coords = cascade.detectMultiScale(gray_frame, 1.3, 5)
    if len(coords) > 1:
        biggest = (0, 0, 0, 0)
        for i in coords:
            if i[3] > biggest[3]:
                biggest = i
        biggest = np.array([i], np.int32)
    elif len(coords) == 1:
        biggest = coords
    else:
        return None
    for (x, y, w, h) in biggest:
        frame = img[y:y + h, x:x + w]
    return frame


def detect_eyes(img, cascade):
    gray_frame = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    eyes = cascade.detectMultiScale(gray_frame, 1.3, 5)  # detect eyes
    width = np.size(img, 1)  # get face frame width
    height = np.size(img, 0)  # get face frame height
    left_eye = None
    right_eye = None
    for (x, y, w, h) in eyes:
        if y > height / 2:
            pass
        eyecenter = x + w / 2  # get the eye center
        if eyecenter < width * 0.5:
            left_eye = img[y:y + h, x:x + w]
        else:
            right_eye = img[y:y + h, x:x + w]
    return left_eye, right_eye


def cut_eyebrows(img):
    height, width = img.shape[:2]
    eyebrow_h = int(height / 4)
    img = img[eyebrow_h:height, 0:width]  # cut eyebrows out (15 px)

    return img


def blob_process(img, threshold, detector):
	gray_frame = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
	# _, img = cv2.threshold(gray_frame, threshold, 255, cv2.THRESH_BINARY)
	_, img = cv2.threshold(gray_frame, threshold, 255, cv2.THRESH_TOZERO)
	# img = cv2.adaptiveThreshold(gray_frame, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
	img = cv2.erode(img, None, iterations=2)
	img = cv2.dilate(img, None, iterations=4)
	img = cv2.medianBlur(img, 5)
	keypoints = detector.detect(img)
	print(keypoints)
	for kp in keypoints:
		print("X coord: ", kp.pt[0])
		print("Y coord: ", kp.pt[1])
		print("Size: ", kp.size)
		print("Response (strength): ", kp.response) # FIXME: always 0.0 for some reason?
	return keypoints


# prepare for video outputing
os.system('mkdir -p videos')
video_out = None
next_command = None

def start_record():
    global video_out
    global next_command
    video_out = cv2.VideoWriter('videos/processed.mp4', cv2.VideoWriter_fourcc(*'MP4V'), 20.0, (640,480))
    next_command = None

def stop_record():
    global video_out
    global next_command
    video_out.release()
    next_command = None
    print("attempting to upload video to GCP Bucket")
    upload_blob("testnwhacks", "videos/processed.mp4", "testVideo2.mp4")
    print("video has been uploaded")
    analyze_labels("gs://testnwhacks/testVideo2.mp4")
    print("ANALYSIS COMPLETE")


class VideoTransformTrack(MediaStreamTrack):
    """
    A video stream track that transforms frames from an another track.
    """

    kind = "video"

    def __init__(self, track, transform):
        super().__init__()  # don't forget this!
        self.track = track
        self.transform = transform

    async def recv(self):
        global video_out
        global next_command

        frame = await self.track.recv()

        if self.transform == "edges":
            # perform edge detection
            img = frame.to_ndarray(format="bgr24")
            # img = cv2.cvtColor(cv2.Canny(img, 100, 200), cv2.COLOR_GRAY2BGR)

            # save to file
            if next_command is not None:
                if next_command == 'START_RECORD':
                    start_record()
                if next_command == 'STOP_RECORD':
                    stop_record()
            
            if video_out is not None:
                video_out.write(img)

            # rebuild a VideoFrame, preserving timing information
            new_frame = VideoFrame.from_ndarray(img, format="bgr24")
            new_frame.pts = frame.pts
            new_frame.time_base = frame.time_base
            return new_frame
        elif self.transform == "tipsy":
            # todo
            frame = imutils.resize(frame, width=400)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (7, 7), 0)

            face_frame = detect_faces(frame, face_cascade)
            if face_frame is not None:
                eyes = detect_eyes(face_frame, eye_cascade)
                for eye in eyes:
                    if eye is not None:
                        # threshold = r = cv2.getTrackbarPos('threshold', 'image')
                        eye = cut_eyebrows(eye)
                        keypoints = blob_process(eye, 50, detector)
                        eye = cv2.drawKeypoints(eye, keypoints, eye, (0, 0, 255), cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
                        return eye;
        elif self.transform == "face":
            img = frame.to_ndarray(format="bgr24")
            find_face(img)
        elif self.transform == "rotate":
            # rotate image
            img = frame.to_ndarray(format="bgr24")
            rows, cols, _ = img.shape
            M = cv2.getRotationMatrix2D((cols / 2, rows / 2), frame.time * 45, 1)
            img = cv2.warpAffine(img, M, (cols, rows))

            # rebuild a VideoFrame, preserving timing information
            new_frame = VideoFrame.from_ndarray(img, format="bgr24")
            new_frame.pts = frame.pts
            new_frame.time_base = frame.time_base
            return new_frame
        else:
            return frame

async def command(request):
    global next_command
    params = await request.json()
    print(params)
    next_command = params['command']

async def offer(request):
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    pc_id = "PeerConnection(%s)" % uuid.uuid4()
    pcs.add(pc)

    def log_info(msg, *args):
        logger.info(pc_id + " " + msg, *args)

    log_info("Created for %s", request.remote)

    if args.write_audio:
        recorder = MediaRecorder(args.write_audio)
    else:
        recorder = MediaBlackhole()

    @pc.on("datachannel")
    def on_datachannel(channel):
        @channel.on("message")
        def on_message(message):
            if isinstance(message, str) and message.startswith("ping"):
                channel.send("pong" + message[4:])

    @pc.on("iceconnectionstatechange")
    async def on_iceconnectionstatechange():
        log_info("ICE connection state is %s", pc.iceConnectionState)
        if pc.iceConnectionState == "failed":
            await pc.close()
            pcs.discard(pc)

    @pc.on("track")
    def on_track(track):
        log_info("Track %s received", track.kind)

        if track.kind == "video":
            local_video = VideoTransformTrack(
                track, transform=params["video_transform"]
            )
            pc.addTrack(local_video)

        @track.on("ended")
        async def on_ended():
            log_info("Track %s ended", track.kind)
            await recorder.stop()

    # handle offer
    await pc.setRemoteDescription(offer)
    await recorder.start()

    # send answer
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return web.Response(
        content_type="application/json",
        text=json.dumps(
            {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
        ),
    )


async def on_shutdown(app):
    # close peer connections
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="WebRTC audio / video / data-channels demo"
    )
    parser.add_argument("--cert-file", help="SSL certificate file (for HTTPS)")
    parser.add_argument("--key-file", help="SSL key file (for HTTPS)")
    parser.add_argument(
        "--port", type=int, default=8080, help="Port for HTTP server (default: 8080)"
    )
    parser.add_argument("--verbose", "-v", action="count")
    parser.add_argument("--write-audio", help="Write received audio to a file")
    args = parser.parse_args()

    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)

    if args.cert_file:
        ssl_context = ssl.SSLContext()
        ssl_context.load_cert_chain(args.cert_file, args.key_file)
    else:
        ssl_context = None

    app = web.Application()
    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
        )
    })
    cors.add(app.router.add_post("/offer", offer))
    cors.add(app.router.add_post("/command", command))

    app.on_shutdown.append(on_shutdown)
    web.run_app(app, access_log=None, port=args.port, ssl_context=ssl_context)
