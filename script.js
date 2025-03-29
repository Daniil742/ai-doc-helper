document.addEventListener('DOMContentLoaded', function () {

	const getActiveChatType = () => {
		const activeTab = document.querySelector('.chat-tab.active');
		return activeTab ? activeTab.getAttribute('data-chat') : 'chatgpt';
	};


	const sendButtons = document.querySelectorAll('.send-btn');
	sendButtons.forEach(btn => {
		btn.addEventListener('click', async function (e) {
			e.preventDefault();

			const activeChatType = getActiveChatType();

			let queryInput;
			if (activeChatType === 'deepseek') {
				queryInput = document.getElementById('query-deepseek');
			} else {
				queryInput = document.getElementById('query-chatgpt');
			}

			const docUrlInput = document.getElementById('doc-url');
			const apiKeyInput = document.getElementById('api-key');

			const docUrl = docUrlInput.value.trim();
			const queryText = queryInput.value.trim();
			const apiKey = apiKeyInput.value.trim();

			docUrlInput.style.border = '1px solid #ccc';
			queryInput.style.border = '1px solid #ccc';
			apiKeyInput.style.border = '1px solid #ccc';

			let missing = false;
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

			if (activeChatType === 'deepseek') {
				if (docUrl) {
					documentationContext = docUrl;
				}
			} else {
				if (docUrl) {
					try {
						const response = await fetch(docUrl);
						if (!response.ok) {
							alert(`Error loading documentation: ${response.status}`);
							return;
						}
						documentationContext = await response.text();

						const parser = new DOMParser();
						const doc = parser.parseFromString(documentationContext, 'text/html');
						doc.querySelectorAll('body script').forEach(script => script.remove());
						documentationContext = doc.body.textContent || "";
					} catch (error) {
						console.error('Error loading documentation:', error);
						alert('There was an error loading the documentation.');
						return;
					}
				}
			}

			const finalPrompt = docUrl
				? `Use the following documentation source:\n${documentationContext}\n\nQuestion:\n${queryText}`
				: `Question:\n${queryText}`;
			console.log('Prepared Request:', finalPrompt);

			let messagesContainer;
			if (activeChatType === 'deepseek') {
				messagesContainer = document.querySelector('#deepseek .chat-messages');
			} else {
				messagesContainer = document.querySelector('#chatgpt .chat-messages');
			}

			const initialMsg = messagesContainer.querySelector('.chat-center');
			if (initialMsg) {
				messagesContainer.removeChild(initialMsg);
			}

			addChatMessage('user', queryText);
			queryInput.value = "";

			const spinnerIndicator = addLoadingIndicator();

			if (activeChatType === 'deepseek') {
				await sendDeepseekRequest(finalPrompt, spinnerIndicator);
			} else {
				await sendDirectChatRequest(finalPrompt, spinnerIndicator);
			}
		});
	});
});

document.addEventListener('DOMContentLoaded', function () {
	const tabs = document.querySelectorAll('.chat-tab');
	const chatWindows = document.querySelectorAll('.chat-window');

	const apiKeyLabel = document.querySelector('label[for="api-key"]');

	tabs.forEach(tab => {
		tab.addEventListener('click', function () {

			tabs.forEach(t => t.classList.remove('active'));
			tab.classList.add('active');

			chatWindows.forEach(win => win.classList.remove('active'));
			const selectedChat = tab.getAttribute('data-chat');
			document.getElementById(selectedChat).classList.add('active');

			if (selectedChat === 'deepseek') {
				apiKeyLabel.textContent = "DeepSeek API Key:";
			} else {
				apiKeyLabel.textContent = "ChatGPT API Key:";
			}
		});
	});
});

async function sendDirectChatRequest(finalPrompt, spinnerIndicator) {

	const apiKey = document.getElementById('api-key').value.trim();
  
	const payload = {
		model: "gpt-4",
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

async function sendDeepseekRequest(finalPrompt, spinnerIndicator) {

	const apiKey = document.getElementById('api-key').value.trim();

	const payload = {
		prompt: finalPrompt,
		context: "You're the technical expert on documentation."
	};

	try {
		const response = await fetch("https://api.deepseek.com", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${apiKey}`
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
		console.log("Reply from DeepSeek:", data);

		if (data.answer) {
			addChatMessage('bot', data.answer);
		} else {
			addChatMessage('bot', "The answer does not contain the required data");
		}
	} catch (error) {
		spinnerIndicator.remove();
		addChatMessage('bot', `Error while executing the query: ${error.message}`);
	}
}

function addChatMessage(role, messageText) {

	const activeChatWindow = document.querySelector('.chat-window.active');
	if (!activeChatWindow) {
		console.error("No active chat window found!");
		return;
	}

	const messagesContainer = activeChatWindow.querySelector('.chat-messages');
	if (!messagesContainer) {
		console.error("No messages container found in the active chat window.");
		return;
	}

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

	const activeChatWindow = document.querySelector('.chat-window.active');
	if (!activeChatWindow) {
		console.error("No active chat window found!");
		return;
	}

	const messagesContainer = activeChatWindow.querySelector('.chat-messages');
	if (!messagesContainer) {
		console.error("No messages container found in the active chat window.");
		return;
	}

	const spinnerDiv = document.createElement('div');
	spinnerDiv.classList.add('chat-message', 'bot-message', 'loading-indicator');
	spinnerDiv.innerHTML = '<div class="spinner"></div>';

	messagesContainer.appendChild(spinnerDiv);
	messagesContainer.scrollTop = messagesContainer.scrollHeight;

	return spinnerDiv;
}
