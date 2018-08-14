const moment = require('moment');
const coco = require('./coco');
const fileJS = require('./file');
const getTool = fileJS.getTool;
const currentTool = fileJS.currentTool;
var image = document.getElementById('image');
var btSave = document.getElementById('btSave');
var ulPoints = document.getElementById('point_list');
var isMouseDown = false;
var isMouseMoved = false;
var mouseDownPoint = { x: 0, y: 0 };
var points = [];
var ppoint = 0;
var cocoImage;
var annotations;

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
    points = [];
    while (ulPoints.firstChild) ulPoints.removeChild(ulPoints.firstChild);
    annotations = coco.getAnnotations(cocoImage.id);
    if (!annotations) return;
    for (var annotation of annotations) {
        var point = {};
        if (annotation.bbox && annotation.bbox.length == 4)
            point.body = { x: annotation.bbox[0], y: annotation.bbox[1], w: annotation.bbox[2], h: annotation.bbox[3] };
        for (var i = 1; i < fileJS.configs().length; i++) {
            if (annotation.keypoints[(i - 1) * 3 + 2] != 0)
                point[fileJS.configs()[i]] = { x: annotation.keypoints[(i - 1) * 3], y: annotation.keypoints[(i - 1) * 3 + 1] };
        }

        var li = document.createElement('div');
        li.setAttribute('id', annotation.id);
        li.addEventListener('click', onClickPerson, false);

        var button = document.createElement('button');
        button.innerHTML = '删除';
        button.style.cssFloat = 'right';
        button.setAttribute('index', points.length);
        button.addEventListener('click', onClickDeletePerson, false);
        li.appendChild(button);
        ulPoints.appendChild(li);

        points.push(point);
    }
    if (annotations.length == 0) onClickAddPerson();
    else appendAddPerson();
}

function appendAddPerson() {
    var li = document.createElement('div');
    li.innerHTML = '新建';
    li.className = 'point';
    li.addEventListener('click', onClickAddPerson, false);
    ulPoints.appendChild(li);

    updatePersons();
}

function onClickPerson(event) {
    console.log(event);
    var index = event.target.getAttribute('index');
    console.log(index);
    ppoint = Number(index);
    updatePersons();
}

function onClickAddPerson(event) {
    if (ulPoints.lastChild) ulPoints.removeChild(ulPoints.lastChild);
    var li = document.createElement('div');
    li.addEventListener('click', onClickPerson, false);
    ulPoints.appendChild(li);

    ppoint = points.length;
    points.push({});
    appendAddPerson();
}

function updatePersons() {
    var i = 0;
    for (var child of ulPoints.children) {
        if (i >= ulPoints.children.length - 1) break;
        child.setAttribute('index', i);
        child.innerHTML = (i + 1) + '. id = ' + child.getAttribute('id');
        child.className = 'point' + (child.getAttribute('index') == ppoint.toString() ? ' selected' : '');

        var button = document.createElement('button');
        button.innerHTML = '删除';
        button.style.cssFloat = 'right';
        button.setAttribute('index', i);
        button.addEventListener('click', onClickDeletePerson, false);
        child.appendChild(button);
        i++;
    }
}

function onClickDeletePerson(event) {
    console.log(event);
    event.preventDefault();
    event.stopPropagation();

    var index = event.target.getAttribute('index');
    if (ppoint > 1 && ppoint >= Number(index)) ppoint--;
    points.splice(Number(index), 1);

    for (var li of ulPoints.children) {
        if (li.getAttribute('index') == index) {
            ulPoints.removeChild(li);
            break;
        }
    }
    updatePersons();
    render();
}

function onMouseClick(event) {
    console.log('click');
    var point = toCanvas(event.layerX, event.layerY);
    if (currentTool().config != 'body')
        points[ppoint][currentTool().config] = point;
}

function onMouseDown(event) {
    console.log(event);
    isMouseDown = true;
    mouseDownPoint = toCanvas(event.layerX, event.layerY);
    if (currentTool().config == 'body')
        points[ppoint][currentTool().config] = toCanvas(event.layerX, event.layerY);
}

function onMouseMove(event) {
    if (isMouseDown) {
        console.log(event);
        if (distance(event.layerX, event.layerY, mouseDownPoint.x, mouseDownPoint.y) > 10) isMouseMoved = true;

        var point = toCanvas(event.layerX, event.layerY);
        if (currentTool().config == 'body') {
            points[ppoint][currentTool().config].w = point.x - mouseDownPoint.x;
            points[ppoint][currentTool().config].h = point.y - mouseDownPoint.y;
        } else {
            points[ppoint][currentTool().config] = point;
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
        points[ppoint]['body'].w = Math.abs(point.x - mouseDownPoint.x);
        points[ppoint]['body'].h = Math.abs(point.y - mouseDownPoint.y);
        points[ppoint]['body'].x = Math.min(point.x, points[ppoint]['body'].x);
        points[ppoint]['body'].y = Math.min(point.y, points[ppoint]['body'].y);
    }
    render();
}

function onMouseLeave(event) {
    console.log('leave');
    // isMouseDown = false;
    // isMouseMoved = false;
}

function onClickSave(event) {
    for (var i = 0; i < points.length; i++)
        coco.setAnnotation(cocoImage.id, annotations[i] ? annotations[i].id : null, points[i]);
    coco.writeCoco();
    getAnnotations();
}

function render() {
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    console.log(context.lineWidth);
    var width = Math.max(Math.max(image.naturalWidth / image.width, image.naturalHeight / image.height), 1) * 2;
    var widthBorder = width + 2 * Math.min(1, Math.max(image.naturalWidth / image.width, image.naturalHeight / image.height));
    for (var pt of points) {
        for (var config in pt) {
            var point = pt[config];
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
        points[ppoint][fileJS.currentTool().config] = null;
        render();
    }
}

image.addEventListener('load', onImageChange, false);
btSave.addEventListener('click', onClickSave, false);
document.addEventListener('keydown', onKeyDown, false);