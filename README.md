# BC Housing Legal Assistant

## Overview
This application provides AI-powered legal assistance for landlords and tenants in British Columbia, utilizing a specialized multi-agent architecture to deliver role-specific guidance and information.

## User Interaction Flow

1. **Landing Page Experience**
   - Users arrive at a modern landing page with:
     - Navigation bar (Home, Features, Pricing, Contact)
     - Feature highlights
     - Transparent pricing options
     - Contact section with Calendly integration for booking meetings

2. **Authentication Flow**
   ```
   Landing Page → Sign Up/Login → Role Selection → Chat Interface
   ```
   - New users receive 100 free questions valid for one month
   - Subscription options available through Stripe integration

3. **Role Selection**
   - Users must identify as either:
     - Landlord: Access property management and tenant relation contexts
     - Tenant: Access tenant rights and landlord issue contexts

4. **Chat Interface**
   ```
   Question Input → AI Processing → Response with Citations
   ```
   - Users can:
     - Start new conversations
     - View past conversations with content-based titles
     - Delete previous conversation threads
     - Access cited sources through clickable references

5. **Question Credit System**
   - Track remaining questions
   - Purchase additional credits through subscription plans
   - Credits expire after set duration

## Technical Architecture

### 1. Multi-Agent LLM System
```typescript
// Role-specific context management
const contextManager = {
  landlord: {
    primary: "BC landlord regulations expert",
    context: ["property management", "tenant relations"]
  },
  tenant: {
    primary: "BC tenant rights advocate",
    context: ["rental regulations", "tenant protections"]
  }
};
```

### 2. Knowledge Integration
- PDF Document Processing
- URL Content Integration
- Citation Management
- Relevance Scoring

### 3. Data Flow
```
User Input → Role Validation → Credit Check → 
Knowledge Base Query → AI Processing → 
Response Generation with Citations
```

### 4. Security & Access Control
- Row Level Security (RLS) policies
- Role-based access control
- Admin interface for knowledge base management

## Support & Contact

- Schedule personalized demos through Calendly integration
- Direct access to team support
- Flexible meeting durations (15/30 minutes)

## Getting Started

1. Visit the landing page
2. Click "Get Started" or navigate to pricing
3. Create an account
4. Select your role (Landlord/Tenant)
5. Begin asking questions about BC housing law

## Development Setup

Follow these steps to set up the development environment:

```sh
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev
```

## Technologies Used

- Frontend: React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Supabase
- AI: GPT-4-mini
- Authentication: Supabase Auth
- Payments: Stripe
- Scheduling: Calendly
- Database: PostgreSQL (via Supabase)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.