const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Simple .env parser since dotenv might not be installed
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) {
            console.error('Error: .env file not found at', envPath);
            return null;
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (error) {
        console.error('Error loading .env:', error);
        return null;
    }
}

async function listModels() {
    const env = loadEnv();
    if (!env || !env.NEXT_PUBLIC_GOOGLE_API_KEY) {
        console.error('Error: NEXT_PUBLIC_GOOGLE_API_KEY not found in .env file.');
        return;
    }

    const apiKey = env.NEXT_PUBLIC_GOOGLE_API_KEY;
    console.log('Using API Key:', apiKey.substring(0, 5) + '...');

    try {
        const ai = new GoogleGenAI({ apiKey });
        console.log('Fetching available models...');

        const response = await ai.models.list();

        // Write raw response to file for inspection
        fs.writeFileSync('models_debug.log', JSON.stringify(response, null, 2));
        console.log('Raw response written to models_debug.log');

        let models = [];
        if (Array.isArray(response)) {
            models = response;
        } else if (response && Array.isArray(response.models)) {
            models = response.models;
        } else if (response && response.data && Array.isArray(response.data.models)) {
            models = response.data.models;
        }

        console.log('\n--- Available Models ---');
        if (models.length > 0) {
            models.forEach(model => {
                console.log(`- ${model.name} (${model.displayName})`);
            });
        } else {
            console.log('Could not find models array in response. Check models_debug.log');
        }
    } catch (error) {
        console.error('\nError listing models:');
        console.error(error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

listModels();
