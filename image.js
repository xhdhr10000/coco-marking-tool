const moment = require('moment');
const coco = require('./coco');
const fileJS = require('./file');
const getTool = fileJS.getTool;
const currentTool = fileJS.currentTool;
var image = document.getElementById('image');
var btSave = document.getElementById('btSave');
var isMouseDown = false;
var isMouseMoved = false;
var mouseDownPoint = { x: 0, y: 0 };
var points = {};
var cocoImage;
var annotation;

var canvas = null;

function onImageChange(event) {
    console.log(event);
    var file = fileJS.getImage();
    cocoImage = coco.getImage(file.name);
    if (!cocoImage) cocoImage = coco.setImage(file.name, image.naturalWidth, image.naturalHeight, moment(file.lastModified).format('YYYY-MM-DD HH:mm:ss'));
    getAnnotations();
    createCanvas();
}

function createCanvas() {
    var rect = image.getBoundingClientRect();
    if (canvas) document.body.removeChild(canvas);
    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '8px';
    canvas.style.left = '8px';
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.style.zIndex = image.zIndex + 1;
    document.body.appendChild(canvas);

    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mouseleave', onMouseLeave, false);

    render();
}

function getAnnotations() {
    points = {};
    annotation = coco.getAnnotation(cocoImage.id);
    if (!annotation) return;
    if (annotation.bbox && annotation.bbox.length == 4)
        points.body = { x: annotation.bbox[0], y: annotation.bbox[1], w: annotation.bbox[2], h: annotation.bbox[3] };
    for (var i = 1; i < fileJS.configs().length; i++) {
        if (annotation.keypoints[(i - 1) * 3 + 2] != 0)
            points[fileJS.configs()[i]] = { x: annotation.keypoints[(i - 1) * 3], y: annotation.keypoints[(i - 1) * 3 + 1] };
    }
}

function onMouseClick(event) {
    console.log('click');
    var point = toCanvas(event.layerX, event.layerY);
    if (currentTool().config != 'body')
        points[currentTool().config] = point;
}

function onMouseDown(event) {
    console.log(event);
    isMouseDown = true;
    mouseDownPoint = toCanvas(event.layerX, event.layerY);
    if (currentTool().config == 'body')
        points[currentTool().config] = toCanvas(event.layerX, event.layerY);
}

function onMouseMove(event) {
    if (isMouseDown) {
        console.log(event);
        if (distance(event.layerX, event.layerY, mouseDownPoint.x, mouseDownPoint.y) > 10) isMouseMoved = true;

        var point = toCanvas(event.layerX, event.layerY);
        if (currentTool().config == 'body') {
            points[currentTool().config].w = point.x - mouseDownPoint.x;
            points[currentTool().config].h = point.y - mouseDownPoint.y;
        } else {
            points[currentTool().config] = point;
        }
        console.log(points);
        render();
    }
}

function onMouseUp(event) {
    console.log(event);
    isMouseDown = false;
    if (!isMouseMoved) onMouseClick(event);
    isMouseMoved = false;

    var point = toCanvas(event.layerX, event.layerY);
    if (currentTool().config == 'body') {
        points['body'].w = Math.abs(point.x - mouseDownPoint.x);
        points['body'].h = Math.abs(point.y - mouseDownPoint.y);
        points['body'].x = Math.min(point.x, points['body'].x);
        points['body'].y = Math.min(point.y, points['body'].y);
    }
    render();
}

function onMouseLeave(event) {
    console.log('leave');
    // isMouseDown = false;
    // isMouseMoved = false;
}

function onClickSave(event) {
    coco.setAnnotation(cocoImage.id, annotation ? annotation.id : null, points);
}

function render() {
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    console.log(context.lineWidth);
    var width = Math.max(Math.max(image.naturalWidth / image.width, image.naturalHeight / image.height), 1) * 2;
    var widthBorder = width + 2 * Math.min(1, Math.max(image.naturalWidth / image.width, image.naturalHeight / image.height));
    for (var config in points) {
        var point = points[config];
        if (!point) continue;
        if (config == 'body') {
            context.beginPath();
            context.lineWidth = widthBorder;
            context.strokeStyle = '#000000';
            context.strokeRect(point.x, point.y, point.w, point.h);
            context.beginPath();
            context.lineWidth = width;
            context.strokeStyle = getTool(config).color;
            context.strokeRect(point.x, point.y, point.w, point.h);
        } else {
            context.beginPath();
            context.fillStyle = '#000000';
            context.arc(point.x, point.y, widthBorder, 0, Math.PI * 2);
            context.fill();
            context.beginPath();
            context.fillStyle = getTool(config).color;
            context.arc(point.x, point.y, width, 0, Math.PI * 2);
            context.fill();
        }
    }
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

function toCanvas(x, y) {
    return { x: x / image.width * image.naturalWidth, y: y / image.height * image.naturalHeight };
}

window.onresize = function (event) {
    console.log(event);
    createCanvas();
};

function onKeyDown(event) {
    console.log(event);
    if (event.key == 'Escape') {
        points[fileJS.currentTool().config] = null;
        render();
    }
}

image.addEventListener('load', onImageChange, false);
btSave.addEventListener('click', onClickSave, false);
document.addEventListener('keydown', onKeyDown, false);