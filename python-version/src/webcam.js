// Initialize the webcam and set event listeners
function initializeWebcam() {
  const video = document.getElementById('webcam');
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error('getUserMedia error:', error);
      // You can update this to show an error message to the user in the UI.
    });
}

// Function to capture image from webcam and process it
function captureImage() {
  const video = document.getElementById('webcam');
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  // compress the image
  const compressedImage = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
  // show the image in the UI
  document.getElementById('captured-image').src = canvas.toDataURL(
    'image/jpeg',
    0.1
  );
  processImage(compressedImage);
}

// Send the image to the server for processing
function processImage(base64Image) {
  toggleLoader(true); // Show the loader

  fetch('process_image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: base64Image }),
  })
    .then((response) => response.json())
    .then(handleResponse)
    .catch(handleError);
}

// Handle the server response
function handleResponse(data) {
  toggleLoader(false); // Hide the loader
  if (data.error) {
    console.error(data.error);
    appendToChatbox(`Error: ${data.error}`, true);
    return;
  }
  const responseText = data.choices[0].message.content;
  appendToChatbox(responseText);
  // if it's not muted, speak the response
  if (!document.getElementById('mute').classList.contains('muted')) {
    speakText(responseText);
  }
}

// Handle any errors during fetch
function handleError(error) {
  toggleLoader(false); // Hide the loader
  console.error('Fetch error:', error);
  appendToChatbox(`Error: ${error.message}`, true);
}

// Toggle the visibility of the loader
function toggleLoader(show) {
  document.querySelector('.loader').style.display = show ? 'block' : 'none';
}

// Append messages to the chatbox
function appendToChatbox(message, isUserMessage = false) {
  const chatbox = document.getElementById('chatbox');
  const messageElement = document.createElement('div');
  const timestamp = new Date().toLocaleTimeString(); // Get the current time as a string

  // Assign different classes based on the sender for CSS styling
  messageElement.className = isUserMessage
    ? 'user-message'
    : 'assistant-message';

  messageElement.innerHTML = `<div class="message-content">${message}</div>
                                <div class="timestamp">${timestamp}</div>`;
  if (chatbox.firstChild) {
    chatbox.insertBefore(messageElement, chatbox.firstChild);
  } else {
    chatbox.appendChild(messageElement);
  }

  // Scroll to the bottom after adding a new message
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Function to switch the camera source
function switchCamera() {
  const video = document.getElementById('webcam');
  let usingFrontCamera = true; // This assumes the initial camera is the user-facing one

  return function () {
    // Toggle the camera type
    usingFrontCamera = !usingFrontCamera;
    const constraints = {
      video: { facingMode: usingFrontCamera ? 'user' : 'environment' },
    };

    // Stop any previous stream
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }

    // Start a new stream with the new constraints
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        video.srcObject = stream;
      })
      .catch((error) => {
        console.error('Error accessing media devices.', error);
      });
  };
}

// Function to toggle the mute state of text to speech
function toggleMute() {
  const muteButton = document.getElementById('mute');
  const soundSpan = muteButton.querySelector('span'); // Get the span element inside the button
  const isMuted = muteButton.classList.contains('muted');
  muteButton.classList.toggle('muted');
  if (isMuted) {
    soundSpan.innerText = 'Sound';
    muteButton.title = 'Click to mute the assistant';
  } else {
    soundSpan.innerText = 'Mute';
    muteButton.title = 'Click to unmute the assistant';
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function () {
  initializeWebcam();

  document.getElementById('capture').addEventListener('click', captureImage);
  document
    .getElementById('switch-camera')
    .addEventListener('click', switchCamera());

  document.getElementById('mute').addEventListener('click', toggleMute);
});
