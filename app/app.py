import os
from flask import Flask, request, jsonify
import numpy as np
from werkzeug.utils import secure_filename
import shutil

from datetime import datetime

import requests

from druginfo import parser
from tesseract import tesseract

import imageio

app = Flask(__name__)

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
ALLOWED_EXTENSIONS = set([
    'jpg',
    'jpeg',
    'png'
])

def is_allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def greet():
    return 'greetings from drug-reminder'

@app.route('/process-url', methods=['POST'])
def process_url():
    url = request.values['url']
    res = requests.get(url, stream=True)

    if res.status == 200:
        filename = secure_filename(url) + datetime.now().strftime('%Y-%m-%d(%H-%M-%S)')
        save_destination = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        with open(save_destination, 'wb') as tmp_image_file:
            shutil.copyfileobj(res.raw, tmp_image_file)
        del res

        image_as_nparray = np.array(imageio.imread(save_destination))

        # print(type(image_as_nparray), image_as_nparray.shape)
        text_from_image = tesseract.getText(image_as_nparray)
        drug_info = parser.getDrugInfo(text_from_image)

        if not app.config['KEEP_FILES']:
            os.remove(save_destination)

        return jsonify(drug_info)

@app.route('/process', methods=['POST'])
def process_image():
    if request.method == 'POST':
        if 'file' not in request.files:
            return 'no file part in request', 400
        file = request.files['file']

        if file.filename == '':
            return 'empty file part', 400
        if file and is_allowed_file(file.filename):
            filename = secure_filename(file.filename) + datetime.now().strftime('%Y-%m-%d(%H-%M-%S)')
            save_destination = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(save_destination)

            image_as_nparray = np.array(imageio.imread(save_destination))

            # print(type(image_as_nparray), image_as_nparray.shape)
            text_from_image = tesseract.getText(image_as_nparray)
            drug_info = parser.getDrugInfo(text_from_image)

            if not app.config['KEEP_FILES']:
                os.remove(save_destination)

            return jsonify(drug_info)

@app.route('/test-upload', methods=['GET'])
def test_upload_form():
    if app.config['TEST_UPLOAD_FORM']:
        return f'''
        <!doctype html>
        <title>Upload File</title>
        <h1>Upload File</h1>
        <p> allowed extensions: {', '.join(ALLOWED_EXTENSIONS)} </p>
        <form action="/process" method=post enctype=multipart/form-data>
            <p><input type=file name=file>
            <input type=submit value=Upload>
        </form>
        '''
    return 'not enabled', 401