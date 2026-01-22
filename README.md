<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1gxQvFzh9yiCPTYprh0SeHPRIMgs7cit4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` file in the root directory and set your OpenAI API key (server-side):
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   You can get your API key from: https://platform.openai.com/api-keys
3. Run the API server (Terminal A):
   `npm run dev:api`
4. Run the web app (Terminal B):
   `npm run dev`

The frontend calls the backend endpoint:
- `POST /api/palm/analyze` (JSON: `{ image: "data:image/...;base64,...", zodiac: "..." }`)
