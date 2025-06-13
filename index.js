import { createInterface } from 'readline';

// Create interface for reading input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Simple script to get quote design preferences

// Main function to run the script
function main() {
  // Get number of designs needed
  rl.question("How many quote designs would you like to create? ", (numberOfDesigns) => {
    // Parse input to number
    const designCount = parseInt(numberOfDesigns);

    // Validate input
    if (isNaN(designCount) || designCount <= 0) {
      console.log("Please enter a valid number greater than 0.");
      rl.close();
      return;
    } else {
      // Show available quote types
      console.log("\nAvailable Quote Types:");
      console.log("------------------------");
      console.log("1. Motivational Quotes");
      console.log("2. Funny Quotes");
      console.log("3. Love Quotes");
      console.log("4. Positive Calm Quotes");
      console.log("5. Life Lessons Quote");
      console.log("------------------------");
      
      // Get quote type selection
      rl.question("Please select a quote type (enter number): ", (quoteType) => {
        // Get quote type name based on selection
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
        
        // Display the summary of user choices
        console.log(`\nYou selected: ${designCount} designs of ${quoteTypeName}`);
        console.log("Custom designs will be created based on your selection.");
        
        // Close the readline interface
        rl.close();
      });
    }
  });
}

// Run the script
main();
