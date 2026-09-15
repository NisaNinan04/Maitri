from flask import Flask,request,jsonify
from flask_cors import CORS
import torch
from transformers import AutoTokenizer,AutoModelForSequenceClassification
import os
import json
from datetime import datetime

app=Flask(__name__)
CORS(app)

BASE_DIR=os.path.dirname(os.path.abspath(__file__))
MODEL_PATH=os.path.join(BASE_DIR,"model","marathi_hate_bert")
FEEDBACK_FILE=os.path.join(BASE_DIR,"feedback.json")

print("Model path:",MODEL_PATH)
print("Model exists:",os.path.exists(MODEL_PATH))

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError("Model folder not found: "+MODEL_PATH)

tokenizer=AutoTokenizer.from_pretrained(MODEL_PATH,local_files_only=True)
model=AutoModelForSequenceClassification.from_pretrained(MODEL_PATH,local_files_only=True)
model.eval()

print("BERT model loaded successfully")

@app.route("/",methods=["GET"])
def home():
    return jsonify({
        "status":"running",
        "message":"Marathi Hate Speech Detection API is running"
    })

@app.route("/predict",methods=["POST"])
def predict():
    data=request.get_json()

    if not data or "text" not in data:
        return jsonify({"error":"Text is required"}),400

    text=str(data["text"]).strip()

    if not text:
        return jsonify({"error":"Text cannot be empty"}),400

    inputs=tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128
    )

    with torch.no_grad():
        outputs=model(**inputs)
        probabilities=torch.softmax(outputs.logits,dim=1)

    prediction=torch.argmax(probabilities,dim=1).item()

    hof_probability=probabilities[0][1].item()*100
    not_probability=probabilities[0][0].item()*100

    if prediction==1:
        label="HOF"
        confidence=hof_probability
    else:
        label="NOT"
        confidence=not_probability

    if label=="HOF":
        if confidence>=80:
            risk="HIGH"
        elif confidence>=60:
            risk="MEDIUM"
        else:
            risk="LOW"
    else:
        risk="SAFE"

    return jsonify({
        "text":text,
        "prediction":label,
        "confidence":round(confidence,2),
        "hof_probability":round(hof_probability,2),
        "not_probability":round(not_probability,2),
        "risk":risk
    })

@app.route("/feedback",methods=["POST"])
def feedback():
    data=request.get_json()

    if not data:
        return jsonify({"error":"No feedback data received"}),400

    feedback_entry={
        "text":data.get("text",""),
        "prediction":data.get("prediction",""),
        "confidence":data.get("confidence",0),
        "risk":data.get("risk",""),
        "platform":data.get("platform","Unknown"),
        "feedback":"incorrect",
        "time":datetime.now().isoformat()
    }

    if os.path.exists(FEEDBACK_FILE):
        try:
            with open(FEEDBACK_FILE,"r",encoding="utf-8") as file:
                feedback_data=json.load(file)

            if not isinstance(feedback_data,list):
                feedback_data=[]

        except:
            feedback_data=[]
    else:
        feedback_data=[]

    feedback_data.append(feedback_entry)

    with open(FEEDBACK_FILE,"w",encoding="utf-8") as file:
        json.dump(feedback_data,file,ensure_ascii=False,indent=4)

    print("Feedback saved:",feedback_entry)

    return jsonify({
        "success":True,
        "message":"Feedback saved successfully"
    })

if __name__=="__main__":
    app.run(host="127.0.0.1",port=5000,debug=False)