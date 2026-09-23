const processedMessages=new WeakSet();
const pendingMessages=new WeakSet();

function getPlatform(){
    const host=location.hostname;
    if(host.includes("whatsapp"))return"WhatsApp";
    if(host.includes("telegram"))return"Telegram";
    if(host.includes("instagram"))return"Instagram";
    if(host.includes("facebook"))return"Facebook";
    if(host.includes("twitter")||host.includes("x.com"))return"X";
    if(host.includes("youtube"))return"YouTube";
    return"Unknown";
}

function isMarathi(text){
    return/[\u0900-\u097F]/.test(text);
}

function cleanText(text){
    return String(text||"")
        .replace(/https?:\/\/\S+/gi," ")
        .replace(/www\.\S+/gi," ")
        .replace(/\s+/g," ")
        .trim();
}

function extractText(element){
    if(!element)return"";

    const platform=getPlatform();

    if(platform==="YouTube"){
        const youtubeText=element.querySelector("#content-text");
        if(youtubeText){
            return(
                youtubeText.innerText||
                youtubeText.textContent||
                ""
            ).replace(/\s+/g," ").trim();
        }
    }

    const selectors=[
        ".selectable-text",
        '[data-testid="message-text"]',
        '[data-testid="tweetText"]',
        ".message-text",
        ".text-content",
        "#content-text"
    ];

    for(const selector of selectors){
        const nodes=element.querySelectorAll(selector);

        if(nodes.length){
            const text=Array.from(nodes)
                .map(node=>node.innerText||node.textContent||"")
                .join(" ")
                .replace(/\s+/g," ")
                .trim();

            if(text)return text;
        }
    }

    return(
        element.innerText||
        element.textContent||
        ""
    ).replace(/\s+/g," ").trim();
}

function findMessageContainer(element){
    if(!element)return null;

    const platform=getPlatform();

    if(platform==="WhatsApp"){
        return element.closest('[data-testid="msg-container"]')||
            element.closest('[data-pre-plain-text]')||
            element.closest(".copyable-text")||
            element.closest(".message-in")||
            element.closest(".message-out");
    }

    if(platform==="Telegram"){
        return element.closest(".message")||
            element.closest("[data-message-id]");
    }

    if(platform==="X"){
        return element.closest("article");
    }

    if(platform==="Instagram"){
        return element.closest("li")||
            element.closest("div[role='button']");
    }

    if(platform==="Facebook"){
        return element.closest("[role='row']")||
            element.closest("[data-pagelet]");
    }

    if(platform==="YouTube"){
        return element.closest("ytd-comment-thread-renderer")||
            element.closest("ytd-comment-view-model")||
            element.closest("ytd-comment-renderer")||
            element.closest("#content-text");
    }

    return element;
}

function checkMessage(element){
    if(!element)return;

    const message=findMessageContainer(element);

    if(!message)return;
    if(processedMessages.has(message))return;
    if(pendingMessages.has(message))return;

    const text=cleanText(extractText(message));

    if(!text)return;
    if(text.length<2)return;
    if(!isMarathi(text))return;

    processedMessages.add(message);
    pendingMessages.add(message);

    chrome.runtime.sendMessage(
        {
            action:"checkText",
            text:text
        },
        response=>{
            pendingMessages.delete(message);

            if(chrome.runtime.lastError){
                console.log(
                    "Extension error:",
                    chrome.runtime.lastError.message
                );
                return;
            }

            if(!response||response.error){
                console.log(
                    "Prediction error:",
                    response?.error
                );
                return;
            }

            console.log("BERT prediction:",response);

            updateStatistics(response);

            if(
                response.prediction==="HOF"&&
                (
                    response.risk==="HIGH"||
                    response.risk==="MEDIUM"
                )
            ){
                handleHOF(message,response);
            }
        }
    );
}

function scanMessages(root=document){
    const selectors=[
        ".selectable-text",
        '[data-pre-plain-text]',
        '[data-testid="msg-container"]',
        '[data-testid="message-text"]',
        '[data-testid="tweetText"]',
        ".message",
        "[data-message-id]",
        "ytd-comment-thread-renderer",
        "ytd-comment-view-model",
        "ytd-comment-renderer",
        "#content-text"
    ];

    selectors.forEach(selector=>{
        try{
            root.querySelectorAll(selector).forEach(element=>{
                checkMessage(element);
            });
        }catch(error){
            console.log(
                "Scan error:",
                error
            );
        }
    });
}

function processNode(node){
    if(node.nodeType!==Node.ELEMENT_NODE)return;

    checkMessage(node);
    scanMessages(node);
}

function handleHOF(element,result){
    if(element.dataset.hateDetected==="true")return;

    element.dataset.hateDetected="true";
    element.classList.add("marathi-hate-blur");

    createWarning(element,result);
}

function createWarning(element,result){
    const warning=document.createElement("div");

    warning.className="marathi-hate-warning";

    if(result.risk==="MEDIUM"){
        warning.classList.add("risk-medium");
    }else if(result.risk==="HIGH"){
        warning.classList.add("risk-high");
    }

    const confidence=Number(result.confidence);

    warning.innerHTML=`
        <div class="hate-warning-arrow"></div>
        <div class="hate-warning-icon">⚠️</div>
        <div class="hate-warning-title">Potentially Harmful</div>
        <div class="hate-warning-type">Hate Speech / Cyber Bullying</div>
        <div class="hate-warning-risk">Risk: ${escapeHTML(result.risk||"HIGH")}</div>
        <div class="hate-warning-confidence">Confidence: ${
            isNaN(confidence)?"N/A":confidence.toFixed(2)+"%"
        }</div>
        <div class="hate-warning-buttons">
            <button class="hate-view-button">View Message</button>
            <button class="hate-feedback-button">Report Error</button>
        </div>
    `;

    document.body.appendChild(warning);

    let messageHovered=false;
    let warningHovered=false;
    let hideTimer=null;

    function positionWarning(){
        if(!document.body.contains(element)){
            warning.remove();
            return;
        }

        const rect=element.getBoundingClientRect();
        const warningWidth=270;
        const gap=12;
        const screenPadding=10;

        const warningHeight=warning.offsetHeight;

        let left=rect.left+(rect.width/2);

        left=Math.max(
            warningWidth/2+screenPadding,
            Math.min(
                window.innerWidth-warningWidth/2-screenPadding,
                left
            )
        );

        warning.style.left=left+"px";

        const spaceAbove=rect.top-screenPadding;
        const spaceBelow=window.innerHeight-rect.bottom-screenPadding;

        if(
            spaceAbove>=warningHeight+gap||
            spaceAbove>=spaceBelow
        ){
            warning.style.top=
                rect.top-warningHeight-gap+"px";

            warning.classList.remove("warning-below");
            warning.classList.add("warning-above");
        }else{
            warning.style.top=
                rect.bottom+gap+"px";

            warning.classList.remove("warning-above");
            warning.classList.add("warning-below");
        }
    }

    function showWarning(){
        clearTimeout(hideTimer);

        warning.classList.add("show");

        requestAnimationFrame(()=>{
            positionWarning();
        });
    }

    function hideWarning(){
        clearTimeout(hideTimer);

        hideTimer=setTimeout(()=>{
            if(!messageHovered&&!warningHovered){
                warning.classList.remove("show");
            }
        },250);
    }

    element.addEventListener("mouseenter",()=>{
        messageHovered=true;
        showWarning();
    });

    element.addEventListener("mouseleave",()=>{
        messageHovered=false;
        hideWarning();
    });

    warning.addEventListener("mouseenter",()=>{
        warningHovered=true;
        showWarning();
    });

    warning.addEventListener("mouseleave",()=>{
        warningHovered=false;
        hideWarning();
    });

    const viewButton=warning.querySelector(
        ".hate-view-button"
    );

    viewButton.addEventListener("click",event=>{
        event.stopPropagation();

        element.classList.toggle(
            "marathi-hate-reveal"
        );

        if(
            element.classList.contains(
                "marathi-hate-reveal"
            )
        ){
            viewButton.textContent="Hide Message";
        }else{
            viewButton.textContent="View Message";
        }
    });

    const feedbackButton=warning.querySelector(
        ".hate-feedback-button"
    );

    feedbackButton.addEventListener("click",event=>{
        event.stopPropagation();

        feedbackButton.textContent="Saving...";
        feedbackButton.disabled=true;

        const feedbackData={
            text:result.text||extractText(element),
            prediction:result.prediction||"HOF",
            confidence:result.confidence||0,
            risk:result.risk||"UNKNOWN",
            platform:getPlatform()
        };

        chrome.runtime.sendMessage(
            {
                action:"sendFeedback",
                feedback:feedbackData
            },
            response=>{
                if(chrome.runtime.lastError){
                    console.error(
                        "Feedback error:",
                        chrome.runtime.lastError.message
                    );

                    feedbackButton.textContent="Error";
                    feedbackButton.disabled=false;
                    return;
                }

                if(response&&response.success){
                    feedbackButton.textContent="Report Saved";
                    feedbackButton.disabled=true;
                }else{
                    console.error(
                        "Feedback failed:",
                        response?.error
                    );

                    feedbackButton.textContent="Try Again";
                    feedbackButton.disabled=false;
                }
            }
        );
    });

    window.addEventListener(
        "scroll",
        ()=>{
            if(warning.classList.contains("show")){
                positionWarning();
            }
        },
        {passive:true}
    );

    window.addEventListener(
        "resize",
        ()=>{
            if(warning.classList.contains("show")){
                positionWarning();
            }
        }
    );
}

function updateStatistics(result){
    chrome.storage.local.get(
        [
            "totalScanned",
            "totalHOF",
            "totalSafe"
        ],
        data=>{
            const total=
                (data.totalScanned||0)+1;

            const hof=
                (data.totalHOF||0)+
                (result.prediction==="HOF"?1:0);

            const safe=
                (data.totalSafe||0)+
                (result.prediction==="NOT"?1:0);

            chrome.storage.local.set({
                totalScanned:total,
                totalHOF:hof,
                totalSafe:safe
            });
        }
    );
}

function escapeHTML(value){
    return String(value)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

function startObserver(){
    const target=document.documentElement;

    if(!target){
        setTimeout(startObserver,100);
        return;
    }

    const observer=new MutationObserver(
        mutations=>{
            mutations.forEach(mutation=>{
                mutation.addedNodes.forEach(node=>{
                    processNode(node);
                });
            });
        }
    );

    observer.observe(target,{
        childList:true,
        subtree:true
    });

    console.log(
        "Marathi detector observer started"
    );

    scanMessages(document);
}

function start(){
    console.log(
        "Marathi Hate Speech Detector active on "+
        getPlatform()
    );

    startObserver();
}

start();