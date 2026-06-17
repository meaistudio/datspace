const canvas = document.getElementById("c");
const g = canvas.getContext("2d");

function resize(){
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
resize();
onresize = resize;

// AUDIO
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const master = audioCtx.createGain();
master.gain.value = 0.9;
master.connect(audioCtx.destination);

const dryGain = audioCtx.createGain();
dryGain.gain.value = 1.0;
dryGain.connect(master);

const wetGain = audioCtx.createGain();
wetGain.gain.value = 0.35;

const convolver = audioCtx.createConvolver();
wetGain.connect(convolver);
convolver.connect(master);

function createImpulse(seconds, decay){
    const length = audioCtx.sampleRate * seconds;
    const impulse = audioCtx.createBuffer(2, length, audioCtx.sampleRate);

    for(let ch=0; ch<2; ch++){
        const channel = impulse.getChannelData(ch);
        for(let i=0; i<length; i++){
            channel[i] = (Math.random()*2-1) * Math.pow(1 - i / length, decay);
        }
    }

    return impulse;
}

let lastReverbTime = 5;
let lastReverbDecay = 4;
let reverbBuildTimer = null;

convolver.buffer = createImpulse(5,4);

function updateReverb(){
    const amount = Number(document.getElementById("reverbAmount").value) / 100;
    const time = Number(document.getElementById("reverbTime").value);
    const decay = Number(document.getElementById("reverbDecay").value);
    const now = audioCtx.currentTime;

    wetGain.gain.cancelScheduledValues(now);
    wetGain.gain.setTargetAtTime(amount, now, 0.01);

    document.getElementById("reverbAmountValue").innerText = Math.round(amount * 100) + "%";
    document.getElementById("reverbTimeValue").innerText = time + "s";
    document.getElementById("reverbDecayValue").innerText = decay;

    if(time !== lastReverbTime || decay !== lastReverbDecay){
        lastReverbTime = time;
        lastReverbDecay = decay;

        clearTimeout(reverbBuildTimer);
        reverbBuildTimer = setTimeout(()=>{
            convolver.buffer = createImpulse(time, decay);
        }, 80);
    }
}

document.getElementById("reverbAmount").oninput = updateReverb;
document.getElementById("reverbTime").oninput = updateReverb;
document.getElementById("reverbDecay").oninput = updateReverb;
updateReverb();

// SAMPLES
const RAW_BASE = "https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/c2db9a0dc4ffb911febc613cdb9726cae5175223";

const sampleLists = {
    kick:[
        "BT0A0A7.wav","BT0A0D0.wav","BT0A0D3.wav","BT0A0DA.wav",
        "BT0AAD0.wav","BT0AADA.wav","BT3A0D0.wav","BT3A0D3.wav",
        "BT3A0D7.wav","BT3A0DA.wav","BT3AAD0.wav","BT3AADA.wav",
        "BT7A0D0.wav","BT7A0D3.wav","BT7A0D7.wav","BT7A0DA.wav",
        "BT7AAD0.wav","BT7AADA.wav","BTAA0D0.wav","BTAA0D3.wav",
        "BTAA0D7.wav","BTAA0DA.wav","BTAAAD0.wav","BTAAADA.wav"
    ],
    snare:[
        "ST0T0S0.wav","ST0T0S3.wav","ST0T0S7.wav","ST0T0SA.wav",
        "ST0T3S3.wav","ST0T3S7.wav","ST0T3SA.wav","ST0T7S3.wav",
        "ST0T7S7.wav","ST0T7SA.wav","ST0TAS3.wav","ST0TAS7.wav",
        "ST0TASA.wav","ST3T0S0.wav","ST3T0S3.wav","ST3T0S7.wav",
        "ST3T0SA.wav","ST3T3S3.wav","ST3T3S7.wav","ST3T3SA.wav"
    ],
    hat:[
        "000_drum1.wav",
        "001_drum2.wav",
        "002_drum3.wav",
        "003_drum4.wav",
        "004_drum5.wav",
        "005_drum6.wav"
    ]
};

const sampleFolders = {
    kick:"bd",
    snare:"sn",
    hat:"drum"
};

const sampleBuffers = {
    kick:{},
    snare:{},
    hat:{}
};

function fillSelect(id, list){
    const sel = document.getElementById(id);
    sel.innerHTML = "";

    list.forEach((name,i)=>{
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = i + " : " + name;
        sel.appendChild(opt);
    });
}

fillSelect("kickSample", sampleLists.kick);
fillSelect("snareSample", sampleLists.snare);
fillSelect("hatSample", sampleLists.hat);

document.getElementById("kickSample").value = "BT0A0D0.wav";
document.getElementById("snareSample").value = "ST0T0S3.wav";
document.getElementById("hatSample").value = "000_drum1.wav";

async function loadSample(type, filename){
    if(sampleBuffers[type][filename]) return sampleBuffers[type][filename];

    const url = `${RAW_BASE}/${sampleFolders[type]}/${filename}`;
    const res = await fetch(url);

    if(!res.ok) throw new Error("failed loading " + url);

    const arr = await res.arrayBuffer();
    const buffer = await audioCtx.decodeAudioData(arr);
    sampleBuffers[type][filename] = buffer;

    return buffer;
}

async function loadSelectedSamples(){
    const status = document.getElementById("sampleStatus");
    status.innerText = "SAMPLES: LOADING...";

    try{
        await audioCtx.resume();

        await Promise.all([
            loadSample("kick", document.getElementById("kickSample").value),
            loadSample("snare", document.getElementById("snareSample").value),
            loadSample("hat", document.getElementById("hatSample").value)
        ]);

        status.innerText = "SAMPLES: LOADED";
        return true;
    }catch(e){
        console.error(e);
        status.innerText = "SAMPLES: ERROR / FALLBACK ACTIVE";
        return false;
    }
}

function fallbackDrum(type, when){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    if(type === "kick"){
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, when);
        osc.frequency.exponentialRampToValueAtTime(45, when + 0.18);
        gain.gain.setValueAtTime(1.0, when);
        gain.gain.exponentialRampToValueAtTime(0.001, when + 0.24);
    }

    if(type === "snare"){
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, when);
        filter.type = "bandpass";
        filter.frequency.value = 1600;
        filter.Q.value = 1.2;
        gain.gain.setValueAtTime(0.55, when);
        gain.gain.exponentialRampToValueAtTime(0.001, when + 0.13);
    }

    if(type === "hat"){
        osc.type = "square";
        osc.frequency.setValueAtTime(6500, when);
        filter.type = "highpass";
        filter.frequency.value = 4500;
        gain.gain.setValueAtTime(0.25, when);
        gain.gain.exponentialRampToValueAtTime(0.001, when + 0.045);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dryGain);
    gain.connect(wetGain);

    osc.start(when);
    osc.stop(when + 0.3);
}

function playSampleAt(type, when){
    const selectId =
        type === "kick" ? "kickSample" :
        type === "snare" ? "snareSample" :
        "hatSample";

    const filename = document.getElementById(selectId).value;
    const buffer = sampleBuffers[type][filename];

    if(!buffer){
        loadSample(type, filename).catch(()=>{});
        fallbackDrum(type, when);
        return;
    }

    const src = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();

    src.buffer = buffer;

    if(type === "kick") gain.gain.value = 1.6;
    if(type === "snare") gain.gain.value = 1.35;
    if(type === "hat") gain.gain.value = 1.2;

    src.connect(gain);
    gain.connect(dryGain);
    gain.connect(wetGain);

    src.start(when);
}

document.getElementById("kickSample").onchange = ()=>{
    loadSample("kick", document.getElementById("kickSample").value).catch(()=>{});
};

document.getElementById("snareSample").onchange = ()=>{
    loadSample("snare", document.getElementById("snareSample").value).catch(()=>{});
};

document.getElementById("hatSample").onchange = ()=>{
    loadSample("hat", document.getElementById("hatSample").value).catch(()=>{});
};

// GRID
const rows = ["kick","snare","hat"];
const steps = 16;

const data = {
    kick:Array(steps).fill(0),
    snare:Array(steps).fill(0),
    hat:Array(steps).fill(0)
};

rows.forEach(r=>{
    const el = document.querySelector("." + r);

    for(let i=0; i<steps; i++){
        const cell = document.createElement("div");
        cell.classList.add("cell");

        cell.onclick = ()=>{
            data[r][i] ^= 1;
            cell.classList.toggle("active", data[r][i] === 1);
        };

        el.appendChild(cell);
    }
});

// BPM
const bpmSlider = document.getElementById("bpm");
const bpmValue = document.getElementById("bpmValue");

bpmValue.innerText = bpmSlider.value;

bpmSlider.oninput = ()=>{
    bpmValue.innerText = bpmSlider.value;
};

// VISUAL
const vocab = [
"data","system","signal","visual","machine","network","pattern","structure",
"code","memory","archive","ritual","interface","process","logic","error",
"fragment","layer","node","frequency","modulation","sequence","density",
"protocol","mapping","transmission","feedback","control","syntax","semantic",
"noise","field","grid","vector","phase","cycle","input","output"
];

function makeText(n){
    let t = [];
    for(let i=0; i<n; i++) t.push(vocab[i % vocab.length]);
    return t;
}

let layout = [];
let alignMode = 0;
let wordCount = 40;
let titleWords = ["DATA","SYSTEM","VISUAL"];
let titleSize = 80;
let scrollY = 0;
let kickCount = 0;
let visualInvertFlash = false;

function generateLayout(){
    layout = [];
    alignMode = (alignMode + 1) % 4;

    wordCount += Math.random() > 0.5 ? 20 : -20;
    wordCount = Math.max(10, Math.min(200, wordCount));

    titleWords = makeText(3).map(w=>w.toUpperCase());
    titleSize = 60 + Math.random() * 120;

    const cols = 2 + (alignMode % 3);
    const w = canvas.width / cols;

    for(let i=0; i<cols; i++){
        layout.push({
            x:i * w + 80,
            words:makeText(wordCount),
            highlights:[],
            size:16 + Math.random() * 30
        });
    }
}

function transformText(){
    layout.forEach(b=>{
        b.words = b.words.map(()=>{
            return String.fromCharCode(33 + Math.floor(Math.random() * 94));
        });
    });
}

function addBlock(){
    layout.forEach(b=>{
        b.highlights = [];
        for(let i=0; i<b.words.length; i++){
            if(Math.random() > 0.85) b.highlights.push(i);
        }
    });
}

function draw(){
    const w = canvas.width;
    const h = canvas.height;

    g.fillStyle = "black";
    g.fillRect(0,0,w,h);

    const margin = 80;
    const contentWidth = w - margin * 2;

    let baseX = margin;

    if(alignMode === 1) baseX = w / 2 - contentWidth / 2;
    if(alignMode === 2) baseX = w - contentWidth - margin;

    const yOffset = -scrollY;

    g.fillStyle = "white";
    g.font = "bold " + titleSize + "px sans-serif";
    g.fillText(titleWords.join(" "), baseX, 120 + yOffset);

    let currentY = 200 + yOffset;

    layout.forEach(b=>{
        g.font = b.size + "px monospace";

        let x = baseX;
        let y = currentY;

        b.words.forEach((word,i)=>{
            const text = word + " ";
            const width = g.measureText(text).width;

            if(x > baseX + contentWidth){
                x = baseX;
                y += b.size + 10;
            }

            if(b.highlights.includes(i)){
                g.fillStyle = "white";
                g.fillRect(x - 2, y - b.size, width + 4, b.size + 8);
                g.fillStyle = "black";
            }else{
                g.fillStyle = "white";
            }

            g.fillText(text, x, y);
            x += width;
        });

        currentY = y + 60;
    });

    if(currentY > h) scrollY += 30;

    if(visualInvertFlash){
        g.globalCompositeOperation = "difference";
        g.fillStyle = "white";
        g.fillRect(0,0,w,h);
        g.globalCompositeOperation = "source-over";
        visualInvertFlash = false;
    }
}

function visualLoop(){
    requestAnimationFrame(visualLoop);
    if(!playing) draw();
}

generateLayout();
draw();
visualLoop();

// PLAYER / STABLE SCHEDULER
let step = 0;
let playing = false;
let schedulerTimer = null;
let nextNoteTime = 0;

const lookAheadMs = 25;
const scheduleAheadTime = 0.12;

function stepDuration(){
    const bpm = Number(bpmSlider.value);
    return (60 / bpm) / 4;
}

function updateStepUI(currentStep){
    document.querySelectorAll(".cell").forEach(c=>c.classList.remove("playing"));

    rows.forEach(r=>{
        const cells = document.querySelectorAll("." + r + " .cell");
        if(cells[currentStep]) cells[currentStep].classList.add("playing");
    });
}

function scheduleStep(stepIndex, when){
    rows.forEach(r=>{
        if(data[r][stepIndex]){
            if(r === "kick"){
                playSampleAt("kick", when);
                generateLayout();
                kickCount++;
                if(kickCount % 4 === 0) scrollY = 0;
                visualInvertFlash = true;
            }

            if(r === "snare"){
                playSampleAt("snare", when);
                transformText();
            }

            if(r === "hat"){
                playSampleAt("hat", when);
                addBlock();
            }
        }
    });

    setTimeout(()=>{
        updateStepUI(stepIndex);
        draw();
    }, Math.max(0, (when - audioCtx.currentTime) * 1000));
}

function scheduler(){
    while(nextNoteTime < audioCtx.currentTime + scheduleAheadTime){
        scheduleStep(step, nextNoteTime);
        nextNoteTime += stepDuration();
        step = (step + 1) % steps;
    }
}

async function startSequencer(){
    await audioCtx.resume();
    await loadSelectedSamples();

    if(playing) return;

    playing = true;
    step = 0;
    scrollY = 0;
    kickCount = 0;
    nextNoteTime = audioCtx.currentTime + 0.08;

    clearInterval(schedulerTimer);
    schedulerTimer = setInterval(scheduler, lookAheadMs);
}

function stopSequencer(){
    playing = false;
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    step = 0;
    document.querySelectorAll(".cell").forEach(c=>c.classList.remove("playing"));
}

// ESP CONTROL MAP dari DATs Collectible: potA, potB, key, mode, freeze, linked. :contentReference[oaicite:0]{index=0}
let port;
let reader;
let writer;
let pingTimer = null;

let espConnected = false;
let espPotA = 0;
let espPotB = 0;
let espKey = "-";
let espRawMode = 0;
let espFreeze = false;
let espLinked = false;

let espControl = 0;
let lastEspControl = -1;
let lastSampleIndex = -1;
let lastHandledKey = "-";

let pickupReady = false;
let pickupTarget = 0;

const PICKUP_THRESHOLD = 0.055;

const keyToStep = {
    "1":0, "4":1, "7":2, "*":3,
    "2":4, "5":5, "8":6, "0":7,
    "3":8, "6":9, "9":10, "#":11,
    "A":12, "B":13, "C":14, "D":15
};

function clamp(v,min,max){
    return Math.max(min, Math.min(max, v));
}

function mapValue(v, inMin, inMax, outMin, outMax){
    return Math.floor((v - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);
}

function norm(v){
    return clamp(v / 4095, 0, 1);
}

function controlName(id){
    return [
        "KICK SAMPLE / KICK ROW",
        "SNARE SAMPLE / SNARE ROW",
        "DRUM SAMPLE / DRUM ROW",
        "REVERB AMOUNT",
        "REVERB TIME",
        "REVERB DECAY",
        "BPM"
    ][id] || "-";
}

function getCurrentTargetNormalized(id){
    if(id === 0) return document.getElementById("kickSample").selectedIndex / Math.max(1, sampleLists.kick.length - 1);
    if(id === 1) return document.getElementById("snareSample").selectedIndex / Math.max(1, sampleLists.snare.length - 1);
    if(id === 2) return document.getElementById("hatSample").selectedIndex / Math.max(1, sampleLists.hat.length - 1);
    if(id === 3) return Number(document.getElementById("reverbAmount").value) / 100;
    if(id === 4) return (Number(document.getElementById("reverbTime").value) - 1) / 9;
    if(id === 5) return (Number(document.getElementById("reverbDecay").value) - 1) / 7;
    if(id === 6) return (Number(bpmSlider.value) - 80) / 80;
    return 0;
}

function armPickup(){
    pickupReady = false;
    pickupTarget = getCurrentTargetNormalized(espControl);
}

function checkPickup(){
    if(Math.abs(norm(espPotB) - pickupTarget) <= PICKUP_THRESHOLD){
        pickupReady = true;
    }
    return pickupReady;
}

function updateESPSelectionHover(){
    document.querySelectorAll(".espSelected").forEach(el=>el.classList.remove("espSelected"));
    document.querySelectorAll(".espSelectedLabel").forEach(el=>el.classList.remove("espSelectedLabel"));

    if(!espConnected) return;

    const map = {
        0:["kickSample"],
        1:["snareSample"],
        2:["hatSample"],
        3:["reverbAmount"],
        4:["reverbTime"],
        5:["reverbDecay"],
        6:["bpm"]
    };

    const ids = map[espControl];
    if(!ids) return;

    ids.forEach(id=>{
        const el = document.getElementById(id);
        if(!el) return;

        el.classList.add("espSelected");

        const label = el.previousElementSibling;
        if(label && label.tagName === "LABEL"){
            label.classList.add("espSelectedLabel");
        }
    });
}

function updateEspInfo(){
    const pickupText = pickupReady ? "READY" : "MOVE POT B TO VALUE " + Math.round(pickupTarget * 100) + "%";
    const pickupClass = pickupReady ? "" : "pickupWait";

    document.getElementById("espInfo").innerHTML = `
        LINK: ${espLinked ? "WEB LINKED" : "STANDALONE"}<br>
        MODE: ${espRawMode}<br>
        CONTROL: ${controlName(espControl)}<br>
        PICKUP: <span class="${pickupClass}">${pickupText}</span><br>
        POT A: ${espPotA}<br>
        POT B: ${espPotB}<br>
        KEY: ${espKey}<br>
        FREEZE: ${espFreeze}
    `;

    updateESPSelectionHover();
}

function handlePotsFromDATs(){
    espControl = clamp(mapValue(espPotA, 0, 4095, 0, 7), 0, 6);

    if(espControl !== lastEspControl){
        lastEspControl = espControl;
        lastSampleIndex = -1;
        armPickup();
    }

    if(!checkPickup()){
        updateEspInfo();
        return;
    }

    if(espControl === 0){
        const index = clamp(mapValue(espPotB, 0, 4095, 0, sampleLists.kick.length), 0, sampleLists.kick.length - 1);
        if(index !== lastSampleIndex){
            lastSampleIndex = index;
            document.getElementById("kickSample").selectedIndex = index;
            loadSample("kick", document.getElementById("kickSample").value).catch(()=>{});
        }
    }

    if(espControl === 1){
        const index = clamp(mapValue(espPotB, 0, 4095, 0, sampleLists.snare.length), 0, sampleLists.snare.length - 1);
        if(index !== lastSampleIndex){
            lastSampleIndex = index;
            document.getElementById("snareSample").selectedIndex = index;
            loadSample("snare", document.getElementById("snareSample").value).catch(()=>{});
        }
    }

    if(espControl === 2){
        const index = clamp(mapValue(espPotB, 0, 4095, 0, sampleLists.hat.length), 0, sampleLists.hat.length - 1);
        if(index !== lastSampleIndex){
            lastSampleIndex = index;
            document.getElementById("hatSample").selectedIndex = index;
            loadSample("hat", document.getElementById("hatSample").value).catch(()=>{});
        }
    }

    if(espControl === 3){
        document.getElementById("reverbAmount").value = clamp(mapValue(espPotB, 0, 4095, 0, 101), 0, 100);
        updateReverb();
    }

    if(espControl === 4){
        document.getElementById("reverbTime").value = clamp(mapValue(espPotB, 0, 4095, 1, 11), 1, 10);
        updateReverb();
    }

    if(espControl === 5){
        document.getElementById("reverbDecay").value = clamp(mapValue(espPotB, 0, 4095, 1, 9), 1, 8);
        updateReverb();
    }

    if(espControl === 6){
        const value = clamp(mapValue(espPotB, 0, 4095, 80, 161), 80, 160);
        bpmSlider.value = value;
        bpmValue.innerText = value;
    }

    updateEspInfo();
}

function handleKeyFromDATs(k){
    if(!(k in keyToStep)) return;
    if(k === lastHandledKey) return;

    lastHandledKey = k;

    if(espControl > 2) return;

    const stepIndex = keyToStep[k];
    const rowName = rows[espControl];

    data[rowName][stepIndex] ^= 1;

    const cells = document.querySelectorAll("." + rowName + " .cell");
    cells[stepIndex].classList.toggle("active", data[rowName][stepIndex] === 1);
}

function releaseKeyFromDATs(k){
    if(k === "-") lastHandledKey = "-";
}

function handleDATsDisconnected(){
    espConnected = false;

    document.getElementById("espStatus").innerText = "ESP: DISCONNECTED / DEVICE REMOVED";
    document.getElementById("espStatus").classList.add("disconnected");
    document.getElementById("connectDATs").innerText = "CONNECT DATs COLLECTIBLE";

    updateESPSelectionHover();

    if(pingTimer){
        clearInterval(pingTimer);
        pingTimer = null;
    }

    try{ if(reader) reader.releaseLock(); }catch(e){}
    try{ if(writer) writer.releaseLock(); }catch(e){}

    reader = null;
    writer = null;
    port = null;
}

function showConnectNotice(){
    document.getElementById("connectNotice").style.display = "flex";
}

function hideConnectNotice(){
    document.getElementById("connectNotice").style.display = "none";
}

async function connectDATs(){
    await audioCtx.resume();

    if(!("serial" in navigator)){
        alert("Web Serial hanya jalan di Chrome / Edge desktop.");
        return;
    }

    try{
        port = await navigator.serial.requestPort();
        await port.open({ baudRate:115200 });

        navigator.serial.addEventListener("disconnect", event=>{
            if(port && event.target === port){
                handleDATsDisconnected();
            }
        });

        const encoder = new TextEncoderStream();
        encoder.readable.pipeTo(port.writable);
        writer = encoder.writable.getWriter();

        await writer.write("PAIR\n");

        pingTimer = setInterval(()=>{
            if(writer) writer.write("PING\n");
        },700);

        const decoder = new TextDecoderStream();
        port.readable.pipeTo(decoder.writable);
        reader = decoder.readable.getReader();

        espConnected = true;
        document.getElementById("espStatus").innerText = "ESP: CONNECTED";
        document.getElementById("espStatus").classList.remove("disconnected");
        document.getElementById("connectDATs").innerText = "DATs CONNECTED";

        updateESPSelectionHover();
        readDATsSerial();

    }catch(err){
        console.error(err);
        alert("Connection cancelled or failed. Make sure your DATs Collectible is plugged in, then try again.");
    }
}

async function readDATsSerial(){
    let buffer = "";

    try{
        while(true){
            const { value, done } = await reader.read();

            if(done){
                handleDATsDisconnected();
                break;
            }

            if(!value) continue;

            buffer += value;

            const lines = buffer.split("\n");
            buffer = lines.pop();

            for(const line of lines){
                parseDATsLine(line.trim());
            }
        }
    }catch(err){
        console.warn("DATs disconnected:", err);
        handleDATsDisconnected();
    }
}

function parseDATsLine(line){
    if(!line.startsWith("{")) return;

    try{
        const d = JSON.parse(line);

        if(d.potA !== undefined) espPotA = d.potA;
        if(d.potB !== undefined) espPotB = d.potB;
        if(d.mode !== undefined) espRawMode = d.mode;
        if(d.freeze !== undefined) espFreeze = d.freeze;
        if(d.linked !== undefined) espLinked = d.linked;

        if(d.key !== undefined){
            espKey = d.key;

            if(espKey !== "-"){
                handleKeyFromDATs(espKey);
            }else{
                releaseKeyFromDATs(espKey);
            }
        }

        handlePotsFromDATs();

    }catch(e){
        console.log("DATs serial:", line);
    }
}

// UI
document.getElementById("connectDATs").onclick = showConnectNotice;
document.getElementById("noticeCancel").onclick = hideConnectNotice;
document.getElementById("noticeContinue").onclick = async ()=>{
    hideConnectNotice();
    await connectDATs();
};

document.getElementById("start").onclick = startSequencer;
document.getElementById("stop").onclick = stopSequencer;

document.getElementById("visualOnly").onclick = async ()=>{
    document.body.classList.add("hideInterface");
    if(document.documentElement.requestFullscreen){
        await document.documentElement.requestFullscreen();
    }
};

document.getElementById("returnUI").onclick = async ()=>{
    document.body.classList.remove("hideInterface");
    if(document.fullscreenElement){
        await document.exitFullscreen();
    }
};

document.addEventListener("keydown", async e=>{
    if(e.key.toLowerCase() === "f"){
        document.body.classList.toggle("hideInterface");

        if(document.body.classList.contains("hideInterface")){
            if(document.documentElement.requestFullscreen){
                await document.documentElement.requestFullscreen();
            }
        }else{
            if(document.fullscreenElement){
                await document.exitFullscreen();
            }
        }
    }

    if(e.key === "Escape"){
        document.body.classList.remove("hideInterface");
    }
});

updateEspInfo();
