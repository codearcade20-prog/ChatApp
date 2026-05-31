export const enhanceMessage = async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: 'Please provide message content to enhance.' });
  }

  const apiKey = process.env.SAMBANOVA_API_KEY;
  const model = process.env.SAMBANOVA_MODEL || 'Meta-Llama-3.3-70B-Instruct';

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'SambaNova API Key is not configured on server.' });
  }

  try {
    const systemPrompt = `You are a professional assistant. Enhance the following message to make it clear, polite, and effective for a business/WhatsApp message. Keep it relatively concise, use paragraph breaks if necessary, and preserve all core details (such as dates, links, names, and contact details). If there are emojis, you can use them appropriately to make it engaging but keep it highly professional. Do not add any conversational intros or outros (like "Sure, here is the enhanced message:") – return ONLY the final enhanced message text.`;

    const response = await fetch('https://api.sambanova.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('SambaNova API error:', errText);
      return res.status(response.status).json({ success: false, error: `SambaNova API error: ${response.statusText}` });
    }

    const data = await response.json();
    const enhancedText = data.choices?.[0]?.message?.content?.trim() || '';

    return res.json({
      success: true,
      data: {
        enhancedMessage: enhancedText
      }
    });
  } catch (err) {
    console.error('enhanceMessage error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error during enhancement.' });
  }
};

export const predictCompletion = async (req, res) => {
  const { message } = req.body;
  const draft = (message || '').trim();

  const apiKey = process.env.SAMBANOVA_API_KEY;
  const model = process.env.SAMBANOVA_MODEL || 'Meta-Llama-3.3-70B-Instruct';

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'SambaNova API Key is not configured on server.' });
  }

  try {
    let systemPrompt = '';
    let messages = [];

    if (!draft) {
      return res.json({
        success: true,
        data: {
          completion: 'Hi! Hope you are doing well. I wanted to reach out and let you know that'
        }
      });
    } else {
      systemPrompt = `You are an AI text-completion copilot. The user is typing a message to be sent via WhatsApp.
Your task is to predict the next few words or sentences to complete the message.
You must output ONLY the completion text (the remaining part of the sentence or next sentence) that should be appended to the user's input.
Rules:
1. Do NOT repeat the user's input.
2. The completion should fit naturally and seamlessly immediately after the user's input.
3. Be highly concise (maximum 10-15 words).
4. Do NOT say "Here is the completion:" or add any other conversational text.
5. Provide ONLY the drop-in completion text itself.

User's draft so far:
"""${draft}"""

Provide the text to append:`;

      messages = [{ role: 'user', content: systemPrompt }];
    }

    const response = await fetch('https://api.sambanova.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.2,
        max_tokens: 40
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('SambaNova API autocomplete error:', errText);
      return res.status(response.status).json({ success: false, error: 'SambaNova completion failed' });
    }

    const data = await response.json();
    let completionText = data.choices?.[0]?.message?.content || '';

    // Clean up any leading/trailing quotes or spaces that the model might wrap it with
    completionText = completionText.trim();
    if (completionText.startsWith('"') && completionText.endsWith('"')) {
      completionText = completionText.substring(1, completionText.length - 1);
    }
    if (completionText.startsWith("'") && completionText.endsWith("'")) {
      completionText = completionText.substring(1, completionText.length - 1);
    }

    return res.json({
      success: true,
      data: {
        completion: completionText
      }
    });
  } catch (err) {
    console.error('predictCompletion error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error during completion.' });
  }
};

export const generateFromPrompt = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Please provide a prompt/topic to generate from.' });
  }

  const apiKey = process.env.SAMBANOVA_API_KEY;
  const model = process.env.SAMBANOVA_MODEL || 'Meta-Llama-3.3-70B-Instruct';

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'SambaNova API Key is not configured on server.' });
  }

  try {
    const systemPrompt = `You are a helpful automation assistant. Draft a complete, professional, and clear WhatsApp message based on the user's short topic or instructions. Make sure the output is ready to be sent, visually clean, using appropriate spacing and bullet points if needed. You may include professional emojis. Do not add any conversational intros or outros like "Here is your message:" – return ONLY the final message content itself.`;

    const response = await fetch('https://api.sambanova.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('SambaNova API generate error:', errText);
      return res.status(response.status).json({ success: false, error: 'SambaNova generation failed' });
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content?.trim() || '';

    return res.json({
      success: true,
      data: {
        generatedMessage: generatedText
      }
    });
  } catch (err) {
    console.error('generateFromPrompt error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error during generation.' });
  }
};

export const checkGrammar = async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: 'Please provide message content to check grammar.' });
  }

  const apiKey = process.env.SAMBANOVA_API_KEY;
  const model = process.env.SAMBANOVA_MODEL || 'Meta-Llama-3.3-70B-Instruct';

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'SambaNova API Key is not configured on server.' });
  }

  try {
    const systemPrompt = `You are a professional editor. Correct any spelling, punctuation, and grammar errors in the following message. Keep the tone, style, and vocabulary exactly the same as the original message—only fix genuine errors. Do not rewrite, polish, or formalize the text. Do not add any conversational introductions, explanations, or notes. Output ONLY the corrected text. If the input has no errors, output the exact original text.`;

    const response = await fetch('https://api.sambanova.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('SambaNova API grammar error:', errText);
      return res.status(response.status).json({ success: false, error: 'SambaNova grammar check failed' });
    }

    const data = await response.json();
    const correctedText = data.choices?.[0]?.message?.content?.trim() || '';

    return res.json({
      success: true,
      data: {
        correctedMessage: correctedText
      }
    });
  } catch (err) {
    console.error('checkGrammar error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error during grammar check.' });
  }
};

