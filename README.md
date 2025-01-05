# Welcome to your Lovable project

## Multi-Agent LLM Orchestration Architecture

### Overview
This application uses a specialized multi-agent architecture to provide tailored responses for both landlords and tenants in British Columbia. The system processes each query through role-specific agents that understand the unique context and requirements of each user type.

### How It Works

1. **User Role Selection**
   - Users first identify themselves as either a landlord or tenant
   - Example: A landlord selecting their role gets access to property management and tenant relation contexts

2. **Question Processing Flow**
   ```
   User Question → Role Validation → Credit Check → AI Processing → Response
   ```

3. **Real-World Examples**

   **Landlord Example:**
   ```
   User Input: "Can I increase rent this year?"
   
   System Process:
   1. Validates landlord role
   2. Checks question credits
   3. Applies landlord-specific context:
      - BC rent increase guidelines
      - Notice requirements
      - Allowable percentage increases
   
   AI Response: "For 2024 in BC, you can increase rent by up to 3.5%. 
   You must provide:
   - 3 months' written notice using the RTB-7 form
   - One rent increase per 12 months
   - Calculate from the last increase or start of tenancy"
   ```

   **Tenant Example:**
   ```
   User Input: "My landlord wants to evict me for renovations"
   
   System Process:
   1. Validates tenant role
   2. Checks question credits
   3. Applies tenant-specific context:
      - Renovation eviction rules
      - Tenant rights
      - Compensation requirements
   
   AI Response: "In BC, for renovation evictions:
   1. Landlord must have permits
   2. You're entitled to 4 months' notice
   3. You deserve 1 month's rent compensation
   4. You have right of first refusal
   5. Can dispute through RTB within 30 days"
   ```

4. **Technical Implementation**
   ```typescript
   // Role-specific system prompts
   const systemPrompts = {
     landlord: `You are an AI assistant specializing in BC landlord 
                regulations, property management, and tenant relations...`,
     tenant: `You are an AI assistant specializing in BC tenant rights, 
             rental regulations, and dealing with landlord issues...`
   };

   // Message processing
   async function processQuery(message, role) {
     // Validate credits
     // Apply role-specific context
     // Generate AI response using GPT-4-mini
     // Store interaction history
   }
   ```

## Project info

**URL**: https://lovable.dev/projects/9c6296a1-1c65-4ad6-b1c2-bfa909afcb5a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9c6296a1-1c65-4ad6-b1c2-bfa909afcb5a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- OpenAI GPT-4-mini for AI responses
- Supabase for backend services
- Question credit system for usage management

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9c6296a1-1c65-4ad6-b1c2-bfa909afcb5a) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
