import axios from 'axios';
import fs from 'fs';
import path from 'path';

class PromptController {
    static apiKey = "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";
    
    static async getQuotePrompts(numberOfPrompts, typeOfQuotes) {
        try {
            // Read existing quotes from JSON file
            const quotesFilePath = path.join(process.cwd(), 'public', 'quote_history.json');
            let existingQuotes = [];
            
            try {
                if (fs.existsSync(quotesFilePath)) {
                    const fileContent = fs.readFileSync(quotesFilePath, 'utf8');
                    existingQuotes = JSON.parse(fileContent);
                }
            } catch (fileError) {
                console.log('No existing quotes file found, creating new one');
                existingQuotes = [];
            }

            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: "deepseek/deepseek-r1",
                messages: [
                    {
                        role: "user",
                        content: `Generate ${numberOfPrompts} modern and simple ${typeOfQuotes} quotes. Each quote should be approximately 1.5 lines long, similar to this length: "I'm Not Lazy, i'm in energy saving mode". Make them catchy and impressive. 

IMPORTANT: Here are the existing quotes that you MUST avoid generating (don't create any similar or duplicate quotes):
${JSON.stringify(existingQuotes, null, 2)}

Please check this list carefully and generate completely NEW and UNIQUE quotes that are not similar to any of the above. Return the response in JSON format only:
                        
[{
"quote":"Quote"
},{
"quote":"Quote"
},{
"quote":"Quote"
}]`
                    }
                ],
                max_tokens: 1000,
                temperature: 0.8
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Quote Generator'
                }
            });

            const generatedQuotes = response.data.choices[0].message.content;
            
            // Remove code block markers if present
            let cleanedResponse = generatedQuotes.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            
            const quotesArray = JSON.parse(cleanedResponse);
            
            // Add new quotes to existing quotes
            const updatedQuotes = [...existingQuotes, ...quotesArray];
            
            // Save updated quotes back to file
            fs.writeFileSync(quotesFilePath, JSON.stringify(updatedQuotes, null, 2));
            
            return quotesArray;

        } catch (error) {
            console.error('Error generating quotes:', error.response?.data || error.message);
            throw error;
        }
    }
}

export default PromptController;