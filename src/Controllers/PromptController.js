import axios from 'axios';
import fs from 'fs';
import path from 'path';

class PromptController {
    // Array of OpenRouter API keys for fallback mechanism
    static apiKeys = [
        "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",
        "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",
        "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"
    ];

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
                existingQuotes = [];
            }

            // Base64 encode the existing quotes to handle large data
            const encodedExistingQuotes = Buffer.from(JSON.stringify(existingQuotes)).toString('base64');

            // Try each API key until successful
            let response = null;
            let lastError = null;
            
            for (const apiKey of this.apiKeys) {
                try {
                    
                    response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                        model: "deepseek/deepseek-r1",
                        messages: [
                            {
                                role: "user",
                                content: `Generate ${numberOfPrompts} modern and simple ${typeOfQuotes} quotes. Each quote should be approximately 1.5 lines long, similar to this length: "I'm Not Lazy, i'm in energy saving mode". Make them catchy and impressive.

IMPORTANT REQUIREMENTS:
1. For each quote, also identify the most ATTRACTIVE, EYE-CATCHING, and ESSENTIAL keyword from that quote
2. The keyword should be the CORE word that makes the quote incomplete without it
3. Choose the word that would be most visually impactful and meaningful
4. The keyword should be a SINGLE WORD only (no phrases)

AVOID DUPLICATES: I'm sending the existing quotes as a base64 encoded string. Please decode it to avoid duplicates:
${encodedExistingQuotes}

To decode the base64 string: 
1. Convert from base64 to a string
2. Parse the resulting string as JSON to get the array of existing quotes

Please check this list carefully and generate completely NEW and UNIQUE quotes that are not similar to any of the above. 

Return the response in this EXACT JSON format only:

[{
"quote": "Your quote here",
"keyword": "single_keyword"
},{
"quote": "Your quote here", 
"keyword": "single_keyword"
},{
"quote": "Your quote here",
"keyword": "single_keyword"
}]

EXAMPLE FORMAT:
[{
"quote": "I'm Not Lazy, i'm in energy saving mode",
"keyword": "Lazy"
},{
"quote": "Coffee: because adulting is hard",
"keyword": "Coffee"
}]

Make sure each keyword is the most impactful word from its respective quote that would catch the eye and represent the essence of the quote.`
                            }
                        ],
                        max_tokens: 1500,
                        temperature: 0.8
                    }, {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'http://localhost:3000',
                            'X-Title': 'Quote Generator'
                        }
                    });
                    
                    break;
                } catch (error) {
                    console.log(`API key failed: ${error.message}`);
                    lastError = error;
                    // Continue to next API key
                }
            }

            // If all API keys failed
            if (!response) {
                throw new Error(`All API keys failed. Last error: ${lastError?.message || 'Unknown error'}`);
            }

            const generatedQuotes = response.data.choices[0].message.content;
            let cleanedResponse = generatedQuotes.trim();

            // Remove markdown code blocks if present
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
            }

            if (!cleanedResponse || cleanedResponse.trim() === '') {
                throw new Error('Empty response from API');
            }

            // Extract JSON array from response
            let jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                cleanedResponse = jsonMatch[0];
            }

            // Clean up JSON formatting
            cleanedResponse = cleanedResponse
                .replace(/,\s*\]/g, ']')
                .replace(/,\s*\}/g, '}');

            let quotesArray;
            try {
                quotesArray = JSON.parse(cleanedResponse);
            } catch (parseError) {
                // Fallback parsing for both quote and keyword
                const quoteKeywordMatches = cleanedResponse.match(/"quote":\s*"([^"]+)"[^}]*"keyword":\s*"([^"]+)"/g);
                if (quoteKeywordMatches) {
                    quotesArray = quoteKeywordMatches.map(match => {
                        const quoteMatch = match.match(/"quote":\s*"([^"]+)"/);
                        const keywordMatch = match.match(/"keyword":\s*"([^"]+)"/);

                        if (quoteMatch && keywordMatch) {
                            return {
                                quote: quoteMatch[1],
                                keyword: keywordMatch[1]
                            };
                        }
                        return null;
                    }).filter(item => item !== null);
                }

                // If still no matches, try alternative parsing
                if (!quotesArray || quotesArray.length === 0) {
                    const quoteMatches = cleanedResponse.match(/"quote":\s*"([^"]+)"/g);
                    if (quoteMatches) {
                        quotesArray = quoteMatches.map(match => {
                            const quote = match.match(/"quote":\s*"([^"]+)"/)[1];
                            // Generate a simple keyword from the quote as fallback
                            const words = quote.split(' ').filter(word => word.length > 3);
                            const keyword = words[0] || 'Quote';
                            return { quote, keyword };
                        });
                    } else {
                        throw new Error('Could not parse quotes and keywords from response');
                    }
                }
            }

            if (!Array.isArray(quotesArray) || quotesArray.length === 0) {
                throw new Error('Invalid quotes array format');
            }

            // Validate that each quote has both quote and keyword
            quotesArray = quotesArray.map((item, index) => {
                if (!item.quote) {
                    throw new Error(`Quote ${index + 1} is missing the 'quote' field`);
                }
                if (!item.keyword) {
                    // Generate fallback keyword if missing
                    const words = item.quote.split(' ').filter(word => word.length > 3);
                    item.keyword = words[0] || 'Quote';
                }
                return item;
            });

            // Save to file
            const updatedQuotes = [...existingQuotes, ...quotesArray];
            fs.writeFileSync(quotesFilePath, JSON.stringify(updatedQuotes, null, 2));

            return quotesArray;

        } catch (error) {
            throw error;
        }
    }
}

export default PromptController;