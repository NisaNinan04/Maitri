chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    if(request.action==="checkText"){
        fetch("http://127.0.0.1:5000/predict",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
                text:request.text
            })
        })
        .then(response=>{
            if(!response.ok)throw new Error("HTTP "+response.status);
            return response.json();
        })
        .then(result=>{
            sendResponse(result);
        })
        .catch(error=>{
            console.error("Flask prediction error:",error);
            sendResponse({
                error:"Flask server is not running"
            });
        });

        return true;
    }

    if(request.action==="sendFeedback"){
        fetch("http://127.0.0.1:5000/feedback",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(request.feedback)
        })
        .then(response=>{
            if(!response.ok)throw new Error("HTTP "+response.status);
            return response.json();
        })
        .then(result=>{
            sendResponse(result);
        })
        .catch(error=>{
            console.error("Feedback error:",error);
            sendResponse({
                error:"Could not save feedback"
            });
        });

        return true;
    }
});