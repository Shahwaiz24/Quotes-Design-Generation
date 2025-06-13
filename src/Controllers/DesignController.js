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
        "",
        "",
        "",
        "",
        "",
        ""
    ];
    static apiKey = "r2jRpIXXQxth9MmR6zRWCEJJQqQYyDAq";
    
    static async QuoteDesigns(quotes) {
        try {
            const quotesDir = path.join(process.cwd(), 'public', 'quotes');
            if (!fs.existsSync(quotesDir)) {
                fs.mkdirSync(quotesDir, { recursive: true });
            }
            for (let i = 0; i < quotes.length; i++) {
                const quote = quotes[i].quote;
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
                    if (response.data && response.data.data) {
                        const results = response.data.data;
                        
                        for (let designNum = 0; designNum < results.length; designNum++) {
                            const imageUrl = results[designNum].imageURL;
                            const imageResponse = await axios.get(imageUrl, {
                                responseType: 'arraybuffer'
                            });
                            const imagePath = path.join(quoteFolderPath, `design_${designNum + 1}.png`);
                            fs.writeFileSync(imagePath, imageResponse.data);
                            
                        }
                    }
                    await new Promise(resolve => setTimeout(resolve, 2000));

                } catch (designError) {
                    console.error(`Error generating designs for quote "${quote}":`, designError.message);
                }
            }

            return { success: true, message: 'All designs generated and saved' };

        } catch (error) {
            console.error('Error in QuoteDesigns:', error.message);
            throw error;
        }
    }
}

export default DesignController;