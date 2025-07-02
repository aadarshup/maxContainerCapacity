let selectedBoxes = [];

function showTab(tab) {
  document.querySelectorAll(".tab").forEach(div => div.style.display = 'none');
  document.getElementById(tab).style.display = 'block';
  if (tab === 'manage') fetchBoxes();
}

function fetchBoxes() {
  axios.get('/boxes').then(res => {
    let html = '';
    res.data.forEach(b => {
      html += `<div>
        ${b.id} (${b.width}x${b.depth}x${b.height})
        <button onclick="deleteBox('${b.id}')">Delete</button>
      </div>`;
    });
    document.getElementById('box-list').innerHTML = html;
  });
}

function addBox() {
  const box = {
    id: document.getElementById('box-id').value,
    width: parseInt(document.getElementById('box-width').value),
    depth: parseInt(document.getElementById('box-depth').value),
    height: parseInt(document.getElementById('box-height').value)
  };
  axios.post('/boxes', box).then(fetchBoxes);
}

function deleteBox(id) {
  axios.delete('/boxes?id=' + id).then(fetchBoxes);
}

let planBoxes = [];

function addBoxToPlan() {
  axios.get('/boxes').then(res => {
    const dropdown = document.createElement('select');
    res.data.forEach(b => {
      let opt = document.createElement('option');
      opt.value = b.id;
      opt.text = `${b.id} (${b.width}x${b.depth}x${b.height})`;
      dropdown.appendChild(opt);
    });

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.placeholder = 'Qty';
    qtyInput.style.marginLeft = '10px';

    const container = document.getElementById('box-plan-list');
    const row = document.createElement('div');
    row.appendChild(dropdown);
    row.appendChild(qtyInput);
    container.appendChild(row);
  });
}

function packContainer() {
  const container = {
    width: parseInt(document.getElementById('cw').value),
    depth: parseInt(document.getElementById('cd').value),
    height: parseInt(document.getElementById('ch').value)
  };

  const rows = document.querySelectorAll('#box-plan-list > div');
  let box_plan = [];
  rows.forEach(row => {
    const id = row.querySelector('select').value;
    const qty = parseInt(row.querySelector('input').value);
    if (id && qty) {
      box_plan.push({ id, quantity: qty });
    }
  });

  axios.post('/pack', { container, box_plan }).then(result => {
    document.getElementById('result').innerText = "Boxes Placed: " + result.data.count;
    visualize(result.data.placed_boxes);
    // render2DLayers(result.data.placed_boxes, container.height);  // 2D layers
    render2DLayers(result.data.placed_boxes, container.height, container.width, container.depth); // 2D view
  });
}

// function visualize(boxes) {
//   const container = document.getElementById('visual');
//   container.innerHTML = '';

//   const scene = new THREE.Scene();
//   const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
//   const renderer = new THREE.WebGLRenderer();
//   renderer.setSize(500, 500);
//   container.appendChild(renderer.domElement);

//   const colors = ['red', 'green', 'blue', 'yellow', 'orange', 'cyan'];

//   boxes.forEach((b, i) => {
//     const geometry = new THREE.BoxGeometry(b.w, b.h, b.d);
//     const material = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
//     const cube = new THREE.Mesh(geometry, material);
//     // cube.position.set(b.x + b.w / 2, b.h / 2, b.y + b.d / 2); // y = height
//     cube.position.set(b.x + b.w / 2, b.z + b.h / 2, b.y + b.d / 2);
//     scene.add(cube);
//   });

//   camera.position.set(100, 200, 200);
//   camera.lookAt(50, 50, 50);
//   renderer.render(scene, camera);
// }

function visualize(boxes) {
  const container = document.getElementById('visual');
  container.innerHTML = '';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(600, 600);
  container.appendChild(renderer.domElement);

  // 1. Orbit Controls for 360° rotation
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.update();

  // 2. Axes helper (X=Red, Y=Green, Z=Blue)
  const axesHelper = new THREE.AxesHelper(150);
  scene.add(axesHelper);

  // 3. Light
  const light = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(light);

  const colors = ['red', 'green', 'blue', 'yellow', 'orange', 'cyan', 'pink', 'purple'];

  // 4. Draw all boxes
  boxes.forEach((b, i) => {
    const geometry = new THREE.BoxGeometry(b.w, b.h, b.d);
    const material = new THREE.MeshLambertMaterial({ color: colors[i % colors.length] });
    const cube = new THREE.Mesh(geometry, material);

    // Align center of box in 3D space
    cube.position.set(b.x + b.w / 2, b.z + b.h / 2, b.y + b.d / 2);
    scene.add(cube);

    // 5. Label box with ID
    const label = makeTextSprite(b.id);
    label.position.set(b.x + b.w / 2, b.z + b.h + 2, b.y + b.d / 2);
    scene.add(label);
  });

  // Set camera position
  camera.position.set(150, 150, 150);
  camera.lookAt(scene.position);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}


function makeTextSprite(message) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = "Bold 40px Arial";
  context.fillStyle = "rgba(0, 0, 0, 1.0)";
  context.fillText(message, 0, 50);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(20, 10, 1);
  return sprite;
}

// function render2DLayers(boxes, containerHeight) {
//   const container = document.getElementById("visual-layers");
//   container.innerHTML = '';

//   const layers = {};

//   boxes.forEach(box => {
//     const layer = box.z;
//     if (!layers[layer]) layers[layer] = [];
//     layers[layer].push(box);
//   });

//   Object.keys(layers).sort((a, b) => parseInt(a) - parseInt(b)).forEach((layerZ, index) => {
//     const boxesInLayer = layers[layerZ];

//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     canvas.width = 520;
//     canvas.height = 520;
//     canvas.style.border = "1px solid black";
//     canvas.style.marginBottom = "20px";

//     const scale = 5;

//     // Draw axes
//     ctx.strokeStyle = "black";
//     ctx.fillStyle = "black";
//     ctx.font = "14px Arial";
//     ctx.beginPath();
//     ctx.moveTo(10, 500);       // Width (X-axis)
//     ctx.lineTo(150, 500);
//     ctx.stroke();
//     ctx.fillText("Width →", 60, 495);

//     ctx.beginPath();           // Depth (Y-axis)
//     ctx.moveTo(10, 500);
//     ctx.lineTo(10, 350);
//     ctx.stroke();
//     ctx.fillText("↓ Depth", 15, 430);

//     // Draw boxes
//     boxesInLayer.forEach(b => {
//       const x = b.x * scale + 10;
//       const y = b.y * scale + 10;
//       const w = b.w * scale;
//       const d = b.d * scale;

//       ctx.fillStyle = "#"+Math.floor(Math.random()*16777215).toString(16);
//       ctx.fillRect(x, y, w, d);
//       ctx.strokeStyle = "black";
//       ctx.strokeRect(x, y, w, d);

//       ctx.fillStyle = "black";
//       ctx.font = "12px Arial";
//       ctx.fillText(b.id, x + 2, y + 12);
//     });

//     const label = document.createElement('div');
//     label.innerText = `Layer at Height: ${layerZ}`;

//     const saveBtn = document.createElement('button');
//     saveBtn.innerText = "Save Layer Image";
//     saveBtn.onclick = () => {
//       const link = document.createElement('a');
//       link.download = `Layer_${layerZ}.png`;
//       link.href = canvas.toDataURL();
//       link.click();
//     };

//     container.appendChild(label);
//     container.appendChild(canvas);
//     container.appendChild(saveBtn);
//   });
// }


// function render2DLayers(boxes, containerHeight, containerWidth, containerDepth) {
//   const container = document.getElementById("visual-layers");
//   container.innerHTML = '';

//   const layers = {};

//   boxes.forEach(box => {
//     const layer = box.z;
//     if (!layers[layer]) layers[layer] = [];
//     layers[layer].push(box);
//   });

//   Object.keys(layers).sort((a, b) => parseInt(a) - parseInt(b)).forEach((layerZ, index) => {
//     const boxesInLayer = layers[layerZ];

//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     const scale = 5;

//     const canvasW = containerWidth * scale + 40;
//     const canvasH = containerDepth * scale + 40;

//     canvas.width = canvasW;
//     canvas.height = canvasH;
//     canvas.style.border = "1px solid black";
//     canvas.style.marginBottom = "20px";

//     // Draw container border
//     ctx.strokeStyle = "gray";
//     ctx.lineWidth = 2;
//     ctx.strokeRect(20, 20, containerWidth * scale, containerDepth * scale);

//     // Draw axis labels
//     ctx.fillStyle = "black";
//     ctx.font = "14px Arial";
//     ctx.fillText("→ Width (X)", 30 + containerWidth * scale / 2, 15);
//     ctx.fillText("↓ Depth (Z)", 2, 30 + containerDepth * scale / 2);

//     // Draw boxes
//     boxesInLayer.forEach(b => {
//       const x = b.x * scale + 20;
//       const y = b.y * scale + 20;
//       const w = b.w * scale;
//       const d = b.d * scale;

//       ctx.fillStyle = "#" + Math.floor(Math.random() * 16777215).toString(16);
//       ctx.fillRect(x, y, w, d);
//       ctx.strokeStyle = "black";
//       ctx.strokeRect(x, y, w, d);

//       ctx.fillStyle = "black";
//       ctx.font = "12px Arial";
//       ctx.fillText(b.id, x + 2, y + 12);
//     });

//     // Title + Save Button
//     const label = document.createElement('div');
//     label.innerText = `Layer at Height: ${layerZ}`;

//     const saveBtn = document.createElement('button');
//     saveBtn.innerText = "Save Layer Image";
//     saveBtn.onclick = () => {
//       const link = document.createElement('a');
//       link.download = `Layer_${layerZ}.png`;
//       link.href = canvas.toDataURL();
//       link.click();
//     };

//     container.appendChild(label);
//     container.appendChild(canvas);
//     container.appendChild(saveBtn);
//   });
// }


function render2DLayers(boxes, containerHeight) {
  const container = document.getElementById("visual-layers");
  container.innerHTML = '';

  const layers = {};

  boxes.forEach(box => {
    const layer = box.z;
    if (!layers[layer]) layers[layer] = [];
    layers[layer].push(box);
  });

  // Calculate max width and depth occupied
  let maxW = 0, maxD = 0;
  boxes.forEach(b => {
    maxW = Math.max(maxW, b.x + b.w);
    maxD = Math.max(maxD, b.y + b.d);
  });

  const scale = 5;
  const canvasW = maxW * scale + 60;
  const canvasH = maxD * scale + 60;

  Object.keys(layers).sort((a, b) => parseInt(a) - parseInt(b)).forEach((layerZ, index) => {
    const boxesInLayer = layers[layerZ];

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = canvasW;
    canvas.height = canvasH;
    canvas.style.border = "1px solid black";
    canvas.style.marginBottom = "20px";

    const offsetX = 40;
    const offsetY = 40;

    // Draw container border with measurements
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, maxW * scale, maxD * scale);

    // Axis text
    ctx.font = "14px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(`Width → ${maxW} units`, offsetX + maxW * scale / 2 - 40, offsetY + maxD * scale + 30);
    ctx.save();
    ctx.translate(10, offsetY + maxD * scale / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`Depth ↓ ${maxD} units`, 0, 0);
    ctx.restore();

    // Draw each box
    boxesInLayer.forEach(b => {
      const x = b.x * scale + offsetX;
      const y = b.y * scale + offsetY;
      const w = b.w * scale;
      const d = b.d * scale;

      ctx.fillStyle = "#"+Math.floor(Math.random()*16777215).toString(16);
      ctx.fillRect(x, y, w, d);
      ctx.strokeStyle = "black";
      ctx.strokeRect(x, y, w, d);

      ctx.fillStyle = "black";
      ctx.font = "12px Arial";
      ctx.fillText(b.id, x + 2, y + 12);
    });

    const label = document.createElement('div');
    label.innerText = `Layer at Height: ${layerZ}`;

    const saveBtn = document.createElement('button');
    saveBtn.innerText = "Save Layer Image";
    saveBtn.onclick = () => {
      const link = document.createElement('a');
      link.download = `Layer_${layerZ}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };

    container.appendChild(label);
    container.appendChild(canvas);
    container.appendChild(saveBtn);
  });
}
