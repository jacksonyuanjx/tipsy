from google.cloud import vision
from google.cloud.vision import types
from PIL import Image, ImageDraw

from gcpBucketHelper import upload_blob

from cv2 import *

client = vision.ImageAnnotatorClient()

# cam = VideoCapture(0)
# s, img = cam.read()

def find_face(frame):
    print("attempting to write file")
    cv2.imwrite(filename='/faces/saved_img.jpg', img=frame)
    print("finished writing file")

    # print("attempting to store to GCP Bucket")
    # upload_blob("nwhacks_faces", "/root/server/videos/saved_img.jpg", "saved_face.jpg")
    # print("finished storing face image to bucket")
