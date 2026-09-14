Introduction
v2 Models Live
Addis AI / Developer platform

The Engine for
African Intelligence.

Addis AI provides the raw, unified infrastructure (LLMs, Vision, and Audio) designed to process African languages as primary data. By using a native tokenization architecture, we eliminate the translation layer overhead that causes standard APIs to struggle with Ge'ez logic and local accents.

Open Playground

Start Coding

LLM · Vision · Audio

Why Addis AI?
Building AI for Africa requires language-specific training. Many general-purpose models have limited exposure to the morphology, scripts, and cultural context of African languages. Addis AI treats those languages as the core product.

We solve the three hardest problems in African NLP:

Morphology: Amharic verbs fuse subject, object, and tense into single words. This complex structure requires language-specific training. Our models parse it correctly, while major general-purpose AI models can misinterpret or hallucinate the underlying meaning.
Culture: Our models understand African history, regional geography, and contemporary legal and regulatory contexts.
Voice: We don't just do text. We built the most natural sounding TTS engines for Amharic and Afan Oromo.
The Core Engines
The platform is powered by three specialized model families. You will select these using the model parameter in your API calls.

Addis-፩-አሌፍ (NLP)
Our flagship Large Language Model. It is optimized for instruction following, reasoning, and content generation.

Best for: Chatbots, RAG (Document Search), and Summarization.
Languages: Amharic and Afan Oromo are fully supported, and the model also understands English instructions.
Context Window: 128k tokens.
አሌፍ-Audio (Voice)
A suite of high-fidelity audio models.

Addis Voices 2
New
: The latest generation of Addis AI's Text-to-Speech technology, with multiple production-ready Amharic and Afaan Oromo voices designed for natural, expressive delivery. Use the catalog, previews, cost estimates, and durable clips to build conversational AI, narration, customer support, announcements, and other voice-first applications. Explore the complete Text-to-Speech guide.
አሌፍ-Audio-AM: Amharic Text-to-Speech with natural intonation.
አሌፍ-Audio-OM: Afan Oromo Text-to-Speech.
addis-whisper: Speech-to-Text transcription that handles dialect variations.
The previous Voice 1 Text-to-Speech API remains available only for existing applications and is documented in the Legacy Text-to-Speech guide.

Realtime Audio
Powered by አሌፍ-1.2-realtime-audio.

Latency: <300ms response time.
Use Case: Live conversational agents (like Siri/Alexa) that need to interrupt and respond instantly.
Documentation Roadmap
We have structured the docs to get you into production fast.

🚀 Get Started
Playground Guide: Learn how to prompt the models visually.
Quick Start: Get your API Key, choose a model, and make your first request (Auth & Code included).
⚡ Capabilities
Deep dives into the specific endpoints and parameters.

Text Generation: Context management, parameters, and JSON schemas.
Text-to-Speech: Discovering voices, estimating cost, and generating Addis Voices 2 clips.
Vision: OCR and Image analysis.
🧩 Integration
Patterns for connecting Addis AI securely to your application.

Web Applications: Keep API keys on your backend and expose only the routes your web client needs.
Mobile Applications: Use a backend proxy for mobile requests and audio delivery.
Server-side Integration: Structure production Node.js and Python services.
Voice Interface: Orchestrate speech, text generation, and voice playback.
⚙️ Platform
Rate Limits: Understanding tiers and quotas.
Errors: Troubleshooting status codes like 429 and 500.
Community & Support
We are building this together.

Join our Telegram Community
Join 500+ developers building with Addis AI.

Enterprise Support
Need higher rate limits or custom fine-tuning? Contact us.

Announcements

New Addis AI platform, SDK, and documentation releases.

Quick Start

From Playground to Production in less than 5 minutes.



Addis AISearch
Ctrl
K
SDK resources

API keys
npm
Node.js on npm
Py
Python on PyPI
Announcements
Get Started
Introduction
Quick Start
SDKs
New
Capabilities
Text Generation
Text-to-Speech
New
Speech to Text (Transcription)
Multimodal
Realtime API
Translation
Integration
Web Applications
Mobile Applications
Server-side Integration
Voice Interface (VUI)
Platform
Pricing
Errors
FAQ



Quick Start
From Playground to Production in less than 5 minutes.

This guide will take you through the complete lifecycle: testing your ideas visually, securing an API key, and writing your first line of code.

Prototype in Playground
Before writing code, we recommend testing your prompts interactively.

Test your Parameters
Open the Addis AI Playground.

Current Addis AI Playground showing model, language, output, temperature, and token controls

Select a model: Choose Addis-፩-አሌፍ for text generation.
Choose the language and output type: Select Amharic or Afaan Oromo and the response format you want to test.
Adjust temperature:
Set to 0.2 for factual answers (History, Math).
Set to 0.7 for creative writing (Stories, Poems).
Set the response length and check usage: Adjust the maximum completion tokens, send a text or audio prompt, and review the token count.
The Voice Labs experience is available from the Voice Lab navigation item when you want to discover and preview Addis Voices 2 separately from the Playground.

Once you are happy with the result, you are ready to integrate.

Get your API Key
Authentication is handled via a secret x-api-key header.

Generate New Key
Navigate to the API Keys Dashboard.
Click Create API Key.
Addis AI API Keys page with the Create API Key button

Name your key (e.g., Addis AI App) in the popup window.
Create API Key dialog with the key-name field

Copy Secret
Important

You will see a key starting with sk_.... Copy this now.

You will not be able to see it again after closing the window.

New Addis AI API key confirmation with the one-time Copy action

Configure Endpoints
All API requests should be made to the production Base URL:


https://api.addisassistant.com
Install the official SDK and store your key in ADDIS_API_KEY.

Node.js
Python

npm install addisai
export ADDIS_API_KEY="your_api_key"
Available Capabilities
Goal	Endpoint	Method
Chat / Text	/api/v1/chat_generate	POST
Text-to-Speech (Addis Voices 2)	/api/v1/voice/generations	POST
Speech-to-Text	/api/v2/stt	POST
Quick Example
Choose a capability below to make your first request.

Text Generation
Speech-to-Text
Endpoint: /api/v1/chat_generate

Simple JSON request for chatbots and text analysis.

Node.js
Python
cURL

import AddisAI from "addisai";
const addis = new AddisAI();
const response = await addis.chat.completions.create({
  messages: [{
    role: "user",
    content: "ሰላም፣ ኢትዮጵያ ውስጥ ስንት ክልሎች አሉ?",
  }],
});
console.log(response.choices[0].message.content);
The Response
The API structure depends on the endpoint.

Text Generation
Speech-to-Text
The SDK exposes this result through response.choices and response.usage. The JSON below is the native REST response.


{
  "response_text": "በአሁኑ ጊዜ በኢትዮጵያ ውስጥ 12 ክልሎች አሉ።...",
  "finish_reason": "stop",
  "usage_metadata": {
    "prompt_token_count": 8,
    "candidates_token_count": 25,
    "total_token_count": 33
  },
  "modelVersion": "Addis-፩-አሌፍ"
}
Generate your first Addis Voices 2 clip
Use am-hamen for the first Amharic example. For production, query the voice catalog and preview a voice before saving its ID.

Node.js
Python
cURL

const clip = await addis.voice.generate({
  text: "ሰላም፣ እንኳን ደህና መጡ።",
  voiceId: "am-hamen",
  language: "am",
  outputFormat: "mp3_44100",
  clientRequestId: crypto.randomUUID(),
});
await clip.toFile("welcome.mp3");
Introduction

Previous Page

SDKs
New

Install and configure the official Addis AI Node.js and Python SDKs.

On this page
Prototype in Playground
Test your Parameters
Get your API Key
Generate New Key
Copy Secret
Configure Endpoints
Available Capabilities
Quick Example
The Response
Generate your first Addis Voices 2 clip
Quick Start