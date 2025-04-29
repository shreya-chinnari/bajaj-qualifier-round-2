🚀 Dynamic Form Generator
_A React + TypeScript application that dynamically renders and validates multi-section forms based on API data._

**✨ Features**
  🔐 Student Login with Roll Number and Name
  📄 Dynamic Form Rendering via API (GET /get-form)
  ✅ Field Validations (required, minLength, maxLength, etc.)
  🧩 Multi-Section Form Navigation (Prev / Next)
  🛡️ Section-level Validation (can't move to next if invalid)
  🖊️ Dynamic Field Types: Text, Email, Tel, Dropdown, Radio, Checkbox, etc.
  📜 Console logging of complete form data on final submit
  🎨 Clean and minimal UI (focus on functionality)

**📦 Tech Stack : **
  ReactJs + TypeScript + TailwindCSS + NextJS
  React Hook Form (for form management and validation)

**🔗 API Endpoints**
  POST /create-user — Register user with Roll Number and Name
  GET /get-form — Fetch dynamic form structure using Roll Number
