import axios from 'axios';

class PromptController {
    static apiKey = "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";
    
    static async getQuotePrompts(numberOfPrompts, typeOfQuotes) {
        try {
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: "deepseek/deepseek-r1",
                messages: [
                    {
                        role: "user",
                        content: `Generate ${numberOfPrompts} modern and simple ${typeOfQuotes} quotes. Each quote should be approximately 1.5 lines long, similar to this length: "I'm Not Lazy, i'm in energy saving mode". Make them catchy and impressive. Return the response in JSON format only:
                        
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
                temperature: 0.7
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
            return quotesArray;

        } catch (error) {
            console.error('Error generating quotes:', error.response?.data || error.message);
            throw error;
        }
    }
}

export default PromptController;