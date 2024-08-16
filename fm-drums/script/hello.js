// ---------------------------------------------------------------------------- inst
const lfo = new Tone.LFO(5, 0, 2);

const kick = new Tone.MembraneSynth({
  pitchDecay: 0.05,
  envelope: {
    attack: 0.001,
    decay: 1.5,
    sustain: 0,
    release: 0.3,
  },
});

const hh = new Tone.MetalSynth();
const hhCh = new Tone.Channel(-8, 0);
const hhFreq = new Tone.Signal({
  value: "C4",
  units: "frequency",
}).connect(hh.frequency);

const sn = new Tone.FMSynth({
  harmonicity: 1/4,
  modulationIndex: 200,
  oscillator: {
    type: "triangle",
  },
  envelope: {
    attack: 0.001,
    decay: 0.3,
    sustain: 0,
    release: 0.2,
  },
  modulation: {
    type: "triangle",
  },
  modulationEnvelope: {
    attack: 0.01,
    decay: 0.2,
    sustain: 0.1,
    release: 0.01,
  },
});

const snNoise = new Tone.FMSynth({
  harmonicity: 1/4,
  modulationIndex: 400,
  oscillator: {
    type: "square",
  },
  envelope: {
    attack: 0.001,
    decay: 0.3,
    sustain: 0,
    release: 0.4,
  },
  modulation: {
    type: "sine",
  },
  modulationEnvelope: {
    attack: 0.01,
    decay: 0.3,
    sustain: 0.8,
    release: 0.01,
  },
});

const freqScale = new Tone.Scale(1000, 50);
const freqEnv = new Tone.Envelope(0.01, 0.1, 0, 0.01);
freqEnv.connect(freqScale);

freqScale.connect(sn.modulation.frequency);

const snHpf = new Tone.Filter(100, "highpass", -48);
snHpf.Q.value = 14;

const hpfScale = new Tone.Scale(150, 300);
const hpfEnv = new Tone.Envelope(0.001, 0.005, 0, 0.1);
hpfEnv.connect(hpfScale);
hpfScale.connect(snHpf.frequency);

const tom = new Tone.FMSynth({
  harmonicity: 0.7,
  modulationIndex: 10,
  oscillator: {
    type: "sine",
  },
  envelope: {
    attack: 0.001,
    decay: 0.4,
    sustain: 0.1,
    release: 0.01,
  },
  modulation: {
    type: "triangle",
  },
  modulationEnvelope: {
    attack: 0.01,
    decay: 0.3,
    sustain: 0.2,
    release: 0.01,
  },
});

// ---------------------------------------------------------------------------- fx

const dist = new Tone.Distortion(0.2);

const lpf1 = new Tone.Filter(100, "lowpass", -24)
lpf1.Q.value = 4

const lpfLFO1 = new Tone.Oscillator("0.25n" ,"sawtooth")
const lpfScale1 = new Tone.Scale(12000, 2000)
lpfLFO1.connect(lpfScale1)
lpfScale1.connect(lpf1.frequency)

const lpf2 = new Tone.Filter(100, "lowpass", -48)
lpf2.Q.value = 10

const lpfLFO2 = new Tone.Oscillator("16n" ,"sawtooth")
const lpfScale2 = new Tone.Scale(12000, 2000)
lpfLFO2.connect(lpfScale2)
lpfScale2.connect(lpf2.frequency)

// ---------------------------------------------------------------------------- routing

const master = new Tone.Channel(-12, 0);

kick.chain(dist, new Tone.Channel(0, 0), master);
hh.chain(new Tone.Channel(-8, 0), lpf1, master);
sn.chain(snHpf ,dist, new Tone.Channel(0, 0), master);
snNoise.chain(dist, new Tone.Channel(0, 0), master);
tom.chain(new Tone.Channel(2, 0), lpf2, master);

master.chain(Tone.Destination);

// ---------------------------------------------------------------------------- events
let events = () => {
  const kPat = [
    1, 0, 0, 0,
    0, 0, 0, 0,
    1, 0, 0, 1,
    0, 0, 1, 0, 
  ];
  const snPat = [
    0, 0, 0, 0,
    0, 0, 0, 0, 
    0, 1, 0, 0, 
    1, 0, 0, 0
  ];

  const tomNote = ["F4", "F5"];
  let i = 0;
  let j = 0;
  let counter = 0;
  let remainder = 0;
  let modNum = 2;

  new Tone.Loop((time) => {
    //lfo
    lpfLFO1.start()
    lpfLFO2.start()

    //kick sequence
    if (kPat[i] == 1) kick.triggerAttackRelease("F1", 0.5, time);
    i = i == kPat.length - 1 ? 0 : i + 1;

    //snare sequence
    if (snPat[j] == 1) {
      freqEnv.triggerAttack();
      hpfEnv.triggerAttack();
      sn.triggerAttackRelease("F4", 0.5, time);
      snNoise.triggerAttackRelease("F4", 0.5, time);
    }
    j = j == snPat.length - 1 ? 0 : j + 1;

    //hh sequence
    hh.triggerAttackRelease("F3", remainder == 0 ? 0.0005 : 0.01, time);
    counter = counter > 255 ? 0 : counter + 1;
    remainder = Math.floor(Math.random() * modNum);
    if (counter % 64 == 0) {
      hhFreq.rampTo("C2", 4, "+0.5");
    }
    if (hhFreq.value <= Tone.Frequency("C3")) {
      hhFreq.value = "C4";
    }

    // tom sequence
    const k = counter % 3 == 0 || counter % 5 == 0 ? 0 : 1;
    // tom.harmonicity.value = counter % 5 == 0 ? 8 : 0.7
    if(counter % 8 == 0){
      tom.harmonicity.value = 8;
      console.log(8);
    }else if(counter % 5 == 0){
      tom.harmonicity.value = 16;
      tom.modulationIndex = 20;
      console.log(16);
    }else{
      tom.harmonicity.value = 0.7;
      tom.modulationIndex = 10;
    }
        
    if (counter % 4 == 0 || counter % 7 == 0 || counter % 13 == 0) {
      tom.triggerAttackRelease(tomNote[k], 0.2, time);
    }
  }, "16n").start(0);

  console.log("start playing");
};

events();

// ---------------------------------------------------------------------------- ui

let isPlaying = false;
let button = document.getElementById("btn");
let playstat = document.getElementById("playstat");
let hhstat = document.getElementById("hhstat");
let masterVol = document.getElementById("master-vol");
let vol = document.getElementById("vol");

button.addEventListener("click", () => {
  isPlaying = !isPlaying;
  console.log("clicked");
  if (isPlaying) {
    Tone.getTransport().start();
    playstat.textContent = "Playing";
  }
  if (!isPlaying) {
    Tone.getTransport().stop();
    playstat.textContent = "Paused";
  }
});

document.addEventListener("keypress", (e) => {
  if (e.key == " ") {
    isPlaying = !isPlaying;
  }

  if (isPlaying) {
    Tone.getTransport().start();
    playstat.textContent = "Playing";
  }
  if (!isPlaying) {
    Tone.getTransport().stop();
    playstat.textContent = "Paused";
  }
});

masterVol.addEventListener("change", () => {
  const db = (50 - masterVol.value) * -1;
  master.volume.value = db;
  vol.textContent = master.volume.value;
});

vol.textContent = master.volume.value;

const body = document.querySelector("body");
let harmonicityDom = document.createElement("p");
body.appendChild(harmonicityDom);
