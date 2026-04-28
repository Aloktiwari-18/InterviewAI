require('dotenv').config({ path: './.env' });

const { analyzeResumeWithSemanticMatching } = require('./services/semanticAnalyzer');

const testResume = `
John Doe
Email: john@example.com
Phone: 555-1234

Professional Summary:
Experienced Java developer with 5 years of experience in full-stack development.

Skills:
- Java, Spring Boot, REST API
- Python, Django
- MySQL, MongoDB
- Docker, Kubernetes
- AWS, GCP

Experience:
Senior Developer at TechCorp (2021-Present)
- Built REST APIs using Spring Boot
- Designed MySQL database schemas
- Deployed Docker containers to Kubernetes

Junior Developer at StartupXYZ (2019-2021)
- Developed Python scripts
- Worked with MongoDB

Education:
B.Tech Computer Science, XYZ University (2019)
`;

const testJD = `
Job Title: Senior Backend Developer

Required Skills:
- 5+ years of Java development
- Spring Boot experience
- REST API design
- MySQL and MongoDB
- Docker and Kubernetes
- AWS cloud services

Responsibilities:
- Design and develop scalable REST APIs
- Optimize database performance
- Deploy applications using Docker
- Mentor junior developers

Nice to Have:
- Python experience
- GCP experience
- Microservices architecture
`;

async function runTest() {
  try {
    console.log('🧪 Testing analyzer...\n');
    const result = await analyzeResumeWithSemanticMatching(testResume, testJD);
    
    console.log('✅ Analysis successful!\n');
    console.log('Matched Keywords:', result.matchedKeywords);
    console.log('Missing Keywords:', result.missingKeywords);
    console.log('Scores:', result.scores);
    console.log('Method:', result.analysisMethod);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    console.error('Full error:', err);
  }
}

runTest();
