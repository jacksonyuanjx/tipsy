# When computing HGN, we could store only the coordinates of keypoints
# in keypoint arrays that are not empty. Then average out these coordinates
# over a period of time and compare any jerking movements coordinates (should prob also average 
# this out) to the initial position coordinates


# import the necessary packages
from pyimagesearch.motion_detection.singlemotiondetector import SingleMotionDetector
from imutils.video import VideoStream
from flask import Response
from flask import Flask
from flask import render_template, send_from_directory
import threading
import argparse
import datetime
import imutils
import time
import cv2


import numpy as np 

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




# initialize the output frame and a lock used to ensure thread-safe
# exchanges of the output frames (useful when multiple browsers/tabs
# are viewing the stream)
outputFrame = None
lock = threading.Lock()
 
# initialize a flask object
app = Flask(__name__)
 
# initialize the video stream and allow the camera sensor to
# warmup
#vs = VideoStream(usePiCamera=1).start()
vs = VideoStream(src=0).start()
time.sleep(2.0)

@app.route("/js/<path:path>")
def serve_js(path):
	return send_from_directory("js", path)

@app.route("/")
def index():
	# return the rendered template
	return render_template("index.html")

def detect_motion(frameCount):
	# grab global references to the video stream, output frame, and
	# lock variables
    global vs, outputFrame, lock
 
	# initialize the motion detector and the total number of frames
	# read thus far
    md = SingleMotionDetector(accumWeight=0.1)
    total = 0

    # loop over frames from the video stream
    while True:
		# read the next frame from the video stream, resize it,
		# convert the frame to grayscale, and blur it
        frame = vs.read()
        frame = imutils.resize(frame, width=400)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (7, 7), 0)
 
		# # grab the current timestamp and draw it on the frame
		# timestamp = datetime.datetime.now()
		# cv2.putText(frame, timestamp.strftime(
		# 	"%A %d %B %Y %I:%M:%S%p"), (10, frame.shape[0] - 10),
		# 	cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 255), 1)
        
        # # if the total number of frames has reached a sufficient
		# # number to construct a reasonable background model, then
		# # continue to process the frame
		# if total > frameCount:
		# 	# detect motion in the image
		# 	motion = md.detect(gray)
 
		# 	# check to see if motion was found in the frame
		# 	if motion is not None:
		# 		# unpack the tuple and draw the box surrounding the
		# 		# "motion area" on the output frame
		# 		(thresh, (minX, minY, maxX, maxY)) = motion
		# 		cv2.rectangle(frame, (minX, minY), (maxX, maxY),
		# 			(0, 0, 255), 2)
        face_frame = detect_faces(frame, face_cascade)
        if face_frame is not None:
            eyes = detect_eyes(face_frame, eye_cascade)
            for eye in eyes:
                if eye is not None:
                    # threshold = r = cv2.getTrackbarPos('threshold', 'image')
                    eye = cut_eyebrows(eye)
                    keypoints = blob_process(eye, 50, detector)
                    eye = cv2.drawKeypoints(eye, keypoints, eye, (0, 0, 255), cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
		
		# update the background model and increment the total number
		# of frames read thus far
        md.update(gray)
        total += 1
 
		# acquire the lock, set the output frame, and release the
		# lock
        with lock:
            outputFrame = frame.copy()

def generate():
	# grab global references to the output frame and lock variables
	global outputFrame, lock
 
	# loop over frames from the output stream
	while True:
		# wait until the lock is acquired
		with lock:
			# check if the output frame is available, otherwise skip
			# the iteration of the loop
			if outputFrame is None:
				continue
 
			# encode the frame in JPEG format
			(flag, encodedImage) = cv2.imencode(".jpg", outputFrame)
 
			# ensure the frame was successfully encoded
			if not flag:
				continue
 
		# yield the output frame in the byte format
		yield(b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + 
			bytearray(encodedImage) + b'\r\n')

@app.route("/video_feed")
def video_feed():
	# return the response generated along with the specific media
	# type (mime type)
	return Response(generate(),
		mimetype = "multipart/x-mixed-replace; boundary=frame")

# check to see if this is the main thread of execution
if __name__ == '__main__':
	# construct the argument parser and parse command line arguments
	ap = argparse.ArgumentParser()
	ap.add_argument("-i", "--ip", type=str, required=True,
		help="ip address of the device")
	ap.add_argument("-o", "--port", type=int, required=True,
		help="ephemeral port number of the server (1024 to 65535)")
	ap.add_argument("-f", "--frame-count", type=int, default=32,
		help="# of frames used to construct the background model")
	args = vars(ap.parse_args())
 
	# start a thread that will perform motion detection
	t = threading.Thread(target=detect_motion, args=(
		args["frame_count"],))
	t.daemon = True
	t.start()
 
	# start the flask app
	app.run(host=args["ip"], port=args["port"], debug=True,
		threaded=True, use_reloader=False)
 
# release the video stream pointer
vs.stop()
