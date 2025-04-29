# 🚀 Dynamic Form Generator
_A React + TypeScript application that dynamically renders and validates multi-section forms based on API data._

---

## ✨ Features
- 🔐 **Student Login** with Roll Number and Name
- 📄 **Dynamic Form Rendering** via API (`GET /get-form`)
- ✅ **Field Validations** (`required`, `minLength`, `maxLength`, etc.)
- 🧩 **Multi-Section Form Navigation** (Prev / Next)
- 🛡️ **Section-level Validation** — can't move to next section if current one is invalid
- 🖊️ **Dynamic Field Types**: Text, Email, Tel, Dropdown, Radio, Checkbox, etc.
- 📜 **Console logging** of collected form data on final submission
- 🎨 **Clean and minimal UI** — focus on functionality

---

## 📦 Tech Stack
- ⚛️ **React.js** + **TypeScript**
- 🎨 **TailwindCSS** for styling (optional)
- ⚙️ **Next.js** (for server-side rendering, if applicable)
- 🧰 **React Hook Form** — for form management and validation

---

## 🔗 API Endpoints
- `POST /create-user` — Register user with Roll Number and Name  
    - **Request Body:**
      ```json
      {
        "rollNumber": "{INPUT_ROLL_NUMBER}",
        "name": "{INPUT_NAME}"
      }
      ```

- `GET /get-form` — Fetch dynamic form structure using Roll Number  
    - **Request URL:**
      ```
      GET /get-form?rollNumber={INPUT_ROLL_NUMBER}
      ```

---

## 🛠️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/your-repo.git
