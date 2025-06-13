import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class DesignController {
    static apiKeys = [
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

    // Try all API keys for a single quote before giving up
    static async makeApiRequestWithAllKeys(requestBody) {
        let lastError = null;

        // Try each API key once for this quote
        for (let keyIndex = 0; keyIndex < this.apiKeys.length; keyIndex++) {
            const apiKey = this.apiKeys[keyIndex];

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

                throw new Error('No data received from API');

            } catch (error) {
                lastError = error;

                // Wait a bit before trying next API key
                if (keyIndex < this.apiKeys.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        throw lastError || new Error('All API keys failed for this quote');
    }

    static async QuoteDesigns(quotes) {
        try {
            const quotesDir = path.join(process.cwd(), 'public', 'quotes');
            if (!fs.existsSync(quotesDir)) {
                fs.mkdirSync(quotesDir, { recursive: true });
            }

            let successCount = 0;
            let failureCount = 0;

            for (let i = 0; i < quotes.length; i++) {
                const quote = quotes[i].quote;
                const keyword = quotes[i].keyword || 'Quote';

                const folderName = quote.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').substring(0, 50);
                const quoteFolderPath = path.join(quotesDir, folderName);

                if (!fs.existsSync(quoteFolderPath)) {
                    fs.mkdirSync(quoteFolderPath, { recursive: true });
                }

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

                    // Try all API keys for this quote
                    const responseData = await this.makeApiRequestWithAllKeys(requestBody);
                    const results = responseData.data;

                    // Download and save images
                    for (let designNum = 0; designNum < results.length; designNum++) {
                        const imageUrl = results[designNum].imageURL;

                        try {
                            const imageResponse = await axios.get(imageUrl, {
                                responseType: 'arraybuffer',
                                timeout: 15000
                            });

                            const imagePath = path.join(quoteFolderPath, `design_${designNum + 1}.png`);
                            fs.writeFileSync(imagePath, imageResponse.data);

                        } catch (downloadError) {
                            // Continue with other images even if one fails
                        }
                    }

                    successCount++;

                    // Delay between quotes
                    await new Promise(resolve => setTimeout(resolve, 2000));

                } catch (designError) {
                    failureCount++;
                    // Continue with next quote
                    continue;
                }
            }

            return {
                success: true,
                message: `Quote designs completed: ${successCount} successful, ${failureCount} failed`,
                stats: {
                    total: quotes.length,
                    successful: successCount,
                    failed: failureCount
                }
            };

        } catch (error) {
            throw error;
        }
    }
}

export default DesignController;