const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());


app.get('/:formId/filteredResponses', async (req, res) => {

    try {
        const formId = req.params.formId;
        // Parse the JSON stringified query input from the query parameters
        const filters = JSON.parse(req.query.filters);
        const token = "sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912";
        const apiEndpoint = `https://api.fillout.com/v1/api/forms/${formId}/submissions`;

        const response = await axios.get(apiEndpoint, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Use map to create a new array containing the matches
        const filteredResponses = response.data.responses.filter(response => {
            // Check if the response has 'questions' property and it is an array
            if (response.questions && Array.isArray(response.questions)) {

                return filters.every(filter => {
                    const question = response.questions.find(q => q.id === filter.id);
            
                    if (!question) {
                      // If question not found, consider it a non-match
                      return false;
                    }

                    // Convert the filter value to the appropriate type for comparison
                    let filterValue;
                    if (typeof question.value === 'number') {
                        filterValue = parseFloat(filter.value); // Convert to number for numeric comparison
                    } else if (question.type === 'DatePicker') {
                        filterValue = new Date(filter.value); // Convert to Date for ISO date comparison
                    } else {
                        filterValue = filter.value; // Use the filter value as is
                    }

                    const questionValue = question.type === 'DatePicker' ? new Date(question.value) : question.value;
            
                    // Check if dates comparison
                    const isDateComparison =  question.type === 'DatePicker';

                    // Apply the specified condition to compare the values
                    switch (filter.condition) {
                      case 'equals':
                          return isDateComparison ? questionValue.getTime() === filterValue.getTime() : questionValue === filterValue;
                      case 'does_not_equal':
                          return isDateComparison ? questionValue.getTime() !== filterValue.getTime() : questionValue !== filterValue;
                      case 'greater_than':
                          return isDateComparison ? questionValue.getTime() > filterValue.getTime() : questionValue > filterValue;
                      case 'less_than':
                          return isDateComparison ? questionValue.getTime() < filterValue.getTime() : questionValue < filterValue;
                      default:
                          return false; // Handle unsupported conditions as needed
                    }
                  });
                }
                 // If 'questions' property is not present or not an array, consider it a non-match
                return false;
            });
    
        // Calculation for page count
        const limit = parseInt(req.query.limit) || 150; 
        const pageCount = Math.ceil(filteredResponses.length / limit);  

        // Send the filtered responses as the API response
        res.json({
          responses: filteredResponses,
          totalResponses: filteredResponses.length,
          pageCount: pageCount, // Assuming no pagination for simplicity
        });
      } catch (error) {
        // Handle JSON parsing errors
        res.status(400).json({ error: 'Invalid JSON input' });
      }
})

app.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000}`);
});