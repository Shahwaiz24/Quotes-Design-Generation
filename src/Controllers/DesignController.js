import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class DesignController {
    static runwareApiKeys = [
        "nUcKpfqYutli7BgyP3OiLGn61v8CFDP3",
        "r2jRpIXXQxth9MmR6zRWCEJJQqQYyDAq",
        "hCvRsjhc72kygfMQG4nohqLE27cHqcsF",
        "A2cCkeji7MGXvbiDtgC3pLMBzwVhUrxv",
        "1iUgxRPYvV3NOlEYuM6mXIMOLNwJR8dy",
        "bl8rWubzPL2PPr3NSYHEtqN4LFVhdrLw",
        "y8STiWLJ6fK6qnhf1WFLCptPhMPBdMki",
        "doU0CFLTtQfidqhg0dEjZ87o3KgMwxAw",
        "y8STiWLJ6fK6qnhf1WFLCptPhMPBdMki"
    ];

    static a4fApiKeys = [
        "ddc-a4f-8da8ab169b764adfa3f50f600aac670a",
        "ddc-a4f-7aede79c6df8493c8a517a126ce4ae3f"
    ];

    static a4fModel = "provider-3/shuttle-3.1-aesthetic";
    static a4fModelId2 = "provider-5/gpt-image-1";

    /**
     * Create folder structure for a quote
     */
    static createQuoteFolders(quote) {
        const quotesDir = path.join(process.cwd(), 'public', 'quotes');
        if (!fs.existsSync(quotesDir)) {
            fs.mkdirSync(quotesDir, { recursive: true });
        }

        const folderName = quote.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').substring(0, 50);
        const quoteFolderPath = path.join(quotesDir, folderName);

        if (!fs.existsSync(quoteFolderPath)) {
            fs.mkdirSync(quoteFolderPath, { recursive: true });
        }

        const runwareFolderPath = path.join(quoteFolderPath, 'Runware-Designs');
        const a4fFolderPath = path.join(quoteFolderPath, 'A4F-Designs');

        if (!fs.existsSync(runwareFolderPath)) {
            fs.mkdirSync(runwareFolderPath, { recursive: true });
        }

        if (!fs.existsSync(a4fFolderPath)) {
            fs.mkdirSync(a4fFolderPath, { recursive: true });
        }

        return {
            quoteFolderPath,
            runwareFolderPath,
            a4fFolderPath
        };
    }

    /**
     * Make API request to Runware with retry mechanism
     */
    static async makeRunwareRequest(requestBody) {
        let lastError = null;

        for (let keyIndex = 0; keyIndex < this.runwareApiKeys.length; keyIndex++) {
            const apiKey = this.runwareApiKeys[keyIndex];

            try {
                const response = await axios.post('https://api.runware.ai/v1/image-generation', requestBody, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                });

                if (response.data && response.data.data) {
                    return response.data;
                }

                throw new Error('No data received from Runware API');

            } catch (error) {
                lastError = error;

                if (keyIndex < this.runwareApiKeys.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        throw lastError || new Error('All Runware API keys failed');
    }

    /**
     * Make API request to A4F with retry mechanism
     */
    static async makeA4FRequest(requestBody) {
        let lastError = null;

        for (let keyIndex = 0; keyIndex < this.a4fApiKeys.length; keyIndex++) {
            const apiKey = this.a4fApiKeys[keyIndex];

            try {
                const response = await axios.post('https://api.a4f.co/v1/images/generations', requestBody, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 600000
                });

                if (response.data && response.data.data) {
                    return response.data;
                }

                throw new Error('No data received from A4F API');

            } catch (error) {
                lastError = error;
                if (keyIndex < this.a4fApiKeys.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        throw lastError || new Error('All A4F API keys failed');
    }

    /**
     * Generate designs using Runware API
     */
    static async generateRunwareDesigns(quote, keyword, folderPath) {
        try {
            const taskUUID = uuidv4();

            const requestBody = [
                {
                    "taskType": "imageInference",
                    "taskUUID": taskUUID,
                    "positivePrompt": `DESIGN SPECIFICATIONS FOR QUOTE IMAGE - FOLLOW EXACTLY:
**Quote Text:** '${quote}'
**MANDATORY REQUIREMENTS:**
1. **Background:** 100% transparent (PNG format)
2. **CRITICAL INSTRUCTION:** Write the complete quote AS ONE CONTINUOUS TEXT BLOCK - do NOT separate or extract any words from the quote
3. **Main Text Styling:**
   * Color: Pure black (#000000)
   * Font: Bold, solid, premium sans-serif
4. **WITHIN the continuous quote text, ONLY the word '${keyword}':**
   * Font: Distinct messy/stylish script font (different from other words)
   * Color: Neon blue (#00BFFF) OR soft gold (#FFD700) OR bright orange (#FF6600)
   * Effect: Glowing effect in the same color as the text
5. **Resolution:** High-resolution
6. **Alignment:** Center-aligned
**STRICT PROHIBITIONS:**
* DO NOT write '${keyword}' separately outside the quote
* DO NOT extract any word from the main quote text
* DO NOT create separate text elements
* Keep ALL words as part of the single quote sentence
* ONLY change the styling of '${keyword}' within the existing quote flow
**RESULT:** One complete quote with only the word '${keyword}' styled differently within the sentence.
**OUTPUT:** PNG with transparent background.`,
                    "width": 1024,
                    "height": 1024,
                    "model": "runware:101@1",
                    "steps": 20,
                    "cfgScale": 7,
                    "seed": Math.floor(Math.random() * 1000000),
                    "numberResults": 4
                }
            ];

            const responseData = await this.makeRunwareRequest(requestBody);
            const results = responseData.data;

            for (let designNum = 0; designNum < results.length; designNum++) {
                const imageUrl = results[designNum].imageURL;

                try {
                    const imageResponse = await axios.get(imageUrl, {
                        responseType: 'arraybuffer',
                        timeout: 15000
                    });

                    const imagePath = path.join(folderPath, `runware_design_${designNum + 1}.png`);
                    fs.writeFileSync(imagePath, imageResponse.data);

                } catch (downloadError) {
                    console.error(`Failed to download Runware image ${designNum + 1}`);
                }
            }

            return true;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate single A4F design with retry on failure
     */
    static async generateSingleA4FDesign(quote, keyword, folderPath, imageNumber, model) {
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const requestBody = {
                    "model": model,
                    "prompt": `DESIGN SPECIFICATIONS FOR QUOTE IMAGE - FOLLOW EXACTLY:
**Quote Text:** '${quote}'
**MANDATORY REQUIREMENTS:**
1. **Background:** 100% transparent (PNG format)
2. **CRITICAL INSTRUCTION:** Write the complete quote AS ONE CONTINUOUS TEXT BLOCK - do NOT separate or extract any words from the quote
3. **Main Text Styling:**
   * Color: Pure black (#000000)
   * Font: Bold, solid, premium sans-serif
4. **WITHIN the continuous quote text, ONLY the word '${keyword}':**
   * Font: Distinct messy/stylish script font (different from other words)
   * Color: Neon blue (#00BFFF) OR soft gold (#FFD700) OR bright orange (#FF6600)
   * Effect: Glowing effect in the same color as the text
5. **Resolution:** High-resolution
6. **Alignment:** Center-aligned
**STRICT PROHIBITIONS:**
* DO NOT write '${keyword}' separately outside the quote
* DO NOT extract any word from the main quote text
* DO NOT create separate text elements
* Keep ALL words as part of the single quote sentence
* ONLY change the styling of '${keyword}' within the existing quote flow
**RESULT:** One complete quote with only the word '${keyword}' styled differently within the sentence.
**OUTPUT:** PNG with transparent background.`,
                    "n": 1,
                    "size": "1024x1024",
                    "quality": "hd",
                    "style": "vivid",
                    "response_format": "url"
                };

                const responseData = await this.makeA4FRequest(requestBody);
                const results = responseData.data;

                const imageUrl = results[0].url;
                const imageResponse = await axios.get(imageUrl, {
                    responseType: 'arraybuffer',
                    timeout: 15000
                });

                const imagePath = path.join(folderPath, `a4f_design_${imageNumber}.png`);
                fs.writeFileSync(imagePath, imageResponse.data);

                return true;

            } catch (error) {
                console.error(`A4F image ${imageNumber} attempt ${attempt} failed: ${error.message}`);
                
                if (attempt < maxRetries) {
                    console.log(`Retrying after 12 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 12000));
                }
            }
        }

        return false;
    }

    /**
     * Generate 2 A4F designs using different models
     */
    static async generateA4FDesigns(quote, keyword, folderPath) {
        try {
            let successCount = 0;

            // Generate first image with model 1
            const success1 = await this.generateSingleA4FDesign(quote, keyword, folderPath, 1, this.a4fModel);
            if (success1) successCount++;

            await new Promise(resolve => setTimeout(resolve, 12000));

            // Generate second image with model 2
            const success2 = await this.generateSingleA4FDesign(quote, keyword, folderPath, 2, this.a4fModelId2);
            if (success2) successCount++;

            return successCount > 0;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Process all Runware designs for all quotes
     */
    static async processAllRunwareDesigns(quotes) {
        console.log('Starting Runware designs for all quotes...');
        let successCount = 0;
        const folderPaths = [];

        for (let i = 0; i < quotes.length; i++) {
            const quote = quotes[i].quote;
            const keyword = quotes[i].keyword || 'Quote';

            try {
                const { runwareFolderPath } = this.createQuoteFolders(quote);
                folderPaths.push({ quote, keyword, runwareFolderPath, a4fFolderPath: this.createQuoteFolders(quote).a4fFolderPath });

                await this.generateRunwareDesigns(quote, keyword, runwareFolderPath);
                successCount++;

                if (i < quotes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

            } catch (error) {
                console.error(`Runware failed for quote ${i + 1}: ${error.message}`);
                folderPaths.push({ quote, keyword, runwareFolderPath: null, a4fFolderPath: this.createQuoteFolders(quote).a4fFolderPath });
            }
        }

        console.log(`Runware completed: ${successCount}/${quotes.length} successful`);
        return { successCount, folderPaths };
    }

    /**
     * Process all A4F designs for all quotes
     */
    static async processAllA4FDesigns(folderPaths) {
        console.log('Starting A4F designs for all quotes...');
        let successCount = 0;

        for (let i = 0; i < folderPaths.length; i++) {
            const { quote, keyword, a4fFolderPath } = folderPaths[i];

            try {
                await this.generateA4FDesigns(quote, keyword, a4fFolderPath);
                successCount++;

                if (i < folderPaths.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }

            } catch (error) {
                console.error(`A4F failed for quote ${i + 1}: ${error.message}`);
            }
        }

        console.log(`A4F completed: ${successCount}/${folderPaths.length} successful`);
        return successCount;
    }

    /**
     * Main function to process all quotes
     */
    static async QuoteDesigns(quotes) {
        try {
            console.log(`Processing ${quotes.length} quotes...`);

            // First: Process all Runware designs
            const runwareResult = await this.processAllRunwareDesigns(quotes);

            // Second: Process all A4F designs  
            const a4fSuccessCount = await this.processAllA4FDesigns(runwareResult.folderPaths);

            const finalResults = {
                success: true,
                message: `Quote designs completed successfully`,
                stats: {
                    total: quotes.length,
                    runwareSuccess: runwareResult.successCount,
                    a4fSuccess: a4fSuccessCount
                }
            };

            console.log('All quote designs completed!');
            return finalResults;

        } catch (error) {
            console.error('Quote design process failed:', error.message);
            throw error;
        }
    }
}

export default DesignController;