const eventHandlers = {};

function addListener(node, event, handler, capture) {
  if (!(node in eventHandlers)) {
    // _eventHandlers stores references to nodes
    eventHandlers[node] = {};
  }
  if (!(event in eventHandlers[node])) {
    // each entry contains another entry for each event type
    eventHandlers[node][event] = [];
  }
  // capture reference
  eventHandlers[node][event].push([handler, capture]);
  node.addEventListener(event, handler, capture);
}

function removeAllListeners(node, event) {
  if (node in eventHandlers) {
    const handlers = eventHandlers[node];
    if (event in handlers) {
      const eventHandlers_ = handlers[event];
      for (let i = eventHandlers_.length; i--;) {
        const handler = eventHandlers_[i];
        node.removeEventListener(event, handler[0], handler[1]);
      }
    }
  }
}

function setActive(selector) {
  const frameElems = document.querySelectorAll(selector);

  frameElems.forEach(elem => {
    const handler = () => {
      elem.classList.toggle('active');
      elem.parentNode.classList.toggle('active');
      document.querySelectorAll(selector).forEach(el => {
        if (elem !== el) {
          el.classList.remove('active');
          el.parentNode.classList.remove('active');
        }
      });
      const destCanvas = document.querySelector('#canvas-container');
      const destCtx = destCanvas.getContext('2d');
      destCtx.clearRect(0, 0, destCtx.canvas.width, destCtx.canvas.height);
      destCtx.drawImage(elem, 0, 0, destCtx.canvas.width, destCtx.canvas.height);
    };
    removeAllListeners(elem, 'click');
    addListener(elem, 'click', handler, false);
  });
}

function drawLines() {
  const canvas = document.getElementById('canvas-container');
  const ctx = canvas.getContext('2d');
  // last known position
  const pos = { x: 0, y: 0 };
  // resize canvas
  function resize() {
    ctx.canvas.width = canvas.width;
    ctx.canvas.height = canvas.height;
  }
  // new position from mouse event
  function setPosition(e) {
    const rect = canvas.getBoundingClientRect();
    pos.x = e.clientX - rect.left;
    pos.y = e.clientY - rect.top;
  }

  function draw(e) {
    // mouse left button must be pressed
    if (e.buttons !== 1) return;

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.fillStyle = '#090';
    ctx.fillRect(pos.x - 15, pos.y - 15, 30, 30);
  }

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', draw);
  document.addEventListener('mousedown', draw);
  document.addEventListener('mouseup', () => {
    const destCanvas = document.querySelector('.canvas-frame.active');
    if (destCanvas !== null) {
      const destCtx = destCanvas.getContext('2d');
      destCtx.drawImage(canvas, 0, 0, destCtx.canvas.width, destCtx.canvas.height);
    }
  });
  document.addEventListener('mousedown', setPosition);
  document.addEventListener('mouseenter', setPosition);
}

function getNextFrameNum() {
  const frameNums = [];
  document.querySelectorAll('.frame-number').forEach(el => {
    frameNums.push(parseInt(el.classList[1].replace(/frame-/, ''), 10));
  });
  return Math.max.apply(null, frameNums) + 1;
}

function reorderFrames() {
  let num = 0;
  document.querySelectorAll('.order-num').forEach(el => {
    num += 1;
    el.innerHTML = num;
  });
}

function addDeleteAction(frameNum) {
  document.querySelector(`button.delete.frame-${frameNum}`).addEventListener('click', () => {
    const li = document.querySelector(`.frame-${frameNum}`);
    li.parentNode.removeChild(li);
    reorderFrames();
  });
}

function addDuplicateAction(frameNum) {
  document.querySelector(`button.duplicate.frame-${frameNum}`).addEventListener('click', () => {
    const tpl = document.querySelector('.frametpl');
    const activeFrame = document.querySelector('.frame-number.active');
    const clone = document.importNode(tpl, true);
    const nextNum = getNextFrameNum();

    clone.content.querySelector('li').classList.add(`frame-${nextNum}`);
    const sourceCanvas = document.querySelector('.canvas-frame.active');
    if (sourceCanvas !== null) {
      const destCtx = clone.content.querySelector('canvas').getContext('2d');
      destCtx.drawImage(sourceCanvas, 0, 0, destCtx.canvas.width, destCtx.canvas.height);
    }

    const delButton = clone.content.querySelector('button.delete');
    const dupButton = clone.content.querySelector('button.duplicate');
    delButton.classList.add(`frame-${nextNum}`);
    dupButton.classList.add(`frame-${nextNum}`);
    activeFrame.parentNode.insertBefore(clone.content, activeFrame.nextSibling);

    // // ADD BUTTONS HANDLERS.
    addDeleteAction(nextNum);
    addDuplicateAction(nextNum);
    reorderFrames();
    setActive('.canvas-frame');
  });
}

// Animation;
function activateAnimation() {
  const fps = document.querySelector('.fps-controller').value;
  document.querySelector('.fps-value').innerHTML = fps;
  let offset = 0;
  const destCanvas = document.querySelector('#preview-container');
  const destCtx = destCanvas.getContext('2d');
  document.querySelectorAll('.canvas-frame').forEach(canvas => {
    offset += 1000 / fps;
    setTimeout(() => {
      destCtx.clearRect(0, 0, destCtx.canvas.width, destCtx.canvas.height);
      destCtx.drawImage(canvas, 0, 0, destCtx.canvas.width, destCtx.canvas.height);
    }, offset);
  });

  setTimeout(activateAnimation, offset);
}

function addNewFrameAction() {
  document.querySelector('.addnew').addEventListener('click', () => {
    const tpl = document.querySelector('.frametpl');
    const clone = document.importNode(tpl, true);
    const nextNum = getNextFrameNum();

    clone.content.querySelector('li').classList.add(`frame-${nextNum}`);
    const delButton = clone.content.querySelector('button.delete');
    const dupButton = clone.content.querySelector('button.duplicate');
    delButton.classList.add(`frame-${nextNum}`);
    dupButton.classList.add(`frame-${nextNum}`);

    document.querySelector('.preview-list').appendChild(clone.content);
    // DELETE ACTION.
    addDeleteAction(nextNum);
    /* DUPLICAT BUTTON LOGIC */
    addDuplicateAction(nextNum);
    reorderFrames();
    setActive('.canvas-frame');
  });
}

window.onload = () => {
  setActive('.canvas-frame');
  drawLines();
  addNewFrameAction();
  requestAnimationFrame(activateAnimation);
};
