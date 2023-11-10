// Load environment variables from .env file. This is important for keeping
// sensitive information like API keys out of the codebase.
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import OpenAI from 'openai';

const openai = new OpenAI();


const prompt =
  "This is a frame of a video from the user's camera. Act as a guide for the user who can't see, what would they want to know based on what' in their surroundings? Be descriptive. For each significant item recognized, wrap this word in <b> tags. Example: The image shows a <b>man</b> in front of a neutral-colored <b>wall</b>. He has short hair, wears <b>glasses</b>, and is donning a pair of over-ear <b>headphones</b>. ... Also output an itemized list of objects recognized, wrapped in <br> and <b> tags with label <br><b>Objects:.";


import express from 'express';
import cors from 'cors';

const app = express();

// Enable Express to parse JSON bodies in requests, which is necessary for
// processing the incoming JSON data.
app.use(express.json());
app.use(cors());
app.use(express.static('src'));

// Define the port on which the server will listen. It uses the PORT environment
// variable if provided, otherwise it defaults to 3000.
const PORT = process.env.PORT || 3000;

// Define a POST route handler for '/process_image' which will process the
// incoming image data.
app.post('/process_image', async (req, res) => {
  // Extract the base64-encoded image data from the request body.
  const base64Image = req.body.image;

  // Check if the image data is not provided and return a 400 Bad Request error
  // if that's the case.
  if (!base64Image) {
    return res.status(400).json({ error: 'No image data received.' });
  }

  return makeRequestToOpenAI(base64Image, res);
});

async function makeRequestToOpenAI(base64Image, res) {
  // Construct the payload for the OpenAI API, including the model to use, the
  // message with a prompt for the image description and the base64 image data.
  const payload = {
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              // Attach the base64 image data to the request, formatted as a
              // data URL.
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 300, // Set a limit on the number of tokens (words) the model should generate.
  };

  const response = await openai.chat.completions.create(payload);
  console.log(response.choices[0]);
  // Send the parsed data back to the client with a 200 OK status.
  res.status(200).json(response.choices[0]);
}

// Start the server and listen on the defined PORT. When the server is ready, it
// will log a message to the console.
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
