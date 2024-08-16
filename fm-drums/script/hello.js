// ---------------------------------------------------------------------------- inst

const lfo = new Tone.LFO(5 ,0 , 2);

const kick = new Tone.MembraneSynth({
  pitchDecay : 0.05,
  envelope: {
    attack: 0.001,
    decay: 0.9,
    sustain: 0,
    release: 0.1
  },
});


const hh = new Tone.MetalSynth();
const hhCh = new Tone.Channel(-8,0);
const hhFreq = new Tone.Signal({
  value: "C4",
  units: "frequency"
}).connect(hh.frequency);

const sn = new Tone.FMSynth({
  harmonicity: 0.45,
  modulationIndex: 50,
  oscillator: {
    type: "sine",
  },
  envelope: {
    attack: 0.001,
    decay: 0.4,
    sustain: 0.1,
    release: 0.1
  },
  modulation: {
    type: "sine"
  },
  modulationEnvelope: {
    attack: 0.01,
    decay: 0.3,
    sustain: 0.2,
    release: 0.01,
  },
})

const freqScale = new Tone.Scale(100, 2000)
const freqEnv = new Tone.Envelope(0.001, 0.4, 0.2, 0.01)
freqEnv.connect(freqScale)

freqScale.connect(sn.frequency)

const snHpf = new Tone.Filter(100 , "highpass", -48)
snHpf.Q.value = 10;

const hpfScale = new Tone.Scale(100, 180)
const hpfEnv = new Tone.Envelope(0.01, 0.2, 0, 0.01)
hpfEnv.connect(hpfScale)
hpfScale.connect(snHpf.frequency)

// ---------------------------------------------------------------------------- fx

const dist = new Tone.Distortion(0.2)

// ---------------------------------------------------------------------------- routing

const master = new Tone.Channel(-12,0)
kick.chain(dist , new Tone.Channel(0,0), master, Tone.Destination)
hh.chain(new Tone.Channel(-8,0), master, Tone.Destination)
sn.chain(snHpf , dist ,new Tone.Channel(0,0), master, Tone.Destination)

// ---------------------------------------------------------------------------- events
let tone = () => {
  
  const kPat = [1,0,0,0,1,0,1,1]
  const snPat = [
      0,0,0,0,
      1,0,0,0,
      0,0,1,0,
      1,0,0,0
    ]
  let i = 0
  let j = 0
  let counter = 0
  let remainder = 0
  let modNum = 2
  
  new Tone.Loop((time) => {
    //kick sequence
    if(kPat[i] == 1) kick.triggerAttackRelease("F1", 0.5, time)
    i = i > kPat.length - 1 ? 0 : i + 1;
    
    //snare sequence
    if(snPat[j] == 1) {
      sn.triggerAttack("F4",time)
      freqEnv.triggerAttack()
      hpfEnv.triggerAttack()
      sn.triggerRelease(time + 0.3)
    }
    j = j > snPat.length - 1 ? 0 : j + 1;

    //hh sequence
    hh.triggerAttackRelease("F3", remainder == 0 ? 0.0005 : 0.01 , time)
    counter = counter > 255 ? 0 : counter + 1;
    remainder = Math.floor(Math.random() * modNum)
    if(counter % 64 == 0){
      hhFreq.rampTo("C2", 4, "+0.5"); 
    }
    if(hhFreq.value <= Tone.Frequency("C3")){
      hhFreq.value = "C4"
    }
  }, "16n").start(0)

  console.log("start playing")
}

tone()


// ---------------------------------------------------------------------------- ui 

let isPlaying = false;
let button = document.getElementById("btn")
let playstat = document.getElementById("playstat")
let hhstat = document.getElementById("hhstat")
let masterVol = document.getElementById("master-vol")
let vol = document.getElementById("vol")

button.addEventListener("click" , () => {
  isPlaying = !isPlaying
  console.log("clicked")
  if(isPlaying){
    Tone.getTransport().start()
    playstat.textContent = "Playing"
  }
  if(!isPlaying){
    Tone.getTransport().stop()
    playstat.textContent = "Paused"
  } 
})

document.addEventListener("keypress", e => {
  if(e.key == " "){
    isPlaying = !isPlaying
  }

  if(isPlaying){
    Tone.getTransport().start()
    playstat.textContent = "Playing"
  }
  if(!isPlaying){
    Tone.getTransport().stop()
    playstat.textContent = "Paused"
  } 
})

masterVol.addEventListener("change", () => {
  const db = (50 - masterVol.value) * -1
  master.volume.value = db
  vol.textContent = master.volume.value
})

vol.textContent = master.volume.value 

const body = document.querySelector("body");
let harmonicityDom = document.createElement("p");
body.appendChild(harmonicityDom);
