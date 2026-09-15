# HATE SPEECH AND CYBER BULLYING DETECTOR FOR SOCIAL MEDIA

## 📌 About the Project
**Hate Speech and Cyber Bullying Detector for Social Media** is a machine learning-based system designed to identify **hateful and harmful Marathi text on social media**.
The system analyzes the text written by a user and classifies it into two categories:
* **Hate** – Text containing hateful or harmful content.
* **Not Hate** – Normal text that does not contain hate speech.
The main goal of the project is to help identify harmful content automatically and make social media communication safer.
The project uses a **BERT-based model** trained for Marathi hate speech detection and connects it with a **browser extension** so that text can be checked easily.

## 🎯 Objective
The objective of this project is to:
* Detect hate speech in Marathi text.
* Identify potentially harmful social media content.
* Provide quick detection through a browser extension.
* Use a Marathi language model to better understand Marathi text.
* Help users become aware of harmful content.

## 🛠️ Tech Stack

| Technology                    | Use                             |
| ----------------------------- | ------------------------------- |
| **Python**                    | Backend and model processing    |
| **BERT**                      | Hate speech detection           |
| **PyTorch**                   | Running the BERT model          |
| **Hugging Face Transformers** | Loading and using the model     |
| **Flask**                     | Backend API                     |
| **HTML**                      | Extension interface             |
| **CSS**                       | Extension design                |
| **JavaScript**                | Browser extension functionality |
| **Git & GitHub**              | Version control                 |

# 📊 Dataset
## L3Cube-MahaHate
The project uses the **L3Cube-MahaHate** Marathi Hate Speech Detection dataset developed by **L3Cube Pune**.
The dataset contains Marathi tweets collected from social media and manually labelled for hate speech detection. We use the **2-class version** for this project.

### Dataset Link
https://github.com/l3cube-pune/MarathiNLP/tree/main/L3Cube-MahaHate/2-class

### Dataset Size
The 2-class MahaHate dataset contains approximately:
**37,500 Marathi text samples**
The two classes are:
| Label    | Meaning                      |
| -------- | ---------------------------- |
| **Hate** | Hateful or harmful content   |
| **Not**  | Normal / non-hateful content |
The binary dataset contains **18,750 hateful** and **18,750 non-hateful** samples.

### Dataset Features
The dataset mainly contains two important fields:

| Feature          | Description                                    |
| ---------------- | ---------------------------------------------- |
| **Text / Tweet** | Marathi social media text                      |
| **Label**        | Indicates whether the text is Hate or Not Hate |

# 🤖 Algorithm Used – BERT
The main algorithm used in this project is **BERT (Bidirectional Encoder Representations from Transformers)**.
BERT is a language model that understands the meaning of words by looking at the **words around them**, rather than looking at each word separately.
For Marathi hate speech detection, a Marathi BERT model can understand the context of Marathi sentences and classify them as **Hate** or **Not Hate**.
The L3Cube-MahaHate project provides **MahaHate-BERT**, a MahaBERT model fine-tuned on the MahaHate dataset for two-class hate speech identification.

### Why BERT?
BERT is useful for this project because:
* It understands the context of a sentence.
* It considers surrounding words.
* It works well for text classification.
* Marathi-specific BERT models are available.
* It can be fine-tuned for hate speech detection.

# ⚙️ How the System Works
### 1. User enters text
The user writes or encounters Marathi text on social media.

### 2. Extension collects the text
The browser extension captures the text that needs to be checked.

### 3. Text is sent to the backend
The extension sends the text to the Flask backend.

### 4. Text is processed
The text is converted into a format that can be understood by the BERT model.

### 5. BERT analyzes the text
The BERT model looks at the words and their context to understand the meaning of the text.

### 6. Classification
The model gives one of two results:

```text
HATE
   or
NOT HATE
```

### 7. Result is displayed
The prediction is sent back to the browser extension and shown to the user.