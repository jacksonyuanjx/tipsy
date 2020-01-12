let video;
let poseNet;
let poses = [];

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);

//   frameRate(30); // number of times that draw() runs per second

  // Create a new poseNet method with a single detection
    const options = {
        architecture: 'MobileNetV1', // ResNet50
        // imageScaleFactor: 0.3,
        // outputStride: 16,
        flipHorizontal: false,
        // minConfidence: 0.5,
        maxPoseDetections: 2,
        // scoreThreshold: 0.5,
        nmsRadius: 1,
        // detectionType: 'multiple',
        // inputResolution: 513,
        multiplier: 1.0,
        // quantBytes: 2,
    };
  poseNet = ml5.poseNet(video, options, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on('pose', function(results) {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();
}

function modelReady() {
  select('#status').html('Model Loaded');
}

function draw() {
  image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
//   drawSkeleton();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            let keypoint = pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.2 && (j === 16 || j === 15)) {
                fill(255, 0, 0);
                noStroke();
                ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
                if (j === 16) {
                    console.log("right ankle coords: ", keypoint.position);
                    console.log("left ankle coords: ", pose.keypoints[j-1].position);
                    if (keypoint.score < 0.5) {
                        select('#oneLegStatus').html('YESSSS');
                    } else {
                        select('#oneLegStatus').html('NOOOOO');
                    }
                }
            }
        }
    }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    let skeleton = poses[i].skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(255, 0, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}

/**
 * could store boolean in array over period of time (while the person is standing on one leg)
 * then when you process the array, ensure good booleans are over a certain threshold 
 * to classify as one leg test pass
 */