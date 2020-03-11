const dontTouch = () => {

    let showBoxes = true;


    const faceTracker = new tracking.ObjectTracker("face");
    faceTracker.setEdgesDensity(0.11);
    faceTracker.setInitialScale(3.4);
    faceTracker.setStepSize(1);
    tracking.track("#webcam", faceTracker, {camera: true});


    function HandTracker(videoId) {
        this.started = false;
        this.video = document.getElementById(videoId);
        this.model;
        this.timer;
        this.events = {};

        const modelParams = {
            flipHorizontal: false,   // flip e.g for video 
            imageScaleFactor: 1,  // reduce input image size for gains in speed.
            maxNumBoxes: 2,        // maximum number of boxes to detect
            iouThreshold: 0.5,      // ioU threshold for non-max suppression
            scoreThreshold: 0.6,    // confidence threshold for predictions.
        }
        handTrack.load(modelParams).then(m => {
            detectionReady = true;
            this.model = m;
            this.started = true;
            console.log("Model ready");
            this.start();
        });
        this.start = () => {
            this.timer = setInterval(() => {
                this.__track();
            }, 1000/20)
        };
        this.stop = () => {
            clearInterval(this.timer);
        };
        this.on = (event, cb) => {
            if (!this.events[event]) this.events[event] = [];
            this.events[event].push(cb);
        };
        this.emit = (event, data) => {
            if(this.events[event].length > 0) {
                for (let i = 0; i < this.events[event].length; i++) {
                    this.events[event][i](data);
                }
            }
        }
        this.__track = () => {
            this.model.detect(this.video).then(predictions => {
                    if (predictions.length > 0)  {
                        this.emit("track", {hands: predictions});
                    } else {
                        this.emit("track", {hands: []});
                    }
                    
                });
        }
    }

    let tracked = {
        head: {},
        hands: []
    }

    const isOverlapping = (a, b) => {
        let headLeftOfHand = a.x2 < b.x;
        let headRightOfHand = a.x > b.x2;
        let headAboveHand = a.y2 < b.y;
        let headBelowHand = a.y > b.y2;

        return !(headLeftOfHand || headRightOfHand || headAboveHand || headBelowHand);
    }
    
    const isHandOnFace = () => {
        let e = tracked;
        if (!e.head.x) return false;
        if (e.hands[0] && e.hands[0].x && isOverlapping(e.head, e.hands[0])) return true;
        if (e.hands[1] && e.hands[1].x && isOverlapping(e.head, e.hands[1])) return true;
        return false;
    }

    const checkHandOnFace = () => {
        if (isHandOnFace()) {
            console.log("STOP IT");
            saySomething();
        }
    }

    setInterval(checkHandOnFace, 1000/10);
    
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext("2d");
    const backCanvas = document.createElement("canvas");
    const video = document.getElementById("webcam");
    const backContext = backCanvas.getContext("2d");

    const drawOnCanvas = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        context.beginPath();
        if (tracked.hands.length) {
            tracked.hands.map(hand => {
                context.rect(hand.x, hand.y, hand.width, hand.height);
            });
        }
        if (tracked.head) {
            let i = tracked.head;
            context.rect(i.x, i.y, i.width, i.height);
        }
        context.stroke();
    }

    if(showBoxes) {
        setTimeout(() => {
            setInterval(drawOnCanvas, 1000/30);
        }, 4000);
    }

    let handTracker = new HandTracker("webcam");
    handTracker.on("track", (event) => {
        if (event.hands.length) {
            tracked.hands = [];
            event.hands.map((hand, index) => {
                tracked.hands.push({
                    x: hand.bbox[0],
                    y: hand.bbox[1],
                    width: hand.bbox[2],
                    height: hand.bbox[3],
                    x2: hand.bbox[0] + hand.bbox[2],
                    y2: hand.bbox[1] + hand.bbox[3],
                    data: hand.bbox
                });
            });
        } else {
            tracked.hands = [];
        }
    });

    faceTracker.on("track", event => {
        if (event.data.length) {
            tracked.head.x = event.data[0].x;
            tracked.head.x2 = event.data[0].x + event.data[0].width;
            tracked.head.y = event.data[0].y;
            tracked.head.y2 = event.data[0].y + event.data[0].height;
            tracked.head.width = event.data[0].width;
            tracked.head.height = event.data[0].height;
        } else {
            tracked.head = {};
        }
    });

    let canTalk = true;

    const saySomething = () => {
        if (canTalk) {
            let bg = document.querySelector("#stopit");
            bg.classList.toggle("flashBg");
            setTimeout(() => {
                bg.classList.toggle("flashBg");
            }, 2000);
            let phrases = ["Stop it", "Don't touch your face", "Hands Off!", "Take your hand off that face", "Touching your face will make you sick"];
            let el = Math.round(Math.random() * phrases.length);
            let phrase = phrases[el];
            let languages = ["en", "fr", "de"];
            let lang = languages[Math.round(Math.random() * languages.length)];
            let synth = speechSynthesis;
            let utterance = new SpeechSynthesisUtterance(phrase);
            utterance.voice = synth.getVoices().find(v => v.lang.indexOf(lang) > -1);
            synth.speak(utterance);
            canTalk = false;
            setTimeout(() => canTalk = true, 2000);
        }
    }
}