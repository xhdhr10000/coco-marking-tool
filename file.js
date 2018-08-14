const fs = require('fs');
const coco = require('./coco');
var directory;
var images = [];
var pimage = 0;
var inputFiles = document.getElementById('files');
var btPrev = document.getElementById('btPrev');
var btNext = document.getElementById('btNext')
var image = document.getElementById('image');
var toolbox = document.getElementById('toolbox');
var configs = [];
var tools = [];
var toolIndex = 0;

const shortcuts = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O'];
const colors = ['#9E9E9E', '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#607D8B'];

function handleFileSelect(event) {
    var files = event.target.files; // FileList object
    console.log(files);

    // files is a FileList of File objects. List some properties.
    images = [];
    pimage = 0;
    directory = null;
    btPrev.disabled = true;
    btNext.disabled = true;
    for (var i = 0, f; f = files[i]; i++) {
        if (f.type.indexOf('image') >= 0) {
            if (!directory) directory = f.path.substr(0, f.path.indexOf(f.name));
            images.push(f);
        }
    }
    if (images.length > 1) btNext.disabled = false;
    if (directory && directory.length > 0) {
        if (coco.readCoco(directory)) {
            var category = coco.getCategory();
            console.log(category);
            setConfigs(category.keypoints);
        } else {
            setConfigs([
                'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
                'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist',
                'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
            ]);
        }
    }
    image.src = images[pimage].path;
}

function setConfigs(cs) {
    configs = ['body'].concat(cs);
    tools = [];
    while (toolbox.firstChild) toolbox.removeChild(toolbox.firstChild);
    for (var config of configs) {
        if (!config || config.length == 0) continue;
        var index = configs.indexOf(config);
        var shortcut = (index < shortcuts.length) ? shortcuts[index] + ': ' : '';
        tools.push({ index, config, color: colors[index] });

        var button = document.createElement('button');
        button.id = config;
        button.setAttribute('index', index);
        button.innerText = shortcut + config;
        button.addEventListener('click', onClickTool, false);
        if (index == toolIndex) button.disabled = true;
        toolbox.appendChild(button);
    }
}

function onClickPrev(event) {
    console.log('previous');
    pimage--;
    image.src = images[pimage].path;
    btPrev.disabled = pimage <= 0;
    btNext.disabled = pimage >= images.length - 1;
}

function onClickNext(event) {
    console.log('next');
    pimage++;
    image.src = images[pimage].path;
    btPrev.disabled = pimage <= 0;
    btNext.disabled = pimage >= images.length - 1;
}

function onSelectConfig(event) {
    try {
        var file = event.target.files[0];
        var data = fs.readFileSync(file.path, 'utf8');
        configs = data.split('\n');
        if (configs && configs.length > 0) {
            while (toolbox.firstChild) toolbox.removeChild(toolbox.firstChild);
            setConfigs(configs);
        }
    } catch (e) {
        console.error(e);
    }
}

function onClickTool(event) {
    toolIndex = event.target.getAttribute('index');
    console.log(toolIndex);
    updateToolButtons();
}

function updateToolButtons() {
    for (var config of configs) {
        if (!config || config.length == 0) continue;
        if (configs.indexOf(config) == toolIndex)
            document.getElementById(config).disabled = true;
        else
            document.getElementById(config).disabled = false;
    }
}

function onKeyPress(event) {
    var index = shortcuts.indexOf(event.key.toUpperCase());
    if (index >= 0 && index < configs.length) toolIndex = index;
    updateToolButtons();
}

inputFiles.addEventListener('change', handleFileSelect, false);
btPrev.addEventListener('click', onClickPrev, false);
btNext.addEventListener('click', onClickNext, false);
document.addEventListener('keypress', onKeyPress, false);

module.exports = {
    configs: function () { return configs },
    tools: function () { return tools },
    currentTool: function () { return tools[toolIndex] },
    getTool: function (config) { for (var tool of tools) if (tool.config == config) return tool },
    getImage: function () { return images[pimage] },
};