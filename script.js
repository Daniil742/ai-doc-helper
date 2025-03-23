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

        	//if (!docUrl) {
		//	docUrlInput.style.border = '2px solid red';
		//	missing = true;
		//}
		
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
		
		const finalPrompt = !docUrl ? `Question:\n${queryText}` : `Use the following documentation source:\n${docUrl}\n\nQuestion:\n${queryText}`;
		console.log('Prepared Request:', finalPrompt);
            
		const messagesContainer = document.getElementById('chat-messages');
		const initialMsg = messagesContainer.querySelector('.chat-center');
		if (initialMsg) {
			messagesContainer.removeChild(initialMsg);
		}
            
		//alert('The request has been generated! Check the browser console.');
		addChatMessage('user', queryText);
		queryInput.value = "";

		const spinnerIndicator = addLoadingIndicator();
            
		await sendDirectChatRequest(finalPrompt, spinnerIndicator);
	});
});

async function sendDirectChatRequest(finalPrompt, spinnerIndicator) {
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
				"Authorization": `Bearer ${apiKey}`,
				//"Access-Control-Allow-Origin": "https://daniil742.github.io"
			},
			body: JSON.stringify(payload)
		});

		spinnerIndicator.remove();
        
		if (!response.ok) {
			const errorData = await response.json();
			addChatMessage('bot', `Error: ${errorData.error.message || "Request error"}`);
			throw new Error(errorData.error.message || "Request error");
		}

		const data = await response.json();
		console.log("Reply from ChatGPT:", data);
		if (data.choices && data.choices.length > 0 && data.choices[0].message) {
			const answer = data.choices[0].message.content;
			addChatMessage('bot', answer);
		} else {
			addChatMessage('bot', "The answer does not contain the required data");
		}

	} catch (error) {
		//console.error("Error while executing the query:", error);
		//alert(`Error: ${error.message}`);
		spinnerIndicator.remove();
		addChatMessage('bot', `Error while executing the query: ${error.message}`);
	}
}

function addChatMessage(role, messageText) {

	const messagesContainer = document.getElementById('chat-messages');
  	const messageDiv = document.createElement('div');
	messageDiv.classList.add('chat-message');

	if (role === 'user') {
		messageDiv.classList.add('user-message');
	} else if (role === 'bot') {
		messageDiv.classList.add('bot-message');
	}
  
	messageDiv.textContent = messageText;
  
	messagesContainer.appendChild(messageDiv);
  
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addLoadingIndicator() {
	const messagesContainer = document.getElementById('chat-messages');
	const spinnerDiv = document.createElement('div');

	spinnerDiv.classList.add('chat-message', 'bot-message', 'loading-indicator');
	spinnerDiv.innerHTML = '<div class="spinner"></div>';
  
	messagesContainer.appendChild(spinnerDiv);
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
	return spinnerDiv;
}
