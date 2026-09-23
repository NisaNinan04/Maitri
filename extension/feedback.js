const API_URL="http://127.0.0.1:5000/feedback";

async function loadFeedback(){
    const container=document.getElementById("reportsContainer");
    const status=document.getElementById("status");

    status.textContent="Loading...";
    container.innerHTML="";

    try{
        const response=await fetch(API_URL);

        if(!response.ok){
            throw new Error("Server returned "+response.status);
        }

        const reports=await response.json();

        if(!Array.isArray(reports)){
            throw new Error("Invalid feedback data");
        }

        displayStatistics(reports);
        displayReports(reports);

        status.textContent=
            reports.length+" report"+
            (reports.length===1?"":"s");

    }catch(error){
        console.error("Feedback error:",error);

        status.textContent="Connection error";

        container.innerHTML=`
            <div class="error">
                Unable to load reported errors.
                <br><br>
                Make sure the Flask server is running.
            </div>
        `;
    }
}

function displayStatistics(reports){
    const total=reports.length;

    const high=reports.filter(
        report=>String(report.risk||"").toUpperCase()==="HIGH"
    ).length;

    const medium=reports.filter(
        report=>String(report.risk||"").toUpperCase()==="MEDIUM"
    ).length;

    document.getElementById("totalReports").textContent=total;
    document.getElementById("highRisk").textContent=high;
    document.getElementById("mediumRisk").textContent=medium;
}

function displayReports(reports){
    const container=document.getElementById("reportsContainer");

    if(!reports.length){
        container.innerHTML=`
            <div class="empty">
                No reported errors yet.
            </div>
        `;
        return;
    }

    reports=reports.slice().reverse();

    reports.forEach(report=>{
        const card=document.createElement("div");

        card.className="report-card";

        const risk=String(
            report.risk||"UNKNOWN"
        ).toUpperCase();

        let riskClass="";

        if(risk==="HIGH"){
            riskClass="risk-high";
        }else if(risk==="MEDIUM"){
            riskClass="risk-medium";
        }else if(risk==="LOW"){
            riskClass="risk-low";
        }else if(risk==="SAFE"){
            riskClass="risk-safe";
        }

        const confidence=Number(report.confidence);

        let confidenceText="N/A";

        if(!isNaN(confidence)){
            confidenceText=confidence.toFixed(2)+"%";
        }

        const date=formatDate(report.time);

        card.innerHTML=`
            <div class="report-top">
                <div class="platform">
                    Platform:
                    ${escapeHTML(report.platform||"Unknown")}
                </div>

                <div class="risk ${riskClass}">
                    ${escapeHTML(risk)}
                </div>
            </div>

            <div class="prediction">
                Prediction:
                <strong>
                    ${escapeHTML(report.prediction||"Unknown")}
                </strong>
            </div>

            <div class="message-label">
                Reported Message
            </div>

            <div class="message">
                ${escapeHTML(
                    report.text||"No text available"
                )}
            </div>

            <div class="report-bottom">
                <span>
                    Reported: ${escapeHTML(date)}
                </span>

                <span class="confidence">
                    Confidence: ${escapeHTML(confidenceText)}
                </span>
            </div>
        `;

        container.appendChild(card);
    });
}

function formatDate(value){
    if(!value){
        return "Unknown";
    }

    const date=new Date(value);

    if(isNaN(date.getTime())){
        return value;
    }

    return date.toLocaleString();
}

function escapeHTML(value){
    return String(value)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

document.getElementById("refreshButton").addEventListener(
    "click",
    loadFeedback
);

loadFeedback();