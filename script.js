document.addEventListener('DOMContentLoaded', function() {

      const btn = document.querySelector('.btn');
      btn.addEventListener('click', async function(e) {
        e.preventDefault();

        const docUrlInput = document.getElementById('doc-url');
        const queryInput = document.getElementById('query');
        const apiKeyInput = document.getElementById('api-key');

        const docUrl = docUrlInput.value.trim();
        const queryText = queryInput.value.trim();
        const apiKey = apiKeyInput.value.trim();

        docUrlInput.style.border = '1px solid #ccc';
        queryInput.style.border = '1px solid #ccc';
        apiKeyInput.style.border = '1px solid #ccc';

        let missing = false;

        if (!docUrl) {
          docUrlInput.style.border = '2px solid red';
          missing = true;
        }
        if (!apiKey) {
          apiKeyInput.style.border = '2px solid red';
          missing = true;
        }
        if (!queryText) {
          queryInput.style.border = '2px solid red';
          missing = true;
        }

        if (missing) {
          alert('Please fill in all fields!');
          return;
        }

        let documentationContext = '';

        try {
          const response = await fetch(docUrl);
          if (!response.ok) {
            alert(`Error loading documentation: ${response.status}`);
            return;
          }
          documentationContext = await response.text();
        } catch (error) {
          console.error('Error loading documentation:', error);
          alert('There was an error loading the documentation.');
          return;
        }

        const finalPrompt = `Documentation:\n${documentationContext}\n\Question:\n${queryText}`;
        console.log('Prepared Request:', finalPrompt);

        alert('The request has been generated! Check the browser console.');
      });
    });

async function sendDirectChatRequest(finalPrompt) {

  const apiKey = document.getElementById('api-key').value.trim();
  
  const payload = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You're the technical expert on documentation." },
      { role: "user", content: finalPrompt }
    ]
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || "Request error");
    }

    const data = await response.json();
    console.log("Reply from ChatGPT:", data);
    // Here we need to process the response: display it on the page, for example in a div or textarea.
  } catch (error) {
    console.error("Error while executing the query:", error);
    alert(`Error: ${error.message}`);
  }
}
