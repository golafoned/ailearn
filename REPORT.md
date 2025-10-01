1. Executive Summary
   TestGen AI is a cutting-edge web platform designed to revolutionize the creation and administration of assessments. By leveraging artificial intelligence, the platform allows users to automatically generate comprehensive tests from source documents such as PDFs, textbooks, or training materials. This drastically reduces the manual effort and time required for educators and corporate trainers to create high-quality, relevant assessments.

The platform provides a seamless experience for both test creators and test takers, featuring a secure, intuitive interface, timed tests, and detailed analytics. Its primary goal is to enhance the efficiency of the learning and evaluation process in both academic and professional settings.

2. Core Features & Specifications
   2.1. User Roles & Authentication
   Creator (Authenticated User): Can log in, create tests, manage their dashboard, view analytics, and edit their profile.

Taker (Guest or Authenticated User): Can take a test via a unique link by providing their name. Authenticated users can also view their past results in their dashboard.

Authentication: The system supports a secure login for creators. All user data and created tests are tied to the authenticated account.

2.2. The Dashboard
The dashboard is the central hub for authenticated users and is split into two primary sections:

My Tests Tab:

Displays a card-based view of all tests created by the user.

Each card summarizes key information: Test Title, Source Document, Time Limit, Expiration Date, Number of Takers, and Average Score.

Clicking a card navigates to the detailed TestAnalyticsPage for that specific test.

My Results Tab:

Lists all tests the authenticated user has taken themselves.

Displays the Test Title, Completion Date, and the Final Score achieved.

2.3. AI-Powered Test Creation Flow
A guided, two-step process for generating tests:

Step 1: Source Material Upload

User uploads a source document.

Supported formats: PDF, DOCX, TXT.

A file size limit (e.g., 10MB) is enforced.

Step 2: Parameter Configuration

Number of Questions: User selects the desired number of questions using a slider (e.g., 5-50).

Time Limit: User sets a time limit for the test in minutes using a slider (e.g., 10-120).

Generation: The backend AI processes the document and parameters to generate a unique test consisting of relevant questions (e.g., multiple choice).

2.4. Test Taking Interface (TestTakingPage)
Access: Takers access the test via a unique, shareable URL.

Welcome Screen: Before starting, the user must enter their name.

Interface:

Displays one question at a time.

A persistent countdown timer shows the remaining time.

Shows current progress (e.g., "Question 5 of 20").

Clear navigation buttons for "Previous" and "Next".

On the final question, the "Next" button becomes "Submit Test".

Auto-submission: If the timer runs out, the test is automatically submitted.

2.5. Test Analytics & Results (TestAnalyticsPage)
Creator View:

Accessible from the "My Tests" dashboard tab.

Provides a detailed list of all participants who have completed the test.

The results table includes: Participant Name, Date Completed, and Score (%).

Scores are color-coded for quick visual assessment (e.g., green for pass, orange for fail).

2.6. User Profile (ProfilePage)
Authenticated users can access and manage their personal information.

Editable fields include: Full Name, Email Address, and Primary Field/Profession.

Changes are saved and reflected across the platform.

3. Target Audience & Use Cases
   Target Audience

Use Case

Educators

Rapidly create quizzes, midterms, and final exams from lecture notes, textbook chapters, or research papers.

Corporate Trainers

Develop compliance tests, onboarding assessments, or skill-gap analyses from training manuals and policy docs.

Students

Use the platform to take assigned tests and (in future versions) auto-generate practice quizzes for self-study.

HR Departments

Create pre-screening tests for job applicants based on job descriptions or required knowledge documents.
