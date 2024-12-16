const imageUpload = document.getElementById('imageUpload');
const dropArea = document.getElementById('dropArea');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const colorPalette = document.getElementById('colorPalette');

let image = new Image();

// ** Drag-and-Drop Funksionallığı **

// ** Drag-and-drop funksiyası üçün standart davranışı dayandırır **
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false)
});

// Bu funksiya drag-and-drop davranışını (sürüklə-və-burax) dayandırır
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// ** Fayl sürüklənərkən drop sahəsini vurğulayır **
['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false)
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false)
});

// ** Fayl dərhal drop ediləndə şəkilin emalını başlat **
dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  const file = e.dataTransfer.files[0];
  processFile(file);
}

// ** Fayl yükləndikdə faylı emal et **
imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  processFile(file);
});

// ** Şəkili fayldan oxuyur və ekrana yükləyir **
function processFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Xahiş edirik, şəkil faylı yükləyin.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    image.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// ** Şəkil yüklənəndə canvas-a (əsas şəkil sahəsinə) çəkilir **
image.onload = function () {
  canvas.width = image.width / 2; 
  canvas.height = image.height / 2;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = extractPixels(imageData);
  const clusters = kMeansClustering(pixels, 5); // 5 dominant rəng təyin edilir
  displayColorPalette(clusters);
};

// ** Şəkilin piksellərini RGB rəng dəyərləri şəklində çıxarır **
function extractPixels(imageData) {
  const pixels = [];
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    pixels.push([r, g, b]);
  }
  return pixels;
}

// ** K-means klasterləşdirmə alqoritmi **
function kMeansClustering(pixels, k) {
  const centroids = initializeCentroids(pixels, k); // 1. Addım: Mərkəzələri təyin et
  let assignments = new Array(pixels.length).fill(-1);
  let hasChanged = true;
  let iterations = 0;

  while (hasChanged && iterations < 100) {
    hasChanged = false;
    iterations++;

    // 2. Hər bir pikseli ən yaxın mərkəzə təyin et
    for (let i = 0; i < pixels.length; i++) {
      const distances = centroids.map((centroid) => getDistance(pixels[i], centroid));
      const closestCentroid = distances.indexOf(Math.min(...distances));

      if (assignments[i] !== closestCentroid) {
        assignments[i] = closestCentroid;
        hasChanged = true;
      }
    }

    // 3. Mərkəzələri yenilə
    const newCentroids = Array(k).fill(null).map(() => [0, 0, 0, 0]);
    for (let i = 0; i < pixels.length; i++) {
      const centroidIndex = assignments[i];
      newCentroids[centroidIndex][0] += pixels[i][0];
      newCentroids[centroidIndex][1] += pixels[i][1];
      newCentroids[centroidIndex][2] += pixels[i][2];
      newCentroids[centroidIndex][3] += 1;
    }

    for (let i = 0; i < newCentroids.length; i++) {
      const count = newCentroids[i][3] || 1;
      centroids[i] = [
        Math.round(newCentroids[i][0] / count),
        Math.round(newCentroids[i][1] / count),
        Math.round(newCentroids[i][2] / count)
      ];
    }
  }

  return centroids;
}

// ** Mərkəzələri təyin et (təsədüfi) **
function initializeCentroids(pixels, k) {
  const centroids = [];
  while (centroids.length < k) {
    const randomIndex = Math.floor(Math.random() * pixels.length);
    centroids.push(pixels[randomIndex]);
  }
  return centroids;
}

// ** 2 piksel arasında məsafəni hesablamaq **
function getDistance(pixel1, pixel2) {
  return Math.sqrt(
    Math.pow(pixel1[0] - pixel2[0], 2) +
    Math.pow(pixel1[1] - pixel2[1], 2) +
    Math.pow(pixel1[2] - pixel2[2], 2)
  );
}

// ** Dominant rəngləri ekranda göstər **
function displayColorPalette(clusters) {
  colorPalette.innerHTML = '';
  clusters.forEach((color) => {
    const [r, g, b] = color;
    const colorBox = document.createElement('div');
    colorBox.classList.add('color-box');
    colorBox.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    colorPalette.appendChild(colorBox);
  });
}
