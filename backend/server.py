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

# def detect_motion(frameCount):
# 	# grab global references to the video stream, output frame, and
# 	# lock variables
#     # global vs, outputFrame, lock
 
# 	# initialize the motion detector and the total number of frames
# 	# read thus far
#     md = SingleMotionDetector(accumWeight=0.1)
#     # total = 0

#     # loop over frames from the video stream
#     while True:
# 		# read the next frame from the video stream, resize it,
# 		# convert the frame to grayscale, and blur it
#         frame = vs.read()
#         frame = imutils.resize(frame, width=400)
#         gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
#         gray = cv2.GaussianBlur(gray, (7, 7), 0)
 
# 		# # grab the current timestamp and draw it on the frame
# 		# timestamp = datetime.datetime.now()
# 		# cv2.putText(frame, timestamp.strftime(
# 		# 	"%A %d %B %Y %I:%M:%S%p"), (10, frame.shape[0] - 10),
# 		# 	cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 255), 1)
        
#         # # if the total number of frames has reached a sufficient
# 		# # number to construct a reasonable background model, then
# 		# # continue to process the frame
# 		# if total > frameCount:
# 		# 	# detect motion in the image
# 		# 	motion = md.detect(gray)
 
# 		# 	# check to see if motion was found in the frame
# 		# 	if motion is not None:
# 		# 		# unpack the tuple and draw the box surrounding the
# 		# 		# "motion area" on the output frame
# 		# 		(thresh, (minX, minY, maxX, maxY)) = motion
# 		# 		cv2.rectangle(frame, (minX, minY), (maxX, maxY),
# 		# 			(0, 0, 255), 2)
#         face_frame = detect_faces(frame, face_cascade)
#         if face_frame is not None:
#             eyes = detect_eyes(face_frame, eye_cascade)
#             for eye in eyes:
#                 if eye is not None:
#                     # threshold = r = cv2.getTrackbarPos('threshold', 'image')
#                     eye = cut_eyebrows(eye)
#                     keypoints = blob_process(eye, 50, detector)
#                     eye = cv2.drawKeypoints(eye, keypoints, eye, (0, 0, 255), cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
		
# 		# update the background model and increment the total number
# 		# of frames read thus far
#         md.update(gray)
#         # total += 1
 
# 		# acquire the lock, set the output frame, and release the
# 		# lock
#         # with lock:
#         #     outputFrame = frame.copy()

# cap = cv2.VideoCapture(0)
vid_cod = cv2.VideoWriter_fourcc(*'MJPG')
output = cv2.VideoWriter("videos/cam_video.avi", vid_cod, 20.0, (640,480))

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
        frame = await self.track.recv()
        # ret, frame = cap.read()

        # frame = imutils.resize(frame, width=400)
        # gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        # gray = cv2.GaussianBlur(gray, (7, 7), 0)

        # md = SingleMotionDetector(accumWeight=0.1)
    

        if self.transform == "edges":
            # perform edge detection
            print(frame)
            img = frame.to_ndarray(format="bgr24")
            # img = cv2.cvtColor(cv2.Canny(img, 100, 200), cv2.COLOR_GRAY2BGR)

            # rebuild a VideoFrame, preserving timing information
            new_frame = VideoFrame.from_ndarray(img, format="bgr24")
            new_frame.pts = frame.pts
            new_frame.time_base = frame.time_base
            print(new_frame)
            # if cap.isOpened()==False:
            #     print("attempting to force open cap")
            #     cap.open(-1)
            # ret, frameToWrite = cap.read()
            print(ret)
            print("startTime: ", time.time())
            t_end = time.time() + 5
            while time.time() < t_end:
                # print(time.time())
                output.write(new_frame)
                # print("in while()")
            print("endTime: ", time.time())

            return new_frame
        elif self.transform == "tipsy":
            # todo
            # print("startTime: ", time.time())
            # t_end = time.time() + 5
            # while time.time() < t_end:
            #     output.write(frame)
            #     print("in while()")
            # print("endTime: ", time.time())

            # print("attempting to upload to bucket")
            # upload_blob("testnwhacks", "/root/server/videos/sean_drunk.mp4", "test.mp4")
            # print("upload complete")
            # analyze_labels("gs://testnwhacks/sean_drunk.mp4")
            img = frame.to_ndarray(format="bgr24")

            face_frame = detect_faces(frame, face_cascade)
            if face_frame is not None:
                eyes = detect_eyes(face_frame, eye_cascade)
                for eye in eyes:
                    if eye is not None:
                        # threshold = r = cv2.getTrackbarPos('threshold', 'image')
                        eye = cut_eyebrows(eye)
                        keypoints = blob_process(eye, 50, detector)
                        eye = cv2.drawKeypoints(eye, keypoints, eye, (0, 0, 255), cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
                        return eye
            
            # update the background model and increment the total number
            # of frames read thus far
            # md.update(gray)
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

    app.on_shutdown.append(on_shutdown)
    web.run_app(app, access_log=None, port=args.port, ssl_context=ssl_context)
