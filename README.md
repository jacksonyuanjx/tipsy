# Tipsy (nwHacks 2020 Hackathon Project)
Devpost: https://devpost.com/software/tipsy-msklzr

## Inspiration
The inspiration for this project came from learning about the drunk driving epidemic. Specifically, our team was interested in developing a method to screen users of car sharing services for intoxication. The goal was to add more security against drunk drivers from being allowed to operate a motor vehicle, using an accurate and objective method of suitability for driving.

## What it does?
This program utilizes computer vision to determine inebriation using the same standardized method that is commonly applied by law enforcement officers in North America - the one leg standing test. This assessment evaluates whether an individual can balance on one leg, without overly swaying or losing balance. Since dizziness and loss of motor coordination are common symptoms of alcohol intoxication, this method has been shown to be effective through multiple clinical and field studies.

The program is deployed as a website, which after a facial authentication step (to ensure the individual performing the one-leg test is the registered user of the app), the test is performed by the user, then the machine learning backend determines the binary classification task of whether the individual is sober or drunk. Thereafter, the car either opens or refuses to start, respectively.

## How we built it?
There were two machine learning stages involved: facial recognition for authentication, as well as the computer vision to classify a video recording of a user performing the one leg test. The frontend used React.js, and the backend was run using a GCP computer engine.

## Challenges we ran into
Like many machine learning projects, there were issues with the dataset, or lack thereof. There was no readily available set of videos showing the one leg test performed by both sober and drunk people, so there was need to find a more creative solution for determining sobriety.

## What we learned
We learned the intricacies (and difficulties) of incorporating AI tools into a website. Deploying the machine learning model on a server, then interpreting that output and sending the results to a frontend requires a very well planned pipeline. Our whole team gained skills in terms of developing an organized pipeline.
