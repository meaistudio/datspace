let dots = [];
let cam;
let camReady = false;

// ============================================================
// CONSTANTS — fixed behaviour values
// ============================================================
const CONNECT_THRESHOLD = 80; // Max distance between big dots to draw a line
const DOT_COUNT         = 1000;
const GROW_SPEED        = 2.5;
const SHRINK_SPEED      = 1.5;
const MOUSE_RADIUS      = 60;
const MOUSE_FORCE       = 0.1;
const SCATTER_AMOUNT    = 3;
const BIG_THRESHOLD     = 0.75;
const LINE_WEIGHT       = 8;
const NORMAL_ALPHA      = 180;

// ============================================================
// DYNAMIC SETTINGS — controlled by UI sliders / buttons
// ============================================================
let MAX_SIZE = 28; // Changed by the size slider
let MIN_SIZE = 1;  // Scales with MAX_SIZE (always MAX_SIZE * 0.07)

// ============================================================
// PALETTES — add new palettes here as named entries
// Each palette is an array of [R, G, B] colours
// ============================================================
const palettes = {
  "Earthy": [
    [143, 151, 121], // Moss
    [75,  62,  43],  // Wood
    [224, 210, 183], // Sand
    [193, 120,  85], // Clay
    [162,  42,  33]  // Brick
  ],
  "Ocean": [
    [18,  78,  102], // Deep sea
    [40,  130, 163], // Wave
    [120, 194, 209], // Foam
    [210, 237, 242], // Mist
    [9,   42,  55]   // Abyss
  ],
  "Dusk": [
    [60,  30,  80],  // Twilight
    [130, 60,  110], // Mauve
    [210, 110, 90],  // Ember
    [240, 180, 100], // Gold
    [35,  15,  50]   // Midnight
  ],
  "Mono": [
    [240, 240, 240], // White
    [180, 180, 180], // Light gray
    [110, 110, 110], // Mid gray
    [50,  50,  50],  // Dark gray
    [15,  15,  15]   // Near black
  ],
  "Neon": [
    [0,   255, 128], // Green neon
    [0,   200, 255], // Cyan neon
    [180, 0,   255], // Purple neon
    [255, 50,  120], // Pink neon
    [255, 200, 0]    // Yellow neon
  ]
};

// Currently active palette — dots sample from this
let activePalette = palettes["Earthy"];

// ============================================================
// SETUP — runs once on page load
// ============================================================
function setup() {
  createCanvas(windowWidth, windowHeight);

  cam = createCapture(VIDEO, () => {
    camReady = true;
  });

  cam.size(windowWidth, windowHeight);
  cam.hide();

  spawnDots();
  buildUI();
}

// ============================================================
// SPAWN DOTS — creates all DOT_COUNT floating dots.
// Called on setup and again when palette is switched so
// all dots get a colour from the new palette.
// ============================================================
function spawnDots() {
  dots = [];
  for (let i = 0; i < DOT_COUNT; i++) {
    dots.push({
      x:    random(width),
      y:    random(height),
      size: MIN_SIZE,
      col:  random(activePalette) // Pick a random colour from the active palette
    });
  }
}

// ============================================================
// BUILD UI — creates the control panel overlay using the DOM.
// Contains:
//   • A size slider (controls MAX_SIZE → MIN_SIZE scales with it)
//   • Palette switcher buttons (one per entry in palettes{})
// The panel is purely HTML/CSS injected into the page.
// ============================================================
function buildUI() {
  // ---- 1. Outer Panel (Glassmorphism Effect) ----
  let panel = createElement('div');
  panel.style('position',        'fixed');
  panel.style('bottom',          '30px');
  panel.style('left',            '50%');
  panel.style('transform',       'translateX(-50%)');
  panel.style('background',      'rgba(255, 255, 255, 0.07)'); // Putih sangat transparan
  panel.style('border',          '1px solid rgba(255, 255, 255, 0.18)');
  panel.style('border-radius',   '24px');
  panel.style('padding',         '12px 20px');
  panel.style('display',         'flex');
  panel.style('align-items',     'center');
  panel.style('gap',             '20px');
  panel.style('z-index',         '999');
  panel.style('backdrop-filter', 'blur(20px) saturate(180%)'); // Glassmorphism kuat
  panel.style('box-shadow',      '0 8px 32px 0 rgba(0, 0, 0, 0.37)');
  panel.style('color',           '#fff');
  panel.style('font-family',     'monospace');

  // ---- 2. Dropdown Container (Hidden by default) ----
  let settingsMenu = createElement('div');
  settingsMenu.style('display',        'none'); 
  settingsMenu.style('flex-direction',  'column');
  settingsMenu.style('gap',             '12px');
  settingsMenu.style('padding-right',   '20px');
  settingsMenu.style('border-right',    '1px solid rgba(255, 255, 255, 0.1)');
  settingsMenu.parent(panel);

  // --- Isi Settings: Slider ---
  let sizeLabel = createElement('div', 'DOT SIZE');
  sizeLabel.style('font-size', '9px');
  sizeLabel.style('letter-spacing', '1px');
  sizeLabel.style('opacity', '0.6');
  sizeLabel.parent(settingsMenu);

  let slider = createSlider(8, 60, MAX_SIZE, 1);
  slider.style('width', '120px');
  slider.style('accent-color', '#fff');
  slider.parent(settingsMenu);
  slider.input(() => {
    MAX_SIZE = slider.value();
    MIN_SIZE = max(1, floor(MAX_SIZE * 0.07));
  });

  // --- Isi Settings: Palette Swatches ---
  let palLabel = createElement('div', 'PALETTE');
  palLabel.style('font-size', '9px');
  palLabel.style('letter-spacing', '1px');
  palLabel.style('opacity', '0.6');
  palLabel.parent(settingsMenu);

  let swatchContainer = createElement('div');
  swatchContainer.style('display', 'flex');
  swatchContainer.style('gap', '8px');
  swatchContainer.parent(settingsMenu);

  for (let name in palettes) {
    let sBtn = createElement('button');
    sBtn.style('width', '24px');
    sBtn.style('height', '24px');
    sBtn.style('border-radius', '50%');
    sBtn.style('border', '2px solid rgba(255,255,255,0.2)');
    sBtn.style('cursor', 'pointer');
    sBtn.style('transition', 'transform 0.2s');
    
    // Gradient background menggunakan warna palet
    let c = palettes[name];
    sBtn.style('background', `linear-gradient(135deg, rgb(${c[0][0]},${c[0][1]},${c[0][2]}), rgb(${c[1][0]},${c[1][1]},${c[1][2]}))`);
    
    sBtn.parent(swatchContainer);
    
    sBtn.mouseOver(() => sBtn.style('transform', 'scale(1.2)'));
    sBtn.mouseOut(() => sBtn.style('transform', 'scale(1)'));
    
    sBtn.mousePressed(() => {
      activePalette = palettes[name];
      for (let dot of dots) { dot.col = random(activePalette); }
      // Efek visual klik
      selectAll('button').forEach(b => b.style('border', '2px solid rgba(255,255,255,0.2)'));
      sBtn.style('border', '2px solid #fff');
    });
  }

  // ---- 3. Toggle Settings Button ----
  let toggleBtn = createElement('button', '⚙️');
  toggleBtn.style('background', 'none');
  toggleBtn.style('border', 'none');
  toggleBtn.style('font-size', '20px');
  toggleBtn.style('cursor', 'pointer');
  toggleBtn.style('transition', 'transform 0.4s');
  toggleBtn.parent(panel);

  let isOpen = false;
  toggleBtn.mousePressed(() => {
    isOpen = !isOpen;
    settingsMenu.style('display', isOpen ? 'flex' : 'none');
    toggleBtn.style('transform', isOpen ? 'rotate(180deg)' : 'rotate(0deg)');
  });

  // ---- 4. Capture Button (Glassmorphism Style) ----
  let capBtn = createElement('button', '📸 TAKE PICTURE');
  capBtn.style('background',    'rgba(255, 255, 255, 0.2)');
  capBtn.style('border',        '1px solid rgba(255, 255, 255, 0.4)');
  capBtn.style('border-radius', '16px');
  capBtn.style('color',         '#fff');
  capBtn.style('font-family',   'monospace');
  capBtn.style('font-weight',   'bold');
  capBtn.style('padding',       '12px 24px');
  capBtn.style('cursor',        'pointer');
  capBtn.style('backdrop-filter', 'blur(5px)');
  capBtn.style('transition',    'all 0.2s');
  capBtn.parent(panel);

  capBtn.mousePressed(() => {
    capBtn.style('background', 'rgba(255, 255, 255, 0.5)');
    let timestamp = year() + nf(month(), 2) + nf(day(), 2) + "-" + nf(hour(), 2) + nf(minute(), 2) + nf(second(), 2);
    saveCanvas('DNS-' + timestamp, 'png');
  });

  capBtn.mouseReleased(() => {
    capBtn.style('background', 'rgba(255, 255, 255, 0.2)');
  });

  panel.parent(document.body);
}

// ============================================================
// IS SKIN TONE — RGB heuristic for skin detection
// Tune thresholds here if detection is too sensitive/weak
// ============================================================
function isSkinTone(r, g, b) {
  return (
    r > 95 && g > 40 && b > 20 && // Minimum per-channel brightness
    r > g  && r > b  &&            // Red is dominant channel
    abs(r - g) > 15  &&            // Meaningful red–green gap
    r - g > 10                     // Secondary dominance check
  );
}

// ============================================================
// DRAW — runs every frame
// Order:
//   1. Loading guard
//   2. Clear to black
//   3. Load camera pixels
//   4. Update dots (repulsion + grow/shrink)
//   5. Draw connection lines between big dots
//   6. Draw normal dots (camera-coloured)
//   7. Draw skin dots (palette-coloured with lerp)
// ============================================================
function draw() {

  // ---- 1. LOADING GUARD ----
  if (!camReady) {
    background(0);
    fill(255);
    textAlign(CENTER, CENTER);
    text("Waiting for camera...", width / 2, height / 2);
    return;
  }

  // ---- 2. CLEAR BACKGROUND ----
  background(0);

  // ---- 3. LOAD CAMERA PIXELS ----
  // Populates cam.pixels[] with current webcam frame for sampling
  cam.loadPixels();

  let skinDots   = [];
  let normalDots = [];

  // ---- 4. UPDATE DOTS ----
  for (let dot of dots) {

    // -- Mouse repulsion --
    let dxM = dot.x - mouseX;
    let dyM = dot.y - mouseY;
    let distMouse = sqrt(dxM * dxM + dyM * dyM);
    if (distMouse < MOUSE_RADIUS) {
      dot.x += dxM * MOUSE_FORCE;
      dot.y += dyM * MOUSE_FORCE;
    }

    // -- Sample mirrored camera pixel under dot --
    let sampleX = width - floor(dot.x);
    let py      = floor(dot.y);
    let index   = (py * cam.width + sampleX) * 4;

    let r = cam.pixels[index];
    let g = cam.pixels[index + 1];
    let b = cam.pixels[index + 2];

    // -- Grow or shrink --
    if (isSkinTone(r, g, b)) {
      dot.x += random(-SCATTER_AMOUNT, SCATTER_AMOUNT);
      dot.y += random(-SCATTER_AMOUNT, SCATTER_AMOUNT);
      dot.size = min(dot.size + GROW_SPEED, MAX_SIZE);
      skinDots.push(dot);
    } else {
      dot.size = max(dot.size - SHRINK_SPEED, MIN_SIZE);
      normalDots.push(dot);
    }
  }

  // ---- 5. DRAW CONNECTION LINES ----
  // Only dots above BIG_THRESHOLD of MAX_SIZE get connected
  let bigDots = dots.filter(d => d.size > MAX_SIZE * BIG_THRESHOLD);

  for (let i = 0; i < bigDots.length; i++) {
    for (let j = i + 1; j < bigDots.length; j++) {
      let dx = bigDots[i].x - bigDots[j].x;
      let dy = bigDots[i].y - bigDots[j].y;
      let d  = sqrt(dx * dx + dy * dy);

      if (d < CONNECT_THRESHOLD) {
        // sizeWeight: 0 at threshold, 1 at MAX_SIZE
        // distWeight: 1 when touching, 0 at CONNECT_THRESHOLD
        let sizeWeight = map(min(bigDots[i].size, bigDots[j].size), MAX_SIZE * BIG_THRESHOLD, MAX_SIZE, 0, 1);
        let distWeight = map(d, 0, CONNECT_THRESHOLD, 1, 0);
        let alpha  = sizeWeight * distWeight * 255;
        let weight = sizeWeight * distWeight * LINE_WEIGHT;

        // Blend both dots' palette colours for the line
        let c1 = bigDots[i].col;
        let c2 = bigDots[j].col;
        stroke(
          (c1[0] + c2[0]) / 2,
          (c1[1] + c2[1]) / 2,
          (c1[2] + c2[2]) / 2,
          alpha
        );
        strokeWeight(weight);
        line(bigDots[i].x, bigDots[i].y, bigDots[j].x, bigDots[j].y);
      }
    }
  }

  // ---- 6. DRAW NORMAL DOTS ----
  // Coloured by the camera pixel beneath them
  noStroke();
  for (let dot of normalDots) {
    let sampleX = width - floor(dot.x);
    let py      = floor(dot.y);
    let index   = (py * cam.width + sampleX) * 4;
    fill(
      cam.pixels[index],
      cam.pixels[index + 1],
      cam.pixels[index + 2],
      NORMAL_ALPHA
    );
    circle(dot.x, dot.y, dot.size);
  }

  // ---- 7. DRAW SKIN DOTS ----
  // Lerp from camera colour (small) to palette colour (full size)
  noStroke();
  for (let dot of skinDots) {
    // t=0 at MIN_SIZE → camera colour, t=1 at MAX_SIZE → palette colour
    let t = map(dot.size, MIN_SIZE, MAX_SIZE, 0, 1);

    let sampleX = width - floor(dot.x);
    let py      = floor(dot.y);
    let index   = (py * cam.width + sampleX) * 4;
    let cr = cam.pixels[index];
    let cg = cam.pixels[index + 1];
    let cb = cam.pixels[index + 2];

    fill(
      lerp(cr, dot.col[0], t),
      lerp(cg, dot.col[1], t),
      lerp(cb, dot.col[2], t)
    );
    circle(dot.x, dot.y, dot.size);
  }
}

// ============================================================
// WINDOW RESIZED — resizes canvas to match browser window
// ============================================================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
