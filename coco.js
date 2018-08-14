const fs = require('fs');
const moment = require('moment');
var coco;
var path;

function readCoco(dir) {
    console.log('getCoco: ' + dir);
    path = dir + 'coco.json';
    try {
        var data = fs.readFileSync(path, 'utf8');
        coco = JSON.parse(data);
        console.log(coco);
        return true;
    } catch (e) {
        createCoco();
        return false;
    }
}

function writeCoco() {
    try {
        console.log('writeCoco');
        if (!coco) createCoco();
        fs.writeFileSync(path, JSON.stringify(coco));
    } catch (e) {
        console.error(e);
    }
}

function createCoco() {
    console.log('createCoco: ' + path);
    var info = {
        'description': 'Penguins COCO dataset',
        'url': 'http://penguinsinnovate.com',
        'version': '1.0',
        'year': 2018,
        'contributor': 'penguins',
        'date_created': moment().format('YYYY/MM/DD'),
    };
    var licenses = [];
    var images = [];
    var annotations = [];
    var categories = [{
        'id': 1,
        'supercategory': 'person',
        'name': 'person',
        'keypoints': [
            'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
            'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist',
            'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
        ],
        'skeleton': [
            [16, 14], [14, 12], [17, 15], [15, 13], [12, 13], [6, 12], [7, 13], [6, 7], [6, 8],
            [7, 9], [8, 10], [9, 11], [2, 3], [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7]
        ],
    }];
    coco = { info, licenses, images, annotations, categories };
    console.log(coco);

    fs.writeFileSync(path, JSON.stringify(coco));
}

function getImage(name) {
    if (!coco || !coco.images) return;
    for (var image of coco.images)
        if (image.file_name == name) return image;
}

function setImage(name, width, height, date_captured) {
    if (!coco || !coco.images) return;
    for (var image of coco.images) {
        if (image.name == name) {
            image.width = width;
            image.height = height;
            image.date_captured = date_captured;
            return image.id;
        }
    }

    var image = {
        'license': 1,
        'file_name': name,
        'width': width,
        'height': height,
        'date_captured': date_captured,
        'id': coco.images.length == 0 ? 1 : coco.images[coco.images.length - 1].id + 1,
    };
    coco.images.push(image);
    writeCoco();
    return image;
}

function getAnnotations(image_id) {
    if (!coco || !coco.annotations) return;
    var annotations = [];
    for (var annotation of coco.annotations)
        if (annotation.image_id == image_id) annotations.push(annotation);
    return annotations;
}

function setAnnotation(image_id, id, points) {
    const fileJS = require('./file');
    if (!coco || !coco.annotations || !image_id) return;
    if (id) {
        for (var i = 0; i < coco.annotations.length; i++) {
            if (coco.annotations[i].image_id == image_id && coco.annotations[i].id == id) {
                var keypoints = [];
                var num_keypoints = 0;
                for (var j = 0; j < fileJS.configs().length; j++) {
                    var config = fileJS.configs()[j];
                    if (config == 'body') {
                        var point = points[config];
                        if (point) coco.annotations[i].bbox = [point.x, point.y, point.w, point.h];
                    } else {
                        if (!points[config] || points[config].x == null && points[config].y == null) {
                            keypoints.push(0);
                            keypoints.push(0);
                            keypoints.push(0);
                        } else {
                            keypoints.push(points[config].x);
                            keypoints.push(points[config].y);
                            keypoints.push(2);
                            num_keypoints++;
                        }
                    }
                }
                coco.annotations[i].keypoints = keypoints;
                coco.annotations[i].num_keypoints = num_keypoints;
                return coco.annotations[i];
            }
        }
    }

    var annotation = {
        'segmentation': [],
        'area': 0,
        'iscrowd': 0,
        'image_id': image_id,
        'category_id': 1,
        'id': coco.annotations.length == 0 ? 1 : coco.annotations[coco.annotations.length - 1].id + 1,
    };
    var keypoints = [];
    var num_keypoints = 0;
    for (var i = 0; i < fileJS.configs().length; i++) {
        var config = fileJS.configs()[i];
        if (config == 'body') {
            var point = points[config];
            if (point) annotation.bbox = [point.x, point.y, point.w, point.h];
        } else {
            if (!points[config]) {
                keypoints.push(0);
                keypoints.push(0);
                keypoints.push(0);
            } else {
                keypoints.push(points[config].x);
                keypoints.push(points[config].y);
                keypoints.push(2);
                num_keypoints++;
            }
        }
    }
    annotation.num_keypoints = num_keypoints;
    annotation.keypoints = keypoints;
    coco.annotations.push(annotation);
    return annotation;
}

function getCategory() {
    console.log(coco.categories);
    if (!coco || !coco.categories || coco.categories.length == 0) return;
    return coco.categories[0];
}

module.exports = {
    readCoco, writeCoco, getImage, setImage, getAnnotations, setAnnotation, getCategory,
}