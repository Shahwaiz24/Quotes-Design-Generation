import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class DesignController {
    static apiKey = "r2jRpIXXQxth9MmR6zRWCEJJQqQYyDAq";
    
    static async QuoteDesigns(quotes) {
        try {
            // Create quotes directory if it doesn't exist
            const quotesDir = path.join(process.cwd(), 'public', 'quotes');
            if (!fs.existsSync(quotesDir)) {
                fs.mkdirSync(quotesDir, { recursive: true });
            }

            // Process each quote one by one
            for (let i = 0; i < quotes.length; i++) {
                const quote = quotes[i].quote;
                console.log(`Generating designs for quote ${i + 1}: "${quote}"`);

                // Create folder for this quote (clean quote text for folder name)
                const folderName = quote.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').substring(0, 50);
                const quoteFolderPath = path.join(quotesDir, folderName);
                
                if (!fs.existsSync(quoteFolderPath)) {
                    fs.mkdirSync(quoteFolderPath, { recursive: true });
                }

                try {
                    // Generate a unique UUID for this task
                    const taskUUID = uuidv4();
                    
                    // New request structure
                    const requestBody = [
                        {
                            "taskType": "imageInference",
                            "taskUUID": taskUUID,
                            "positivePrompt": `Create a modern, aesthetic quote design with the text: "${quote}". Make it visually appealing with beautiful typography, colors, and background.`,
                            "width": 1024,
                            "height": 1024,
                            "model": "runware:101@1",
                            "steps": 20,
                            "cfgScale": 7,
                            "seed": Math.floor(Math.random() * 1000000),
                            "numberResults": 2
                        }
                    ];

                    const response = await axios.post('https://api.runware.ai/v1/image-generation', requestBody, {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);

                    // Handle response - now expecting 2 results
                    if (response.data && response.data.data) {
                        const results = response.data.data;
                        
                        for (let designNum = 0; designNum < results.length; designNum++) {
                            const imageUrl = results[designNum].imageURL;
                            
                            // Download the image
                            const imageResponse = await axios.get(imageUrl, {
                                responseType: 'arraybuffer'
                            });
                            
                            // Save the image to quote's folder
                            const imagePath = path.join(quoteFolderPath, `design_${designNum + 1}.png`);
                            fs.writeFileSync(imagePath, imageResponse.data);
                            
                            console.log(`✅ Design ${designNum + 1} saved: ${imagePath}`);
                        }
                    }

                    // Add delay between requests to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 2000));

                } catch (designError) {
                    console.error(`Error generating designs for quote "${quote}":`, designError.message);
                }
            }

            console.log('🎉 All quote designs generated successfully!');
            return { success: true, message: 'All designs generated and saved' };

        } catch (error) {
            console.error('Error in QuoteDesigns:', error.message);
            throw error;
        }
    }
}

export default DesignController;