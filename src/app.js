import { createInterface } from 'readline';
import PromptController from './Controllers/PromptController.js';
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});
async function main() {

  rl.question("How many quote designs would you like to create? ", async (numberOfDesigns) => {
    const designCount = parseInt(numberOfDesigns);
    if (isNaN(designCount) || designCount <= 0) {
      console.log("Please enter a valid number greater than 0.");
      rl.close();
      return;
    } else {
  
      console.log("\nAvailable Quote Types:");
      console.log("------------------------");
      console.log("1. Motivational Quotes");
      console.log("2. Funny Quotes");
      console.log("3. Love Quotes");
      console.log("4. Positive Calm Quotes");
      console.log("5. Life Lessons Quote");
      console.log("------------------------");
      rl.question("Please select a quote type (enter number): ", async (quoteType) => {
        let quoteTypeName = "";
        switch(quoteType) {
          case "1":
            quoteTypeName = "Motivational Quotes";
            break;
          case "2":
            quoteTypeName = "Funny Quotes";
            break;
          case "3":
            quoteTypeName = "Love Quotes";
            break;
          case "4":
            quoteTypeName = "Positive Calm Quotes";
            break;
          case "5":
            quoteTypeName = "Life Lessons Quote";
            break;
          default:
            quoteTypeName = "Unknown Quote Type";
        }
        
        console.log(`\nYou selected: ${designCount} designs of ${quoteTypeName}`);
        
        // Check if unknown quote type was selected
        if (quoteTypeName === "Unknown Quote Type") {
          console.log("Invalid quote type selected. Program will exit.");
          rl.close();
          return;
        }
        
        console.log("Custom designs will be created based on your selection.");
        console.log("------------------------");
        
        // Loading animation
        const loadingChars = ['|', '/', '-', '\\'];
        let i = 0;
        const loadingInterval = setInterval(() => {
          process.stdout.write(`\rGenerating Quotes... ${loadingChars[i % loadingChars.length]}`);
          i++;
        }, 200);
        try {
          let prompts = await PromptController.getQuotePrompts(designCount, quoteTypeName);
          clearInterval(loadingInterval);
          process.stdout.write("\rGenerating Quotes... Done!   \n");
          console.log("------------------------");
          for(let prompt of prompts){
            console.log(`Quote: ${prompt.quote}`);
          }
          console.log("------------------------");
        } catch (error) {
          // Clear loading animation
          clearInterval(loadingInterval);
          process.stdout.write("\r                          \r");
          
          // Display error
          console.log("Error generating quotes:");
          console.log(error.message || error);
        } finally {
          rl.close();
        }
      });
    }
  });
}

// Run the script
main();
