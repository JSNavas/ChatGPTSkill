require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Reemplaza con tu clave API de OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Función para obtener la respuesta de ChatGPT
async function getChatGPTResponse(prompt) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  };

  const data = {
    model: process.env.MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  };

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', data, { headers });
    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      return response.data.choices[0].message.content.trim();
    } else {
      return "Lo siento, no pude obtener una respuesta en este momento.";
    }
  } catch (error) {
    console.error("Error al llamar a la API de OpenAI:", error);
    return "Lo siento, ocurrió un error al procesar tu solicitud.";
  }
}

// Ruta para manejar las solicitudes de Alexa
app.post('/alexa', async (req, res) => {
  let responseJson = {};

  try {
    const requestType = req.body.request.type;

    if (requestType === 'LaunchRequest') {
      responseJson = {
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: "Bienvenido a ChatGPT Skill. ¿En qué puedo ayudarte?"
          },
          shouldEndSession: false
        }
      };
    } else if (requestType === 'IntentRequest') {
      const intentName = req.body.request.intent.name;

      if (intentName === 'ChatIntent') {
        const userInput = req.body.request.intent.slots.query.value;
        const chatResponse = await getChatGPTResponse(userInput);
        responseJson = {
          version: "1.0",
          response: {
            outputSpeech: {
              type: "PlainText",
              text: chatResponse
            },
            shouldEndSession: false
          }
        };
      } 
      else if (intentName === 'PauseIntent' || intentName === 'AMAZON.StopIntent') {
        responseJson = {
          version: "1.0",
          response: {
            outputSpeech: {
              type: "PlainText",
              text: "Listo, he detenido la respuesta. ¿En qué más te puedo ayudar?"
            },
            shouldEndSession: false
          }
        };
      } else if (intentName === 'AMAZON.CancelIntent') {
        responseJson = {
          version: "1.0",
          response: {
            outputSpeech: {
              type: "PlainText",
              text: "Gracias por usar ChatGPT Skill. ¡Hasta pronto!"
            },
            shouldEndSession: true
          }
        };
      } else {  
        responseJson = {
          version: "1.0",
          response: {
            outputSpeech: {
              type: "PlainText",
              text: "No he entendido tu solicitud."
            },
            shouldEndSession: false
          }
        };
      }
    } else {
      responseJson = {
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: "Lo siento, algo salió mal."
          },
          shouldEndSession: true
        }
      };
    }

    res.json(responseJson);
  } catch (err) {
    console.error(err);
    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Ocurrió un error procesando tu solicitud."
        },
        shouldEndSession: true
      }
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
