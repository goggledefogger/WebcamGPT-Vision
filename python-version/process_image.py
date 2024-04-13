import os
import logging

logging.basicConfig(level=logging.INFO)

import requests
from flask import Flask, request, jsonify, Response

app = Flask(__name__, static_folder='src', static_url_path='/')

# run app on a specific port and host
PORT = os.environ.get('PORT', 5000)
HOST = os.environ.get('HOST', '0.0.0.0')

AI_HOST = os.environ.get('AI_HOST', '192.168.11.11')
AI_PORT = os.environ.get('AI_PORT', 1234)

logging.info(f"AI_HOST: {AI_HOST}, AI_PORT: {AI_PORT}")

# Replace 'YOUR_DEFAULT_API_KEY' with the name of the environment variable
DEFAULT_API_KEY = os.environ.get('YOUR_DEFAULT_API_KEY', 'YOUR_DEFAULT_API_KEY')

image_prompt = "Describe the image in detail"

# load image prompt from a file
with open('image_prompt.txt', 'r') as f:
    image_prompt = f.read()

@app.route('/')
def index():
    """Return the index.html page."""
    return app.send_static_file('index.html')

@app.route('/capture_image')
def capture_image():
    # Capture image using the webcam attached to the Raspberry Pi
    camera = cv2.VideoCapture(0)
    ret, frame = camera.read()
    camera.release()

    if ret:
        # Convert the image to JPEG format
        _, img_encoded = cv2.imencode('.jpg', frame)
        base64_image = base64.b64encode(img_encoded).decode('utf-8')

        api_key = DEFAULT_API_KEY
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        payload = {
            "model": "gpt-4-vision-preview",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": image_prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 300
        }
        response = requests.post(
            f"http://{AI_HOST}:{AI_PORT}/v1/chat/completions",
            headers=headers,
            json=payload
        )
        if response.status_code != 200:
            return jsonify({'error': 'Failed to process the image.'}), 500
        return Response(response.content, mimetype='application/json')
    else:
        return jsonify({'error': 'Failed to capture image.'}), 500

@app.route('/process_image', methods=['POST'])
def process_image():
    data = request.json
    base64_image = data.get('image', '')

    if base64_image:
        api_key = DEFAULT_API_KEY
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }

        payload = {
            "model": "gpt-4-vision-preview",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": image_prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 300
        }

        response = requests.post(
            "http://localhost:1234/v1/chat/completions",
            headers=headers,
            json=payload
        )

        if response.status_code != 200:
            return jsonify({'error': 'Failed to process the image.'}), 500
        return response.content

    else:
        return jsonify({'error': 'No image data received.'}), 400


if __name__ == '__main__':
    app.run(debug=True, port=PORT, host=HOST)
