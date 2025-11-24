<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1qbYigSrvD80fBrHn4xL351NrrOTRqSzs

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Testing & Deployment

**Live Demo:** [https://ai-infinitiv.vercel.app](https://ai-infinitiv.vercel.app)

### How to Verify Updates
1. **Check Version**: Look for the version string (e.g., `v4.3.7-REVIEW`) in the bottom right corner of the screen.
2. **Developer Tools**:
   - Click the **DEV** button in the top-left corner.
   - This opens the **Settings Modal** where you can tweak game parameters.
   - Use the **Sensor Diagnostics** (if available in the menu) to test device sensors.

### Deployment
To deploy the latest changes to Vercel:
```bash
npm run deploy
```
*Note: This requires the Vercel CLI to be configured.*
