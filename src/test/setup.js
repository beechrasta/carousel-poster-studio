import '@testing-library/jest-dom';

// Mock HTMLCanvasElement and 2D Context for Node/jsdom test runner
HTMLCanvasElement.prototype.getContext = function () {
  return {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    font: '16px sans-serif',
    textAlign: 'left',
    textBaseline: 'top',
    fillRect: () => {},
    clearRect: () => {},
    fillText: () => {},
    stroke: () => {},
    fill: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arcTo: () => {},
    roundRect: () => {},
    save: () => {},
    restore: () => {},
    clip: () => {},
    drawImage: () => {},
    setLineDash: () => {},
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
    measureText: (text) => ({
      width: (text || '').length * 10,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
    }),
  };
};

HTMLCanvasElement.prototype.toBlob = function (callback, mimeType) {
  const blob = new Blob(['mock-canvas-png-bytes'], { type: mimeType || 'image/png' });
  callback(blob);
};
