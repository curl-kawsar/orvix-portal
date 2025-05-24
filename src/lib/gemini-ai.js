import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to estimate project details
export async function getProjectEstimate(projectDetails) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `
      Based on the following project details, provide an estimation for:
      1. The estimated number of hours needed to complete this project
      2. A recommended tech stack with reasoning
      3. Potential challenges and suggestions to overcome them
      4. Estimated cost based on an average hourly rate of $50
      
      Project Details:
      - Project Name: ${projectDetails.name}
      - Description: ${projectDetails.description}
      - Requirements: ${projectDetails.requirements || 'Not specified'}
      - Deadline: ${projectDetails.deadline ? new Date(projectDetails.deadline).toLocaleDateString() : 'Not specified'}
      - Team Size: ${projectDetails.teamSize || 'Not specified'}
      
      Format the response as a JSON object with the following structure:
      {
        "estimatedHours": number,
        "estimatedCost": number,
        "techStack": string[],
        "challenges": string[],
        "recommendations": string[]
      }
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not extract JSON from AI response');
  } catch (error) {
    console.error('Error getting project estimate from Gemini AI:', error);
    return {
      estimatedHours: 0,
      estimatedCost: 0,
      techStack: ['Error generating recommendations'],
      challenges: ['Error generating challenges'],
      recommendations: ['Error generating recommendations'],
    };
  }
}

// Function to get tech suggestions
export async function getTechSuggestions(projectDescription) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
      Based on the following project description, suggest the most appropriate technologies to use.
      Consider frontend, backend, database, and any other relevant technologies.
      
      Project Description: ${projectDescription}
      
      Format the response as a JSON object with the following structure:
      {
        "frontend": string[],
        "backend": string[],
        "database": string[],
        "other": string[],
        "reasoning": string
      }
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not extract JSON from AI response');
  } catch (error) {
    console.error('Error getting tech suggestions from Gemini AI:', error);
    return {
      frontend: ['Error generating suggestions'],
      backend: ['Error generating suggestions'],
      database: ['Error generating suggestions'],
      other: ['Error generating suggestions'],
      reasoning: 'Error occurred while generating suggestions',
    };
  }
}

// Function to generate project timeline
export async function generateProjectTimeline(projectDetails) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
      Generate a detailed project timeline with phases and milestones for the following project.
      Include estimated duration for each phase.
      
      Project Name: ${projectDetails.name}
      Description: ${projectDetails.description}
      Start Date: ${projectDetails.startDate ? new Date(projectDetails.startDate).toLocaleDateString() : 'Not specified'}
      Deadline: ${projectDetails.deadline ? new Date(projectDetails.deadline).toLocaleDateString() : 'Not specified'}
      
      Format the response as a JSON object with an array of phases, where each phase has:
      {
        "phases": [
          {
            "name": string,
            "startWeek": number,
            "durationWeeks": number,
            "tasks": string[],
            "milestones": string[]
          }
        ]
      }
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not extract JSON from AI response');
  } catch (error) {
    console.error('Error generating project timeline from Gemini AI:', error);
    return {
      phases: [
        {
          name: 'Error',
          startWeek: 1,
          durationWeeks: 0,
          tasks: ['Error generating timeline'],
          milestones: ['Error generating timeline']
        }
      ]
    };
  }
} 