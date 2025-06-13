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
            
            // Debug: Log the raw response
            // console.log('Raw API Response:', generatedQuotes);
            
            // Remove code block markers if present
            let cleanedResponse = generatedQuotes.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            
            // Debug: Log cleaned response
            // console.log('Cleaned Response of Prompt Controller:', cleanedResponse);
            
            // Check if cleanedResponse is empty or invalid
            if (!cleanedResponse || cleanedResponse.trim() === '') {
                throw new Error('Empty response from API');
            }
            
            // Try to find JSON in the response
            let jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                cleanedResponse = jsonMatch[0];
            }
            
            // Additional cleanup for common issues
            cleanedResponse = cleanedResponse
                .replace(/,\s*\]/g, ']') // Remove trailing commas
                .replace(/,\s*\}/g, '}'); // Remove trailing commas in objects
            
            let quotesArray;
            try {
                quotesArray = JSON.parse(cleanedResponse);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError.message);
                console.error('Attempting to parse:', cleanedResponse);
                
                // Fallback: Try to extract quotes manually
                const quoteMatches = cleanedResponse.match(/"quote":\s*"([^"]+)"/g);
                if (quoteMatches) {
                    quotesArray = quoteMatches.map(match => {
                        const quote = match.match(/"quote":\s*"([^"]+)"/)[1];
                        return { quote };
                    });
                } else {
                    throw new Error('Could not parse quotes from response');
                }
            }
            
            // Validate the parsed array
            if (!Array.isArray(quotesArray) || quotesArray.length === 0) {
                throw new Error('Invalid quotes array format');
            }
            
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